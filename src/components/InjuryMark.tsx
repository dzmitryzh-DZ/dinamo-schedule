type Props = {
  title: string;
};

export function InjuryMark({ title }: Props) {
  return (
    <span className="injury-mark" role="img" title={title} aria-label={title}>
      <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <rect x="4.5" y="1" width="3" height="10" rx="0.6" />
        <rect x="1" y="4.5" width="10" height="3" rx="0.6" />
      </svg>
    </span>
  );
}
