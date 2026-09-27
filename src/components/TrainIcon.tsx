type Props = {
  className?: string;
};

/** Front-view train used as a travel stamp on the month calendar. */
export function TrainIcon({ className }: Props) {
  return (
    <svg
      className={["day-kind-icon kind-train", className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2.11-1.73c.37-.31.84-.47 1.31-.47s.94.16 1.31.47L14.77 21H17v-.5L15.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4ZM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17ZM11 10H6V6h5v4Zm2 0V6h5v4h-5Zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z" />
    </svg>
  );
}
