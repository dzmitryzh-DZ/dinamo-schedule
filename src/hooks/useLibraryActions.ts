import { useCallback } from "react";
import {
  createActivityId,
  createPlayerId,
  createSplitId,
  createTeamId,
  getActiveDay,
  patchItem,
  removeItem,
  templateFromDay,
  type LibraryCollectionKey,
} from "../data/storage";
import type {
  ActivityItem,
  DayTemplate,
  RosterPlayer,
  SplitItem,
  TeamItem,
} from "../data/types";
import { nextUnusedRowColor } from "../utils/rowColors";
import type { LibraryItem } from "../data/storage";
import type { ScheduleStoreApi } from "./useScheduleStore";

type Store = Pick<ScheduleStoreApi, "ui" | "flash" | "mutateStore">;

/** Coalescing key for single-field library edits: fast typing on the same
 * input stays one undo step; different fields/rows split steps. */
function editKey(collection: LibraryCollectionKey, id: string, updates: object): string {
  return `${collection}:${id}:${Object.keys(updates).sort().join(",")}`;
}

export function useLibraryActions({ ui, flash, mutateStore }: Store) {
  const patch = useCallback(
    <K extends LibraryCollectionKey>(
      collection: K,
      id: string,
      updates: Partial<LibraryItem<K>>
    ) => {
      mutateStore(
        (current) => {
          patchItem(current, collection, id, updates);
          return current;
        },
        { silent: true, coalesceKey: editKey(collection, id, updates) }
      );
    },
    [mutateStore]
  );

  const remove = useCallback(
    (collection: LibraryCollectionKey, id: string) => {
      mutateStore((current) => {
        removeItem(current, collection, id);
        return current;
      });
    },
    [mutateStore]
  );

  const handleAddActivity = useCallback(
    (ru: string, en: string, group?: string) => {
      const trimmedRu = ru.trim();
      const trimmedEn = en.trim();
      const trimmedGroup = group?.trim();
      if (!trimmedRu && !trimmedEn) return;
      mutateStore((current) => {
        current.activities.push({
          id: createActivityId(),
          ru: trimmedRu,
          en: trimmedEn,
          ...(trimmedGroup ? { group: trimmedGroup } : {}),
          color: nextUnusedRowColor(
            current.activities.map((activity) => activity.color)
          ),
        });
        return current;
      });
    },
    [mutateStore]
  );

  const handleUpdateActivity = useCallback(
    (id: string, updates: Partial<ActivityItem>) => {
      patch("activities", id, updates);
    },
    [patch]
  );

  const handleRemoveActivity = useCallback(
    (id: string) => {
      remove("activities", id);
    },
    [remove]
  );

  const handleAddSplit = useCallback(
    (ru: string, en: string) => {
      const trimmedRu = ru.trim();
      const trimmedEn = en.trim();
      if (!trimmedRu && !trimmedEn) return;
      mutateStore((current) => {
        current.splits.push({
          id: createSplitId(),
          ru: trimmedRu,
          en: trimmedEn,
        });
        return current;
      });
    },
    [mutateStore]
  );

  const handleUpdateSplit = useCallback(
    (id: string, updates: Partial<SplitItem>) => {
      patch("splits", id, updates);
    },
    [patch]
  );

  const handleRemoveSplit = useCallback(
    (id: string) => {
      remove("splits", id);
    },
    [remove]
  );

  const handleAddTeam = useCallback(
    (abbr: string, ru: string, en: string) => {
      mutateStore((current) => {
        if (!current.teams) current.teams = [];
        const code = abbr.trim().slice(0, 3).toUpperCase();
        current.teams.push({
          id: createTeamId(),
          abbr: code,
          ru: ru.trim() || code,
          en: en.trim() || ru.trim() || code,
          color: "#1565c0",
          color2: "#ffffff",
          mark: "letter",
        });
        return current;
      });
    },
    [mutateStore]
  );

  const handleUpdateTeam = useCallback(
    (id: string, updates: Partial<TeamItem>) => {
      patch("teams", id, updates);
    },
    [patch]
  );

  const handleRemoveTeam = useCallback(
    (id: string) => {
      // removeItem("teams") also clears dangling matches[*].teamId.
      remove("teams", id);
    },
    [remove]
  );

  const handleUpdateTemplate = useCallback(
    (id: string, updates: Partial<DayTemplate>) => {
      patch("templates", id, updates);
    },
    [patch]
  );

  const handleRemoveTemplate = useCallback(
    (id: string) => {
      remove("templates", id);
    },
    [remove]
  );

  const handleAddToRoster = useCallback(
    (ru: string, en: string, number: string, position: string) => {
      const trimmedRu = ru.trim();
      const trimmedEn = en.trim();
      if (!trimmedRu && !trimmedEn) return;
      mutateStore((current) => {
        current.roster.push({
          id: createPlayerId(),
          ru: trimmedRu,
          en: trimmedEn,
          number: number.trim(),
          position: position.trim(),
          active: true,
        });
        return current;
      });
    },
    [mutateStore]
  );

  const handleUpdateRoster = useCallback(
    (playerId: string, updates: Partial<RosterPlayer>) => {
      patch("roster", playerId, updates);
    },
    [patch]
  );

  const handleRemoveFromRoster = useCallback(
    (playerId: string) => {
      // removeItem("roster") also purges the player from every day's groups.
      remove("roster", playerId);
    },
    [remove]
  );

  const saveAsTemplate = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        flash(ui.templateNameRequired);
        return;
      }

      mutateStore(
        (current) => {
          if (!current.templates) current.templates = [];
          const active = getActiveDay(current);
          current.templates.push(templateFromDay(active, trimmed, trimmed));
          return current;
        },
        { message: ui.templateSaved.replace("{name}", trimmed) }
      );
    },
    [mutateStore, flash, ui.templateNameRequired, ui.templateSaved]
  );

  return {
    handleAddActivity,
    handleUpdateActivity,
    handleRemoveActivity,
    handleAddSplit,
    handleUpdateSplit,
    handleRemoveSplit,
    handleAddTeam,
    handleUpdateTeam,
    handleRemoveTeam,
    handleUpdateTemplate,
    handleRemoveTemplate,
    handleAddToRoster,
    handleUpdateRoster,
    handleRemoveFromRoster,
    saveAsTemplate,
  };
}
