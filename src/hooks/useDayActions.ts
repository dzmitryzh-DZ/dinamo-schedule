import { useCallback } from "react";
import {
  applyDaySnapshot,
  createMonthActivityId,
  createUpcomingDays,
  emptyDay,
  getActiveDay,
} from "../data/storage";
import {
  DAY_KINDS,
  FLIGHT_DEST_MAX,
  type DayKind,
  type FlightDest,
  type GroupKey,
  type MatchInfo,
  type MonthActivity,
} from "../data/types";
import type { ScheduleStoreApi } from "./useScheduleStore";

type Store = Pick<
  ScheduleStoreApi,
  "ui" | "lang" | "data" | "flash" | "mutateStore" | "updateActiveDay"
>;

const GAME_KINDS = new Set<DayKind>(["home", "away"]);

export function useDayActions({
  ui,
  lang,
  data,
  flash,
  mutateStore,
  updateActiveDay,
}: Store) {
  const addDay = useCallback(() => {
    mutateStore(
      (current) => {
        const dayItem = emptyDay();
        current.days.push(dayItem);
        current.activeDayId = dayItem.id;
        return current;
      },
      { message: ui.dayAdded }
    );
  }, [mutateStore, ui.dayAdded]);

  const addNext10Days = useCallback(() => {
    let createdCount = 0;
    const applied = mutateStore(
      (current) => {
        const { store: next, created } = createUpcomingDays(
          current,
          10,
          getActiveDay(current)
        );
        if (!created.length) return current;
        createdCount = created.length;
        return next;
      },
      {}
    );
    if (!applied) {
      flash(ui.next10Exists);
      return;
    }
    flash(ui.next10Added.replace("{n}", String(createdCount)), true);
  }, [mutateStore, flash, ui.next10Exists, ui.next10Added]);

  // Validation runs INSIDE the updater against the freshest store, so a
  // stale closure can never crash on days[0] of a removed day.
  const removeDay = useCallback(() => {
    if (data.days.length <= 1) {
      flash(ui.lastDay);
      return;
    }
    if (!confirm(ui.confirmRemoveDay)) return;
    mutateStore(
      (current) => {
        if (current.days.length <= 1) return current;
        const remaining = current.days.filter(
          (d) => d.id !== current.activeDayId
        );
        if (remaining.length === current.days.length) return current;
        current.days = remaining;
        current.activeDayId = current.days[0].id;
        return current;
      },
      { message: ui.dayRemoved }
    );
  }, [data.days.length, mutateStore, flash, ui.lastDay, ui.confirmRemoveDay, ui.dayRemoved]);

  const pullFromDay = useCallback(
    (sourceDayId: string) => {
      const preview = data.days.find((d) => d.id === sourceDayId);
      if (!preview || sourceDayId === data.activeDayId) {
        flash(ui.noPreviousDay);
        return;
      }
      const label = preview.date.trim() || ui.untitledDay;
      if (!confirm(ui.confirmPullFromDay.replace("{date}", label))) return;

      mutateStore(
        (current) => {
          const index = current.days.findIndex(
            (d) => d.id === current.activeDayId
          );
          const from = current.days.find((d) => d.id === sourceDayId);
          if (index < 0 || !from || current.days[index].id === from.id) {
            return current;
          }
          current.days[index] = applyDaySnapshot(current.days[index], from);
          return current;
        },
        { message: ui.pulledPrevious.replace("{date}", label) }
      );
    },
    [data.days, data.activeDayId, mutateStore, flash, ui.noPreviousDay, ui.untitledDay, ui.confirmPullFromDay, ui.pulledPrevious]
  );

  const pullFromTemplate = useCallback(
    (templateId: string) => {
      const preview = (data.templates ?? []).find((t) => t.id === templateId);
      if (!preview) {
        flash(ui.noTemplates);
        return;
      }
      const label =
        lang === "ru"
          ? preview.nameRu || preview.nameEn
          : preview.nameEn || preview.nameRu;
      if (!confirm(ui.confirmPullFromTemplate.replace("{name}", label))) return;

      mutateStore(
        (current) => {
          const index = current.days.findIndex(
            (d) => d.id === current.activeDayId
          );
          const template = (current.templates ?? []).find(
            (t) => t.id === templateId
          );
          if (index < 0 || !template) return current;
          current.days[index] = applyDaySnapshot(current.days[index], template);
          return current;
        },
        { message: ui.pulledPrevious.replace("{date}", label) }
      );
    },
    [data.templates, lang, mutateStore, flash, ui.noTemplates, ui.confirmPullFromTemplate, ui.pulledPrevious]
  );

  const setCalendarDayKind = useCallback(
    (date: string, kind: string | null) => {
      mutateStore(
        (current) => {
          if (!current.calendar) current.calendar = {};
          if (!kind) {
            delete current.calendar[date];
            if (current.matches) delete current.matches[date];
            if (current.flights) delete current.flights[date];
            if (current.trains) delete current.trains[date];
            return current;
          }

          const list = current.calendar[date] ?? [];
          const index = list.indexOf(kind);

          if (index >= 0) {
            list.splice(index, 1);
            if (GAME_KINDS.has(kind as DayKind) && current.matches) {
              delete current.matches[date];
            }
            if (kind === "flight" && current.flights) {
              delete current.flights[date];
            }
            if (kind === "train" && current.trains) {
              delete current.trains[date];
            }
          } else {
            list.push(kind);
          }

          if (list.length === 0) delete current.calendar[date];
          else current.calendar[date] = list;
          return current;
        },
        { silent: true, coalesceKey: `calendar:${date}` }
      );
    },
    [mutateStore]
  );

  const addMonthActivity = useCallback(
    (ru: string, en: string): string => {
      const nextRu = ru.trim().slice(0, 80);
      const nextEn = en.trim().slice(0, 80);
      if (!nextRu && !nextEn) return "";
      const nameKey = `${nextRu.toLocaleLowerCase()}|${nextEn.toLocaleLowerCase()}`;
      let resultId = "";
      mutateStore((current) => {
        if (!current.monthActivities) current.monthActivities = [];
        const existing = current.monthActivities.find(
          (activity) =>
            `${activity.ru.toLocaleLowerCase()}|${activity.en.toLocaleLowerCase()}` ===
            nameKey
        );
        if (existing) {
          resultId = existing.id;
          return current;
        }
        resultId = createMonthActivityId();
        current.monthActivities.push({ id: resultId, ru: nextRu, en: nextEn });
        if (!current.monthActivityOrder) current.monthActivityOrder = [...DAY_KINDS, "flight", "train"];
        current.monthActivityOrder.push(resultId);
        return current;
      });
      return resultId;
    },
    [mutateStore]
  );

  const updateMonthActivity = useCallback(
    (id: string, updates: Partial<Pick<MonthActivity, "ru" | "en" | "logo">>) => {
      mutateStore(
        (current) => {
          const list = current.monthActivities ?? [];
          const index = list.findIndex((activity) => activity.id === id);
          if (index < 0) return current;
          const activity = { ...list[index] };
          if (updates.ru !== undefined) {
            activity.ru = updates.ru.trim().slice(0, 80);
          }
          if (updates.en !== undefined) {
            activity.en = updates.en.trim().slice(0, 80);
          }
          if (updates.logo !== undefined) {
            if (updates.logo) activity.logo = updates.logo;
            else delete activity.logo;
          }
          if (!activity.ru && !activity.en) return current;
          list[index] = activity;
          current.monthActivities = list;
          return current;
        },
        { silent: true, coalesceKey: `month-activity:${id}` }
      );
    },
    [mutateStore]
  );

  const removeMonthActivity = useCallback(
    (id: string) => {
      mutateStore((current) => {
        current.monthActivities = (current.monthActivities ?? []).filter(
          (activity) => activity.id !== id
        );
        current.monthActivityOrder = (current.monthActivityOrder ?? [
          ...DAY_KINDS,
          "flight",
          "train",
        ]).filter((activityId) => activityId !== id);
        for (const [date, activities] of Object.entries(current.calendar ?? {})) {
          const next = (activities ?? []).filter((activityId) => activityId !== id);
          if (next.length === 0) delete current.calendar[date];
          else current.calendar[date] = next;
        }
        return current;
      });
    },
    [mutateStore]
  );

  const moveCalendarActivity = useCallback(
    (date: string, fromIndex: number, toIndex: number) => {
      mutateStore(
        (current) => {
          const list = current.calendar[date];
          if (
            !list ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= list.length ||
            toIndex >= list.length ||
            fromIndex === toIndex
          ) {
            return current;
          }
          const [id] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, id);
          current.calendar[date] = list;
          return current;
        },
        { silent: true, coalesceKey: `calendar-move:${date}` }
      );
    },
    [mutateStore]
  );

  const setMonthKindLogo = useCallback(
    (kind: DayKind, logo: string | null) => {
      mutateStore(
        (current) => {
          if (!current.monthKindLogos) current.monthKindLogos = {};
          if (logo) current.monthKindLogos[kind] = logo;
          else delete current.monthKindLogos[kind];
          return current;
        },
        { silent: true, coalesceKey: `month-kind-logo:${kind}` }
      );
    },
    [mutateStore]
  );

  const setMatch = useCallback(
    (date: string, match: MatchInfo | null) => {
      mutateStore(
        (current) => {
          if (!current.matches) current.matches = {};
          if (!match) {
            delete current.matches[date];
          } else {
            const next: MatchInfo = {
              opponent: match.opponent.trim().slice(0, 3).toUpperCase(),
            };
            if (match.teamId) next.teamId = match.teamId;
            current.matches[date] = next;
          }
          return current;
        },
        { silent: true, coalesceKey: `match:${date}` }
      );
    },
    [mutateStore]
  );

  const setFlight = useCallback(
    (date: string, dest: FlightDest | null) => {
      mutateStore(
        (current) => {
          if (!current.flights) current.flights = {};
          const ru = (dest?.ru ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, FLIGHT_DEST_MAX);
          const en = (dest?.en ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, FLIGHT_DEST_MAX);
          if (!ru && !en) delete current.flights[date];
          else current.flights[date] = { ru, en };
          return current;
        },
        { silent: true, coalesceKey: `flight:${date}` }
      );
    },
    [mutateStore]
  );

  const setTrain = useCallback(
    (date: string, dest: FlightDest | null) => {
      mutateStore(
        (current) => {
          if (!current.trains) current.trains = {};
          const ru = (dest?.ru ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, FLIGHT_DEST_MAX);
          const en = (dest?.en ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, FLIGHT_DEST_MAX);
          if (!ru && !en) delete current.trains[date];
          else current.trains[date] = { ru, en };
          return current;
        },
        { silent: true, coalesceKey: `train:${date}` }
      );
    },
    [mutateStore]
  );

  const setMonthWatermark = useCallback(
    (on: boolean) => {
      mutateStore(
        (current) => {
          current.monthWatermark = on;
          return current;
        },
        { silent: true, coalesceKey: "month-watermark" }
      );
    },
    [mutateStore]
  );

  const handleMovePlayer = useCallback(
    (group: GroupKey, from: number, to: number) => {
      updateActiveDay((day) => {
        const list = day.groups[group];
        if (
          from < 0 ||
          to < 0 ||
          from >= list.length ||
          to >= list.length ||
          from === to
        ) {
          return day;
        }
        const [id] = list.splice(from, 1);
        list.splice(to, 0, id);
        return day;
      });
    },
    [updateActiveDay]
  );

  const handleMovePlayerToGroup = useCallback(
    (group: GroupKey, index: number, targetGroup: GroupKey) => {
      updateActiveDay((day) => {
        const list = day.groups[group];
        if (index < 0 || index >= list.length || group === targetGroup) {
          return day;
        }
        const [id] = list.splice(index, 1);
        day.groups[targetGroup].push(id);
        return day;
      });
    },
    [updateActiveDay]
  );

  return {
    addDay,
    addNext10Days,
    removeDay,
    pullFromDay,
    pullFromTemplate,
    setCalendarDayKind,
    addMonthActivity,
    updateMonthActivity,
    removeMonthActivity,
    moveCalendarActivity,
    setMonthKindLogo,
    setMatch,
    setFlight,
    setTrain,
    setMonthWatermark,
    handleMovePlayer,
    handleMovePlayerToGroup,
  };
}
