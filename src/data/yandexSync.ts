import type { ScheduleStore } from "./types";
import { saveData } from "./storage";
import { parseProjectFile, serializeProject } from "../utils/projectFile";

/**
 * Синхронизация проекта через Яндекс.Диск (REST API, OAuth-токен).
 * Файл лежит в папке приложения: app:/schedule.json
 * Токен хранится только в localStorage этого браузера.
 */

const API_BASE = "https://cloud-api.yandex.net/v1/disk";
const FILE_PATH = "app:/schedule.json";
const FETCH_TIMEOUT_MS = 15000;

export const TOKEN_KEY = "dinamo-schedule-yandex-token";
export const SHARED_AT_KEY = "dinamo-schedule-shared-at";
export const LOCAL_AT_KEY = "dinamo-schedule-local-at";
export const CONFLICT_KEY = "dinamo-schedule-conflict";

export type SyncState =
  | "idle"
  | "synced"
  | "local-only"
  | "error"
  /** На Диске другая ревизия: локальная копия сохранена под CONFLICT_KEY, загружена версия с Диска. */
  | "conflict";

export type FetchOutcome =
  | { status: "ok"; store: ScheduleStore; rev: number | null; savedAt: number | null }
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "unsupported"; rev: number | null; savedAt: number | null }
  | { status: "unreachable" };

export type PushOutcome =
  | { conflict: false; rev: number | null; savedAt: number | null }
  | { conflict: true; rev: number | null };

/* ------------------------------ token ---------------------------------- */

export function getYandexToken(): string {
  try {
    return (localStorage.getItem(TOKEN_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function hasYandexToken(): boolean {
  return Boolean(getYandexToken());
}

export function setYandexToken(token: string): void {
  try {
    const value = token.trim();
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------ http ----------------------------------- */

function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(FETCH_TIMEOUT_MS)
    : undefined;
}

class HttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = getYandexToken();
  if (!token) throw new HttpError(0);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `OAuth ${token}`, ...(init?.headers ?? {}) },
    signal: timeoutSignal(),
    cache: "no-store",
  });
  return res;
}

type DiskMeta = { revision: number | null; modified: number | null };

function readMeta(value: unknown): DiskMeta {
  const rec = (value ?? {}) as Record<string, unknown>;
  const revision =
    typeof rec.revision === "number" && Number.isFinite(rec.revision)
      ? rec.revision
      : null;
  const modifiedRaw = typeof rec.modified === "string" ? rec.modified : "";
  const modifiedMs = modifiedRaw ? Date.parse(modifiedRaw) : NaN;
  return { revision, modified: Number.isFinite(modifiedMs) ? modifiedMs : null };
}

/** Метаданные файла; null — файла нет (404). Бросает HttpError при прочих сбоях. */
async function getFileMeta(): Promise<DiskMeta | null> {
  const res = await apiFetch(
    `${API_BASE}/resources?path=${encodeURIComponent(FILE_PATH)}&fields=revision,modified`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(res.status);
  return readMeta(await res.json());
}

async function downloadFileText(): Promise<string> {
  const res = await apiFetch(
    `${API_BASE}/resources/download?path=${encodeURIComponent(FILE_PATH)}`
  );
  if (res.status === 404) throw new HttpError(404);
  if (!res.ok) throw new HttpError(res.status);
  const { href } = (await res.json()) as { href?: string };
  if (!href) throw new Error("no download href");
  const fileRes = await fetch(href, { signal: timeoutSignal(), cache: "no-store" });
  if (!fileRes.ok) throw new HttpError(fileRes.status);
  return fileRes.text();
}

async function uploadFileText(body: string): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/resources/upload?path=${encodeURIComponent(FILE_PATH)}&overwrite=true`
  );
  if (!res.ok) throw new HttpError(res.status);
  const { href } = (await res.json()) as { href?: string };
  if (!href) throw new Error("no upload href");
  const putRes = await fetch(href, {
    method: "PUT",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body,
    signal: timeoutSignal(),
  });
  if (!putRes.ok && putRes.status !== 201 && putRes.status !== 202) {
    throw new HttpError(putRes.status);
  }
}

/* ------------------------- bookkeeping (local) -------------------------- */

function rememberSharedAt(savedAt: number | null): void {
  const at = savedAt ?? Date.now();
  try {
    localStorage.setItem(SHARED_AT_KEY, new Date(at).toISOString());
  } catch {
    /* best-effort */
  }
}

function lastSharedAt(): number {
  try {
    const t = Date.parse(localStorage.getItem(SHARED_AT_KEY) || "");
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

function rememberLocalAt(): void {
  try {
    localStorage.setItem(LOCAL_AT_KEY, new Date().toISOString());
  } catch {
    /* best-effort */
  }
}

/* ---------------------------- public API -------------------------------- */

/** Прочитать проект с Яндекс.Диска. */
export async function fetchSharedProject(): Promise<FetchOutcome> {
  if (!hasYandexToken()) return { status: "unreachable" };

  let meta: DiskMeta | null;
  try {
    meta = await getFileMeta();
  } catch {
    return { status: "unreachable" };
  }
  if (!meta) return { status: "missing" };

  let raw: string;
  try {
    raw = await downloadFileText();
  } catch {
    return { status: "unreachable" };
  }

  try {
    const parsed = parseProjectFile(raw);
    if (parsed.unsupported) {
      return { status: "unsupported", rev: meta.revision, savedAt: meta.modified };
    }
    return { status: "ok", store: parsed.store, rev: meta.revision, savedAt: meta.modified };
  } catch {
    return { status: "invalid" };
  }
}

/**
 * Записать проект на Яндекс.Диск с оптимистичной конкуренцией:
 * если ревизия на Диске не совпадает с известной клиенту (baseRev) — conflict.
 */
export async function pushSharedProject(
  store: ScheduleStore,
  baseRev: number | null
): Promise<PushOutcome> {
  if (!hasYandexToken()) throw new Error("unreachable");

  const meta = await getFileMeta();
  if (meta && meta.revision !== baseRev) {
    return { conflict: true, rev: meta.revision };
  }

  const body = serializeProject(store, { baseRev });
  await uploadFileText(body);

  // Upload на Диске асинхронный: ревизия может появиться не сразу.
  let rev: number | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const next = await getFileMeta();
      if (next && next.revision !== null && next.revision !== meta?.revision) {
        rev = next.revision;
        break;
      }
    } catch {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }

  rememberSharedAt(null);
  return { conflict: false, rev, savedAt: Date.now() };
}

export async function clearSharedProject(): Promise<void> {
  if (!hasYandexToken()) return;
  const res = await apiFetch(
    `${API_BASE}/resources?path=${encodeURIComponent(FILE_PATH)}&permanently=true`,
    { method: "DELETE" }
  );
  if (!res.ok && res.status !== 404 && res.status !== 202) {
    throw new HttpError(res.status);
  }
  try {
    localStorage.removeItem(SHARED_AT_KEY);
  } catch {
    /* ignore */
  }
}

/** Сначала localStorage, потом Диск. */
export async function persistStore(
  store: ScheduleStore,
  baseRev: number | null
): Promise<{ sync: SyncState; rev: number | null; conflict: boolean }> {
  try {
    saveData(store);
    rememberLocalAt();
  } catch {
    return { sync: "error", rev: baseRev, conflict: false };
  }

  let pushed: PushOutcome;
  try {
    pushed = await pushSharedProject(store, baseRev);
  } catch {
    return { sync: "local-only", rev: baseRev, conflict: false };
  }

  if (pushed.conflict) {
    return { sync: "conflict", rev: pushed.rev, conflict: true };
  }
  return { sync: "synced", rev: pushed.rev, conflict: false };
}

/** При конфликте локальная копия сохраняется под CONFLICT_KEY. */
export function stashConflictStore(store: ScheduleStore): void {
  try {
    localStorage.setItem(CONFLICT_KEY, serializeProject(store));
  } catch {
    /* safety net only */
  }
}

/**
 * Стартовая сверка: версия на Диске главнее, если она есть.
 * `dirty: true` — пользователь уже редактировал, пока шла загрузка:
 * тогда локальные правки не затираются, а push решит конфликт.
 */
export async function hydrateStore(
  local: ScheduleStore,
  options?: { dirty?: boolean }
): Promise<{
  store: ScheduleStore;
  sync: SyncState;
  fromShared: boolean;
  rev: number | null;
}> {
  const shared = await fetchSharedProject();

  switch (shared.status) {
    case "ok": {
      if (options?.dirty) {
        return { store: local, sync: "local-only", fromShared: false, rev: shared.rev };
      }
      rememberSharedAt(shared.savedAt);
      rememberLocalAt();
      try {
        saveData(shared.store);
      } catch {
        /* memory copy still usable */
      }
      return { store: shared.store, sync: "synced", fromShared: true, rev: shared.rev };
    }
    case "missing": {
      try {
        const pushed = await pushSharedProject(local, null);
        if (pushed.conflict) {
          return { store: local, sync: "conflict", fromShared: false, rev: pushed.rev };
        }
        return { store: local, sync: "synced", fromShared: false, rev: pushed.rev };
      } catch {
        return { store: local, sync: "local-only", fromShared: false, rev: null };
      }
    }
    case "invalid":
      return { store: local, sync: "error", fromShared: false, rev: null };
    case "unsupported":
      return { store: local, sync: "error", fromShared: false, rev: shared.rev };
    case "unreachable":
      return { store: local, sync: "local-only", fromShared: false, rev: null };
  }
}

/** Подтянуть файл с Диска, если его ревизия отличается от известной. */
export async function pullIfSharedNewer(
  knownRev: number | null,
  options?: { dirty?: boolean }
): Promise<{ store: ScheduleStore; rev: number | null } | null> {
  if (options?.dirty) return null;
  const shared = await fetchSharedProject();
  if (shared.status !== "ok") return null;

  if (knownRev !== null) {
    if (shared.rev === knownRev) return null;
    if (shared.rev === null) return null;
  } else if (shared.savedAt !== null && shared.savedAt <= lastSharedAt()) {
    return null;
  }

  rememberSharedAt(shared.savedAt);
  rememberLocalAt();
  try {
    saveData(shared.store);
  } catch {
    /* memory copy still usable */
  }
  return { store: shared.store, rev: shared.rev };
}
