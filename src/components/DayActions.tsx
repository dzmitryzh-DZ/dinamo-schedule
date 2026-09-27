import { useMemo, useState } from "react";
import type { UiStrings } from "../i18n/ui";
import type { DayTemplate, Lang, TrainingDay } from "../data/types";
import { compareDateRu } from "../utils/dates";
import { bilingualText } from "../utils/localize";

type Props = {
  ui: UiStrings;
  lang: Lang;
  days: TrainingDay[];
  templates: DayTemplate[];
  activeDayId: string;
  onAddDay: () => void;
  onAddNext10Days: () => void;
  onPullFromDay: (sourceDayId: string) => void;
  onPullFromTemplate: (templateId: string) => void;
  onSaveAsTemplate: (name: string) => void;
  onRemoveDay: () => void;
};

export function DayActions({
  ui,
  lang,
  days,
  templates,
  activeDayId,
  onAddDay,
  onAddNext10Days,
  onPullFromDay,
  onPullFromTemplate,
  onSaveAsTemplate,
  onRemoveDay,
}: Props) {
  const [sourceDayId, setSourceDayId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [naming, setNaming] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const sorted = useMemo(
    () => [...days].sort((a, b) => compareDateRu(a.date, b.date)),
    [days]
  );

  const templateLabel = (tpl: DayTemplate) =>
    bilingualText(tpl.nameRu, tpl.nameEn) ||
    (lang === "ru" ? tpl.nameRu || tpl.nameEn : tpl.nameEn || tpl.nameRu);

  function submitTemplateName() {
    const trimmed = templateName.trim();
    if (!trimmed) return;
    onSaveAsTemplate(trimmed);
    setTemplateName("");
    setNaming(false);
  }

  return (
    <details className="day-menu no-print">
      <summary className="btn">{ui.dayMenu}</summary>
      <div className="day-menu-panel">
        <label className="day-picker source-day-picker">
          <span className="day-picker-label">{ui.selectSourceDay}</span>
          <select
            value={sourceDayId}
            onChange={(e) => setSourceDayId(e.target.value)}
            aria-label={ui.selectSourceDay}
          >
            <option value="">{ui.selectSourceDay}</option>
            {sorted
              .filter((day) => day.id !== activeDayId)
              .map((day) => (
                <option key={day.id} value={day.id}>
                  {day.date.trim() || ui.untitledDay}
                </option>
              ))}
          </select>
        </label>
        <button
          type="button"
          className="btn"
          disabled={!sourceDayId}
          onClick={() => {
            if (!sourceDayId) return;
            onPullFromDay(sourceDayId);
          }}
        >
          {ui.pullFromDay}
        </button>

        <label className="day-picker template-picker">
          <span className="day-picker-label">{ui.selectTemplate}</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            aria-label={ui.selectTemplate}
          >
            <option value="">
              {templates.length ? ui.selectTemplate : ui.noTemplates}
            </option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {templateLabel(tpl)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn"
          disabled={!templateId}
          onClick={() => {
            if (!templateId) return;
            onPullFromTemplate(templateId);
          }}
        >
          {ui.pullFromTemplate}
        </button>

        {naming ? (
          <form
            className="template-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitTemplateName();
            }}
          >
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={ui.templateNamePrompt}
              aria-label={ui.templateNamePrompt}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={!templateName.trim()}>
              {ui.done}
            </button>
            <button
              type="button"
              className="btn"
              aria-label={ui.cancel}
              onClick={() => {
                setNaming(false);
                setTemplateName("");
              }}
            >
              ×
            </button>
          </form>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => {
              const active = days.find((d) => d.id === activeDayId);
              setTemplateName(active?.date.trim() || ui.untitledDay);
              setNaming(true);
            }}
          >
            {ui.saveAsTemplate}
          </button>
        )}

        <button type="button" className="btn" onClick={onAddDay}>
          {ui.addDay}
        </button>
        <button type="button" className="btn" onClick={onAddNext10Days}>
          {ui.addNext10Days}
        </button>
        <button type="button" className="btn btn-danger" onClick={onRemoveDay}>
          {ui.removeDay}
        </button>
      </div>
    </details>
  );
}
