import type { DayKind } from "../data/types";
import dayOffUrl from "../assets/day-off.png";
import trainingSticksUrl from "../assets/training-sticks.png";

type Props = {
  kind: DayKind;
  className?: string;
};

export function DayKindIcon({ kind, className }: Props) {
  const classNames = ["day-kind-icon", `kind-${kind}`, className]
    .filter(Boolean)
    .join(" ");

  if (kind === "training") {
    return (
      <img
        className={classNames}
        src={trainingSticksUrl}
        alt=""
        aria-hidden="true"
      />
    );
  }

  if (kind === "off") {
    return (
      <img
        className={classNames}
        src={dayOffUrl}
        alt=""
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      className={classNames}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {kind === "home" ? (
        <path d="M12 3.2 3.6 10.2c-.35.3-.2.8.25.8H6v8.2c0 .45.35.8.8.8h3.3v-5.1h3.8v5.1h3.3c.45 0 .8-.35.8-.8V11h2.15c.45 0 .6-.5.25-.8L12 3.2Z" />
      ) : null}
      {kind === "away" ? (
        <path d="M21.2 12 3.4 4.8c-.55-.22-1.1.32-.92.88L5.6 11.2H11l-4.3 3.05c-.32.22-.38.68-.12.98l.85.95c.22.25.6.28.88.08L14.2 13h5.15l1.95 5.15c.15.4.7.48.98.12l.72-.85c.22-.28.18-.7-.12-.95L18.4 13h1.85c.7 0 1.18-.7.95-1Z" />
      ) : null}
      {kind === "recovery" ? (
        <>
          <path d="M12 20.4S4.4 15.15 4.4 9.9C4.4 7.15 6.5 5.2 9.1 5.2c1.5 0 2.85.75 3.55 1.95.7-1.2 2.05-1.95 3.55-1.95 2.6 0 4.7 1.95 4.7 4.7 0 5.25-7.6 10.5-8.9 10.5Z" />
          <path
            fill="var(--white, #fff)"
            d="M11.15 9.15h1.7v2.05h2.05v1.7h-2.05v2.05h-1.7v-2.05H9.1v-1.7h2.05V9.15Z"
          />
        </>
      ) : null}
    </svg>
  );
}
