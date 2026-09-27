import type { RosterPlayer } from "../data/types";
import { InjuryMark } from "./InjuryMark";

type Props = {
  player: RosterPlayer;
  showNumber?: boolean;
  injuredLabel: string;
};

export function PlayerName({
  player,
  showNumber = true,
  injuredLabel,
}: Props) {
  const number = player.number.trim();
  const ru = player.ru.trim();
  const en = player.en.trim();

  if (!ru && !en) return null;

  const showEn = Boolean(en) && en.toLowerCase() !== (ru || en).toLowerCase();
  const prefix = showNumber && number ? `№${number} ` : "";

  return (
    <span className="player-name">
      {prefix}
      <span className="ru-name">{ru || en}</span>
      {showEn && (
        <>
          {" / "}
          <span className="en-name">{en}</span>
        </>
      )}
      {player.injured ? <InjuryMark title={injuredLabel} /> : null}
    </span>
  );
}

