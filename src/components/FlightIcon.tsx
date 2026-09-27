type Props = {
  className?: string;
};

/** Side-view airplane used as a travel stamp on the month calendar. */
export function FlightIcon({ className }: Props) {
  return (
    <svg
      className={["day-kind-icon kind-flight", className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}
