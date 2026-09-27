import type { TeamItem, TeamMark } from "../data/types";

type Props = {
  team?: Pick<TeamItem, "abbr" | "color" | "color2" | "mark" | "logo"> | null;
  abbr?: string;
  className?: string;
  title?: string;
};

function contrastOn(hex: string): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return "#ffffff";
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#102027" : "#ffffff";
}

export function TeamLogo({ team, abbr, className, title }: Props) {
  const code = (team?.abbr || abbr || "?").slice(0, 3).toUpperCase() || "?";
  const color = team?.color || "#1565c0";
  const mark = team?.mark || "letter";

  return (
    <span
      className={["team-logo", className].filter(Boolean).join(" ")}
      title={title}
    >
      {team?.logo ? (
        <img src={team.logo} alt="" />
      ) : (
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <TeamMarkGraphic mark={mark} color={color} letter={code.slice(0, 1)} />
        </svg>
      )}
    </span>
  );
}

function TeamMarkGraphic({
  mark,
  color,
  letter,
}: {
  mark: TeamMark;
  color: string;
  letter: string;
}) {
  if (mark === "anchor") {
    return (
      <g fill={color}>
        <circle cx="16" cy="11.2" r="2.1" />
        <rect x="15.15" y="12.8" width="1.7" height="9.2" rx="0.7" />
        <path d="M9.2 18.4c.4 3.3 3.2 5.6 6.8 5.6s6.4-2.3 6.8-5.6h-2.1c-.35 2.05-2.2 3.5-4.7 3.5s-4.35-1.45-4.7-3.5H9.2Z" />
        <rect x="11.4" y="14.4" width="9.2" height="1.6" rx="0.7" />
      </g>
    );
  }
  if (mark === "star") {
    return (
      <path
        fill={color}
        d="M16 8.2 18.3 13l5.3.5-4 3.6 1.2 5.2L16 19.6l-4.8 2.7 1.2-5.2-4-3.6 5.3-.5Z"
      />
    );
  }
  if (mark === "bars") {
    return (
      <g fill={color}>
        <rect x="8.4" y="10.2" width="3.2" height="12.2" rx="1.1" />
        <rect x="14.4" y="8.4" width="3.2" height="14" rx="1.1" />
        <rect x="20.4" y="11.4" width="3.2" height="11" rx="1.1" />
      </g>
    );
  }
  if (mark === "stripe") {
    return <path fill={color} d="M8 19.6 19.6 8h4.4L12.4 23.2H8V19.6Z" />;
  }
  if (mark === "ring") {
    return (
      <circle cx="16" cy="16.2" r="6.2" fill="none" stroke={color} strokeWidth="2.4" />
    );
  }
  if (mark === "diamond") {
    return <path fill={color} d="M16 7.6 24.2 16 16 24.4 7.8 16Z" />;
  }
  if (mark === "bolt") {
    return <path fill={color} d="M17.8 7.4 10.4 16.6h5.1l-1.3 8 7.8-10.4h-5.2Z" />;
  }
  if (mark === "wing") {
    return (
      <path
        fill={color}
        d="M7.4 17.6c4.2-1.2 7.2-4.6 8.6-8.8 1.4 4.2 4.4 7.6 8.6 8.8-4 1.4-7.2 4.2-8.6 8.2-1.4-4-4.6-6.8-8.6-8.2Z"
      />
    );
  }
  if (mark === "gear") {
    return (
      <g fill={color}>
        <path d="M14.4 7.2h3.2l.6 2.4 2.2.9 2.2-1.4 2.2 2.2-1.4 2.2.9 2.2 2.4.6v3.2l-2.4.6-.9 2.2 1.4 2.2-2.2 2.2-2.2-1.4-2.2.9-.6 2.4h-3.2l-.6-2.4-2.2-.9-2.2 1.4-2.2-2.2 1.4-2.2-.9-2.2-2.4-.6v-3.2l2.4-.6.9-2.2-1.4-2.2 2.2-2.2 2.2 1.4 2.2-.9Z" />
        <circle cx="16" cy="16.2" r="3.1" fill={contrastOn(color) === "#ffffff" ? "#102027" : "#ffffff"} />
      </g>
    );
  }
  if (mark === "flame") {
    return (
      <path
        fill={color}
        d="M16 7.2c2.8 3.2 4.8 5.4 4.8 8.6 0 2.8-2.1 5.4-4.8 5.4s-4.8-2.6-4.8-5.4c0-1.5.7-3 1.8-4.4.2 1.6 1.1 2.6 2.2 2.6 1.4 0 1.8-1.8 1.2-4.2.5.4 1.1 1.4 1.6 2.4Z"
      />
    );
  }
  if (mark === "crown") {
    return <path fill={color} d="M7.6 19.8 9.2 11l4.1 4.4L16 8.6l2.7 6.8 4.1-4.4 1.6 8.8Z" />;
  }
  if (mark === "wave") {
    return (
      <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M8 13.2c1.8-2 3.6-2 5.4 0s3.6 2 5.4 0 3.6-2 5.2 0" />
        <path d="M8 17.6c1.8-2 3.6-2 5.4 0s3.6 2 5.4 0 3.6-2 5.2 0" />
      </g>
    );
  }
  if (mark === "dragon") {
    return (
      <path
        fill={color}
        d="M8.2 18.4c1.6-4.4 4.6-7.2 8.6-8.2 1.2 1.8 1.1 3.6.2 5.2 2.4-.4 4.6.4 6.2 2.2-2.2 1.2-4.8 1.4-7.2.6-.2 2.2-1.4 4.2-3.4 5.4-1.6-1.8-3.2-3.4-4.4-5.2Z"
      />
    );
  }
  if (mark === "bear") {
    return (
      <g fill={color}>
        <circle cx="11.2" cy="11" r="2.6" />
        <circle cx="20.8" cy="11" r="2.6" />
        <circle cx="16" cy="17" r="6.1" />
        <circle cx="13.7" cy="16.1" r="1.05" fill="#102027" />
        <circle cx="18.3" cy="16.1" r="1.05" fill="#102027" />
      </g>
    );
  }
  if (mark === "shield") {
    return (
      <path
        fill={color}
        d="M16 8.2 22.6 10.4v5.1c0 3.6-2.7 6.4-6.6 7.3-3.9-.9-6.6-3.7-6.6-7.3v-5.1L16 8.2Z"
      />
    );
  }
  if (mark === "cross") {
    return (
      <g fill={color}>
        <rect x="14.4" y="8.4" width="3.2" height="15.4" rx="1" />
        <rect x="8.3" y="13.5" width="15.4" height="3.2" rx="1" />
      </g>
    );
  }
  if (mark === "hawk") {
    return (
      <path
        fill={color}
        d="M16 8.4c2.2 2.4 6.8 4.8 8.8 5.6-2.6 1.2-5.4 2-8.8 2.4 3.4.4 6.2 1.2 8.8 2.4-2 0.8-6.6 3.2-8.8 5.6-2.2-2.4-6.8-4.8-8.8-5.6 2.6-1.2 5.4-2 8.8-2.4-3.4-.4-6.2-1.2-8.8-2.4 2-.8 6.6-3.2 8.8-5.6Z"
      />
    );
  }
  if (mark === "wheel") {
    return (
      <g fill="none" stroke={color} strokeWidth="2">
        <circle cx="16" cy="16.2" r="6.4" />
        <circle cx="16" cy="16.2" r="2.1" />
        <path d="M16 9.8v12.8M9.6 16.2h12.8M11.2 11.4l9.6 9.6M20.8 11.4l-9.6 9.6" />
      </g>
    );
  }
  if (mark === "ice") {
    return (
      <g fill={color}>
        <path d="M16 7.6 20.8 16 16 24.4 11.2 16Z" />
        <path d="M8.4 12.2h15.2v2.2H8.4Zm0 5.4h15.2v2.2H8.4Z" />
      </g>
    );
  }
  return (
    <text
      x="16"
      y="20.2"
      textAnchor="middle"
      fill={color}
      fontFamily="Manrope, sans-serif"
      fontSize="13"
      fontWeight="800"
    >
      {letter}
    </text>
  );
}
