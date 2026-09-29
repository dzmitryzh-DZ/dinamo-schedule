import { toCanvas } from "html-to-image";

/**
 * Экспорт листов в PNG и PDF.
 *
 * Лист рисуется в скрытом iframe фиксированной ширины (A4 альбомная минус поля
 * 8 мм = 281×194 мм ≈ 1062×733 px при 96 dpi). Так раскладка не зависит ни от
 * ширины экрана пользователя, ни от режима редактирования. Стили листа те же,
 * что и в приложении (`body.print-day` / `body.print-month` в index.css).
 */

/** Ширина и высота печатного поля A4 альбомной, px @ 96 dpi. */
export const PAGE_W = 1062;
export const PAGE_H = 733;

/** Размер поля A4 альбомной с отступами 8 мм, мм. */
const PAGE_BOX_W_MM = 281;
const PAGE_BOX_H_MM = 194;
const PAGE_MARGIN_MM = 8;

/** Масштаб растра: 3× даёт ≈ 285 dpi на A4. */
const PIXEL_RATIO = 3;

/** Ниже этого масштаба шрифта лист не ужимаем. */
const MIN_FONT_PERCENT = 50;
const FONT_STEP_PERCENT = 2;

export type ExportKind =
  | "day-pdf"
  | "day-pdf-groups"
  | "day-png"
  | "groups-png"
  | "month-pdf"
  | "month-png";

export type ExportFormat = "pdf" | "png";
export type SheetPart = "schedule" | "groups" | "month";

export type ExportJob = {
  id: number;
  kind: ExportKind;
  format: ExportFormat;
  parts: SheetPart[];
  /** Имя файла без расширения. */
  fileBase: string;
  /** Копия листа месяца (месяц хранит состояние внутри компонента, поэтому клонируется из DOM). */
  monthNode?: HTMLElement;
  bodyClass: string;
};

export function exportKindMeta(kind: ExportKind): {
  format: ExportFormat;
  parts: SheetPart[];
} {
  switch (kind) {
    case "day-pdf":
      return { format: "pdf", parts: ["schedule"] };
    case "day-pdf-groups":
      return { format: "pdf", parts: ["schedule", "groups"] };
    case "day-png":
      return { format: "png", parts: ["schedule"] };
    case "groups-png":
      return { format: "png", parts: ["groups"] };
    case "month-pdf":
      return { format: "pdf", parts: ["month"] };
    case "month-png":
      return { format: "png", parts: ["month"] };
  }
}

const SHEET_SELECTOR: Record<SheetPart, string> = {
  schedule: ".sheet-schedule",
  groups: ".sheet-groups:not(.is-empty)",
  month: ".sheet-month",
};

/** Части имени файла: только буквы, цифры и дефисы. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

/** «13.08.2026» → «13-08-2026»; пустая дата → сегодняшняя. */
export function dateStamp(date: string): string {
  const stamp = date.trim().replaceAll(".", "-").replace(/[^\d-]/g, "");
  return stamp || new Date().toISOString().slice(0, 10);
}

/** HTML документа для iframe: те же стили, что и у приложения. */
export function buildFrameHtml(bodyClass: string): string {
  const styles = Array.from(
    document.head.querySelectorAll('link[rel="stylesheet"], style')
  )
    .map((node) => node.outerHTML)
    .join("\n");
  return `<!doctype html>
<html lang="${document.documentElement.lang || "ru"}">
<head>
<meta charset="UTF-8" />
<base href="${document.baseURI}" />
${styles}
</head>
<body class="${bodyClass}"></body>
</html>`;
}

function nextFrame(win: Window): Promise<void> {
  return new Promise((resolve) => win.requestAnimationFrame(() => resolve()));
}

function imageReady(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener("load", () => resolve(), { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });
}

/** Ждёт шрифты, картинки и отрисовку внутри iframe. */
export async function waitForFrameAssets(doc: Document): Promise<void> {
  const win = doc.defaultView;
  if (!win) return;
  await nextFrame(win);
  try {
    await doc.fonts.ready;
  } catch {
    /* Font Loading API недоступен */
  }
  await Promise.all(Array.from(doc.images).map(imageReady));
  await nextFrame(win);
  await nextFrame(win);
}

/**
 * Лист не помещается на страницу, если:
 * — выше поля A4 (день),
 * — контент клетки месяца выходит за клетку или залезает на номер дня.
 */
function sheetOverflows(sheet: HTMLElement, part: SheetPart): boolean {
  if (part !== "month") {
    return sheet.getBoundingClientRect().height > PAGE_H + 1;
  }
  if (sheet.scrollHeight > sheet.clientHeight + 1) return true;
  const cells = sheet.querySelectorAll<HTMLElement>(".month-cell");
  for (const cell of cells) {
    const stack = cell.querySelector<HTMLElement>(".month-activities-stack");
    if (!stack) continue;
    const cellRect = cell.getBoundingClientRect();
    // Скрытые (display: none) клетки соседних недель не проверяем.
    if (cellRect.width === 0 || cellRect.height === 0) continue;
    const stackRect = stack.getBoundingClientRect();
    const paddingTop = parseFloat(cell.ownerDocument.defaultView!.getComputedStyle(cell).paddingTop) || 0;
    if (
      stackRect.top < cellRect.top + paddingTop - 1 ||
      stackRect.bottom > cellRect.bottom + 1
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Уменьшает шрифт всего документа в iframe, пока лист не поместится
 * на одну страницу. Возвращает итоговый масштаб в процентах.
 */
export function fitSheetToPage(
  doc: Document,
  sheet: HTMLElement,
  part: SheetPart
): number {
  const root = doc.documentElement;
  let percent = 100;
  root.style.fontSize = "";
  while (sheetOverflows(sheet, part) && percent > MIN_FONT_PERCENT) {
    percent -= FONT_STEP_PERCENT;
    root.style.fontSize = `${percent}%`;
  }
  return percent;
}

export type CapturedPage = {
  canvas: HTMLCanvasElement;
  /** Размер листа в CSS-пикселях. */
  width: number;
  height: number;
};

function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

async function captureSheet(sheet: HTMLElement): Promise<CapturedPage> {
  const rect = sheet.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const options = {
    pixelRatio: PIXEL_RATIO,
    backgroundColor: "#ffffff",
    width,
    height,
    cacheBust: false,
  };
  // Safari при первом вызове часто не успевает подгрузить картинки и шрифты.
  if (isSafari()) await toCanvas(sheet, options);
  const canvas = await toCanvas(sheet, options);
  return { canvas, width, height };
}

/** Снимает нужные листы из готового iframe-документа. */
export async function captureParts(
  doc: Document,
  parts: SheetPart[]
): Promise<CapturedPage[]> {
  await waitForFrameAssets(doc);
  const pages: CapturedPage[] = [];
  for (const part of parts) {
    const sheet = doc.querySelector<HTMLElement>(SHEET_SELECTOR[part]);
    if (!sheet) continue;
    fitSheetToPage(doc, sheet, part);
    await nextFrame(doc.defaultView as Window);
    pages.push(await captureSheet(sheet));
  }
  if (pages.length === 0) throw new Error("Nothing to export");
  return pages;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/png"
    );
  });
}

/** PNG: по файлу на каждый лист (если листов несколько — с суффиксом). */
export async function savePng(
  pages: CapturedPage[],
  fileBase: string
): Promise<void> {
  for (let i = 0; i < pages.length; i += 1) {
    const suffix = pages.length > 1 ? `-${i + 1}` : "";
    downloadBlob(await canvasToBlob(pages[i].canvas), `${fileBase}${suffix}.png`);
  }
}

/** PDF: A4 альбомная, каждый лист — на своей странице, с полями 8 мм. */
export async function savePdf(
  pages: CapturedPage[],
  fileBase: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  pdf.setProperties({ title: fileBase, creator: "ХК Динамо-Минск — Расписание" });

  pages.forEach((page, index) => {
    if (index > 0) pdf.addPage("a4", "landscape");
    // Вписываем лист в поле страницы без искажения пропорций.
    const ratio = Math.min(
      PAGE_BOX_W_MM / page.width,
      PAGE_BOX_H_MM / page.height
    );
    const w = page.width * ratio;
    const h = page.height * ratio;
    const x = PAGE_MARGIN_MM + (PAGE_BOX_W_MM - w) / 2;
    const y = PAGE_MARGIN_MM + (PAGE_BOX_H_MM - h) / 2;
    pdf.addImage(page.canvas, "PNG", x, y, w, h, undefined, "FAST");
  });

  downloadBlob(pdf.output("blob"), `${fileBase}.pdf`);
}
