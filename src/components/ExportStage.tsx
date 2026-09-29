import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  PAGE_W,
  buildFrameHtml,
  captureParts,
  savePdf,
  savePng,
  type ExportJob,
} from "../utils/exportDocument";

type Props = {
  job: ExportJob;
  /** Листы дня в режиме просмотра (для режима «месяц» не нужны). */
  children?: ReactNode;
  onDone: (error: Error | null) => void;
};

/**
 * Скрытый iframe фиксированной ширины A4-альбом, в котором рисуется лист,
 * снимается в растр и сохраняется как PNG или PDF. Пользователь его не видит.
 */
export function ExportStage({ job, children, onDone }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const srcDoc = useMemo(
    () => buildFrameHtml(job.bodyClass),
    // Стили копируются один раз на задачу экспорта.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [job.id]
  );
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!mount) return;
    let cancelled = false;

    (async () => {
      try {
        if (job.monthNode) {
          // importNode, а не HTML-строка: сохраняет структуру DOM как есть.
          const doc = mount.ownerDocument;
          const wrapper = doc.createElement("div");
          wrapper.className = "document document-month";
          wrapper.appendChild(doc.importNode(job.monthNode, true));
          mount.replaceChildren(wrapper);
        }
        const pages = await captureParts(mount.ownerDocument, job.parts);
        if (cancelled) return;
        if (job.format === "pdf") await savePdf(pages, job.fileBase);
        else await savePng(pages, job.fileBase);
        if (!cancelled) onDoneRef.current(null);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          onDoneRef.current(error instanceof Error ? error : new Error(String(error)));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mount, job]);

  return (
    <>
      <iframe
        ref={iframeRef}
        className="export-frame"
        title="export"
        aria-hidden="true"
        tabIndex={-1}
        srcDoc={srcDoc}
        style={{ width: PAGE_W }}
        onLoad={() => {
          const body = iframeRef.current?.contentDocument?.body;
          if (body) setMount(body);
        }}
      />
      {mount && !job.monthNode ? createPortal(children, mount) : null}
    </>
  );
}
