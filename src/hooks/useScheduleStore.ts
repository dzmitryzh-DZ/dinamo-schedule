import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cloneData,
  DEFAULT_DATA,
  ensureDayAfterToday,
  LANG_KEY,
  loadData,
  saveData,
} from "../data/storage";
import {
  clearSharedProject,
  fetchSharedProject,
  hydrateStore,
  persistStore,
  pullIfSharedNewer,
  stashConflictStore,
  type SyncState,
} from "../data/yandexSync";
import type { AppView, Lang, ScheduleStore, TrainingDay } from "../data/types";
import { getUi } from "../i18n/ui";

export function readLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "ru") return stored;
  } catch {
    /* storage unavailable */
  }
  return "ru";
}

export type StatusMessage = { text: string; ok?: boolean };

const PERSIST_DEBOUNCE_MS = 400;
const COALESCE_MS = 800;
const HISTORY_LIMIT = 50;

export type MutateOptions = {
  message?: string;
  /** Legacy flag: true = debounced network write; otherwise immediate. */
  silent?: boolean;
  /** Undo coalescing: edits with the same key within COALESCE_MS merge. */
  coalesceKey?: string;
  /** Do not record an undo step (view-only changes, tomorrow padding). */
  skipHistory?: boolean;
  /** Wipe undo/redo stacks (full replacement: reset / import). */
  clearHistory?: boolean;
};

/** History clone without base64 logos (restored from the live state by
 * id when the snapshot is applied). */
function historySnapshot(store: ScheduleStore): ScheduleStore {
  const snap = cloneData(store);
  if (snap.teams) {
    snap.teams = snap.teams.map((team) =>
      team.logo ? { ...team, logo: "" } : team
    );
  }
  if (snap.monthActivities) {
    snap.monthActivities = snap.monthActivities.map((activity) =>
      activity.logo ? { ...activity, logo: "" } : activity
    );
  }
  if (snap.monthKindLogos) snap.monthKindLogos = {};
  return snap;
}

function restoreLogosFrom(
  snapshot: ScheduleStore,
  source: ScheduleStore
): ScheduleStore {
  if (snapshot.teams && source.teams) {
    const logos = new Map(source.teams.map((team) => [team.id, team.logo]));
    snapshot.teams = snapshot.teams.map((team) => {
      if (!team.logo) {
        const current = logos.get(team.id);
        if (current) return { ...team, logo: current };
      }
      return team;
    });
  }
  if (snapshot.monthActivities && source.monthActivities) {
    const logos = new Map(
      source.monthActivities.map((activity) => [activity.id, activity.logo])
    );
    snapshot.monthActivities = snapshot.monthActivities.map((activity) => {
      if (!activity.logo) {
        const current = logos.get(activity.id);
        if (current) return { ...activity, logo: current };
      }
      return activity;
    });
  }
  if (!snapshot.monthKindLogos || !Object.keys(snapshot.monthKindLogos).length) {
    snapshot.monthKindLogos = { ...(source.monthKindLogos ?? {}) };
  }
  return snapshot;
}

export function useScheduleStore() {
  const [lang, setLang] = useState<Lang>(readLang);
  const [view, setView] = useState<AppView>("day");
  // loadData() is called exactly once (lazy state initializer).
  const [data, setDataState] = useState<ScheduleStore>(() => loadData());
  const [status, setStatus] = useState<StatusMessage>({ text: "" });
  const [sync, setSyncState] = useState<SyncState>("idle");
  const [preview, setPreviewState] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const ui = useMemo(() => getUi(lang), [lang]);
  const editing = !preview;

  const dataRef = useRef(data);
  const dataJsonRef = useRef(""); // last applied serialization (no-op probe)
  const dirtyRef = useRef(false); // data changed since the last successful push
  const baseRevRef = useRef<number | null>(null);
  const bootedRef = useRef(false); // StrictMode double-invoke guard
  const persistTimer = useRef(0);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const coalesceRef = useRef<{ key: string; at: number } | null>(null);
  const historyRef = useRef<{ past: ScheduleStore[]; future: ScheduleStore[] }>({
    past: [],
    future: [],
  });
  const syncRef = useRef<SyncState>("idle");

  // previewRef has a single owner: setPreview updates ref + state together,
  // so imperative readers (print/pdf flows) never see a stale mirror.
  const previewRef = useRef(false);
  const setPreview = useCallback((value: boolean) => {
    previewRef.current = value;
    setPreviewState(value);
  }, []);

  const setSync = useCallback((next: SyncState) => {
    syncRef.current = next;
    setSyncState(next);
  }, []);

  const flash = useCallback((text: string, ok = false) => {
    setStatus({ text, ok });
  }, []);

  const updateHistoryFlags = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  }, []);

  /** Replace the store in memory + localStorage synchronously. */
  const applyStore = useCallback(
    (next: ScheduleStore, json?: string): void => {
      const serialized = json ?? JSON.stringify(next);
      dataRef.current = next;
      dataJsonRef.current = serialized;
      setDataState(next);
      try {
        saveData(next); // synchronous local save on every change
      } catch {
        setSync("error"); // QuotaExceeded: surfaces, never breaks the UI
      }
    },
    [setSync]
  );

  /** One in-flight PUT + a queued flag — never parallel writes. */
  const queueNetworkPersist = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    let finalSync: SyncState | null = null;
    try {
      while (dirtyRef.current) {
        queuedRef.current = false;
        const result = await persistStore(dataRef.current, baseRevRef.current);
        if (result.sync === "synced") {
          dirtyRef.current = false;
          if (result.rev !== null) baseRevRef.current = result.rev;
          finalSync = "synced";
        } else if (result.conflict) {
          // 409: stash the local copy for the user, adopt the server version.
          stashConflictStore(dataRef.current);
          const shared = await fetchSharedProject();
          if (shared.status === "ok") {
            baseRevRef.current = shared.rev;
            dirtyRef.current = false;
            coalesceRef.current = null;
            applyStore(shared.store);
          } else if (result.rev !== null) {
            baseRevRef.current = result.rev;
          }
          finalSync = "conflict";
          break;
        } else {
          finalSync = result.sync; // local-only / error: dirty stays for retry
          break;
        }
      }
    } finally {
      inFlightRef.current = false;
    }
    if (finalSync) setSync(finalSync);
    if (finalSync === "conflict") {
      setStatus({ text: getUi(readLang()).syncConflict, ok: false });
    }
    if (queuedRef.current && dirtyRef.current) void queueNetworkPersist();
  }, [applyStore, setSync]);

  const scheduleNetworkPersist = useCallback(
    (mode: "debounce" | "immediate") => {
      dirtyRef.current = true;
      if (mode === "debounce") {
        window.clearTimeout(persistTimer.current);
        persistTimer.current = window.setTimeout(() => {
          void queueNetworkPersist();
        }, PERSIST_DEBOUNCE_MS);
        return;
      }
      window.clearTimeout(persistTimer.current);
      void queueNetworkPersist();
    },
    [queueNetworkPersist]
  );

  const flushPersist = useCallback(async () => {
    window.clearTimeout(persistTimer.current);
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    if (!dirtyRef.current) return;
    await queueNetworkPersist();
  }, [queueNetworkPersist]);

  const persistNow = useCallback(
    async (options?: { message?: string; silent?: boolean }) => {
      await flushPersist();
      if (options?.silent) return;
      if (options?.message) {
        flash(options.message, true);
        return;
      }
      flash(syncRef.current === "synced" ? ui.syncSaved : ui.syncLocalOnly, true);
    },
    [flushPersist, flash, ui.syncSaved, ui.syncLocalOnly]
  );

  /**
   * Record history, swap the store (sync local save) and queue the
   * debounced/immediate network write. Returns false for content no-ops.
   */
  const commit = useCallback(
    (
      next: ScheduleStore,
      options?: MutateOptions & {
        previousForHistory?: ScheduleStore;
        json?: string;
      }
    ): boolean => {
      const serialized = options?.json ?? JSON.stringify(next);
      if (serialized === dataJsonRef.current) {
        // Content no-op: no history step, no identity change, no PUT.
        if (options?.message) flash(options.message, true);
        return false;
      }

      const previous = options?.previousForHistory ?? dataRef.current;
      if (options?.clearHistory) {
        historyRef.current.past = [];
        historyRef.current.future = [];
        coalesceRef.current = null;
      } else if (!options?.skipHistory) {
        const now = Date.now();
        const key = options?.coalesceKey;
        const last = coalesceRef.current;
        const coalesce =
          Boolean(key) &&
          last !== null &&
          last.key === key &&
          now - last.at < COALESCE_MS;
        if (!coalesce) {
          historyRef.current.past.push(historySnapshot(previous));
          if (historyRef.current.past.length > HISTORY_LIMIT) {
            historyRef.current.past.shift();
          }
          historyRef.current.future = [];
        }
        coalesceRef.current = key ? { key, at: now } : null;
      }
      updateHistoryFlags();
      applyStore(next, serialized);
      scheduleNetworkPersist(options?.silent ? "debounce" : "immediate");
      return true;
    },
    [applyStore, flash, scheduleNetworkPersist, updateHistoryFlags]
  );

  const mutateStore = useCallback(
    (
      updater: (current: ScheduleStore) => ScheduleStore,
      options?: MutateOptions
    ): boolean => {
      const previous = dataRef.current;
      const next = updater(cloneData(previous));
      const applied = commit(next, { ...options, previousForHistory: previous });
      if (applied && options?.message) flash(options.message, true);
      return applied;
    },
    [commit, flash]
  );

  // --- DOM chrome: body classes + document title (CSS reads these) ---
  useEffect(() => {
    document.body.classList.toggle("lang-en", lang === "en");
    document.body.classList.toggle("lang-ru", lang === "ru");
    document.body.classList.toggle("is-editing", editing);
    document.title =
      lang === "en"
        ? "HC Dinamo-Minsk — Daily Schedule"
        : "ХК Динамо-Минск — Расписание дня";
  }, [lang, editing]);

  // --- startup hydrate: idempotent in StrictMode; server wins when clean ---
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      const local = dataRef.current;
      const result = await hydrateStore(local, { dirty: dirtyRef.current });
      if (result.rev !== null) baseRevRef.current = result.rev;

      const overriddenByEdits = result.fromShared && dirtyRef.current;
      const winner = overriddenByEdits ? dataRef.current : result.store;
      const ensured = ensureDayAfterToday(winner);
      applyStore(ensured.store);
      setSync(overriddenByEdits ? "local-only" : result.sync);
      if (ensured.changed) scheduleNetworkPersist("debounce");
      if (result.sync === "error") {
        flash(
          readLang() === "ru"
            ? "Файл проекта повреждён или требует более новой версии — показаны локальные данные."
            : "The project file is corrupted or needs a newer app version — showing local data.",
          false
        );
      } else if (result.fromShared && !overriddenByEdits) {
        flash(getUi(readLang()).syncLoaded, true);
      }
    })();
  }, [applyStore, flash, scheduleNetworkPersist, setSync]);

  // --- focus: pull first; push only dirty data. pagehide/hidden: flush ---
  useEffect(() => {
    let cancelled = false;
    async function syncOnFocus() {
      if (cancelled || document.visibilityState !== "visible") return;
      const pulled = await pullIfSharedNewer(baseRevRef.current, {
        dirty: dirtyRef.current,
      });
      if (cancelled) return;
      if (pulled) {
        baseRevRef.current = pulled.rev;
        dirtyRef.current = false;
        coalesceRef.current = null;
        applyStore(pulled.store);
        setSync("synced");
        setStatus({ text: getUi(readLang()).syncUpdated, ok: true });
        return;
      }
      // Push happens only when local data changed since the last sync.
      if (dirtyRef.current) {
        window.clearTimeout(persistTimer.current);
        void queueNetworkPersist();
      }
    }
    function flushOnExit() {
      window.clearTimeout(persistTimer.current);
      if (dirtyRef.current) void queueNetworkPersist();
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") {
        flushOnExit();
        return;
      }
      void syncOnFocus();
    }
    window.addEventListener("focus", syncOnFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushOnExit);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", syncOnFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushOnExit);
      window.clearTimeout(persistTimer.current);
    };
  }, [applyStore, queueNetworkPersist, setSync]);

  const undo = useCallback(() => {
    const { past, future } = historyRef.current;
    const previous = past.pop();
    if (!previous) {
      updateHistoryFlags();
      return;
    }
    future.push(historySnapshot(dataRef.current));
    coalesceRef.current = null;
    updateHistoryFlags();
    commit(restoreLogosFrom(cloneData(previous), dataRef.current), {
      skipHistory: true,
    });
  }, [commit, updateHistoryFlags]);

  const redo = useCallback(() => {
    const { past, future } = historyRef.current;
    const next = future.pop();
    if (!next) {
      updateHistoryFlags();
      return;
    }
    past.push(historySnapshot(dataRef.current));
    coalesceRef.current = null;
    updateHistoryFlags();
    commit(restoreLogosFrom(cloneData(next), dataRef.current), {
      skipHistory: true,
    });
  }, [commit, updateHistoryFlags]);

  // --- hotkeys: event.code survives the Russian keyboard layout ---
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.code === "KeyS") {
        event.preventDefault();
        void persistNow({ message: ui.saved });
        return;
      }
      const target = event.target as HTMLElement | null;
      const inField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (inField) return; // native undo inside fields stays with the browser
      if (event.code === "KeyZ" && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (event.code === "KeyZ") {
        event.preventDefault();
        undo();
      } else if (event.code === "KeyY") {
        event.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, persistNow, ui.saved]);

  const updateActiveDay = useCallback(
    (
      updater: (day: TrainingDay) => TrainingDay,
      options?: MutateOptions
    ) => {
      mutateStore(
        (current) => {
          const index = current.days.findIndex(
            (d) => d.id === current.activeDayId
          );
          if (index < 0) return current;
          current.days[index] = updater(current.days[index]);
          return current;
        },
        { silent: true, ...options }
      );
    },
    [mutateStore]
  );

  const handleLangChange = useCallback((next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const handleViewChange = useCallback(
    (next: AppView) => {
      setView(next);
      if (next === "library") setPreview(false);
      flash("");
    },
    [flash, setPreview]
  );

  const handlePreviewToggle = useCallback(() => {
    if (previewRef.current) {
      setPreview(false);
      return;
    }
    void flushPersist();
    setPreview(true);
  }, [flushPersist, setPreview]);

  const handleDayChange = useCallback(
    (id: string) => {
      mutateStore(
        (current) => {
          if (current.activeDayId === id) return current;
          current.activeDayId = id;
          return current;
        },
        { silent: true, skipHistory: true }
      );
      flash("");
    },
    [mutateStore, flash]
  );

  const handleReset = useCallback(async () => {
    if (!confirm(ui.confirmReset)) return;
    try {
      await clearSharedProject();
    } catch {
      /* ignore */
    }
    baseRevRef.current = null;
    const applied = mutateStore(() => cloneData(DEFAULT_DATA), {
      message: ui.resetDone,
      clearHistory: true,
    });
    if (!applied) {
      // Server file was just deleted while the store is unchanged: recreate.
      dirtyRef.current = true;
      void queueNetworkPersist();
    }
  }, [mutateStore, queueNetworkPersist, ui.confirmReset, ui.resetDone]);

  return {
    lang,
    view,
    data,
    status,
    sync,
    preview,
    editing,
    ui,
    canUndo,
    canRedo,
    undo,
    redo,
    previewRef,
    setPreview,
    flash,
    persistNow,
    flushPersist,
    mutateStore,
    updateActiveDay,
    handleLangChange,
    handleViewChange,
    handlePreviewToggle,
    handleDayChange,
    handleReset,
  };
}

export type ScheduleStoreApi = ReturnType<typeof useScheduleStore>;
