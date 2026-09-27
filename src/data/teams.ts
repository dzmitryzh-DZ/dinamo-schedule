import type { MatchInfo, TeamItem, TeamMark } from "./types";

export const TEAM_MARKS: TeamMark[] = [
  "letter",
  "anchor",
  "star",
  "bars",
  "stripe",
  "ring",
  "diamond",
  "bolt",
  "wing",
  "gear",
  "flame",
  "crown",
  "wave",
  "dragon",
  "bear",
  "shield",
  "cross",
  "hawk",
  "wheel",
  "ice",
];

export const DEFAULT_TEAMS: TeamItem[] = [
  { id: "team-adm", abbr: "ADM", ru: "Адмирал", en: "Admiral", color: "#0a3161", color2: "#f47b20", mark: "anchor" },
  { id: "team-akb", abbr: "AKB", ru: "Ак Барс", en: "Ak Bars", color: "#007a3d", color2: "#e31e24", mark: "bars" },
  { id: "team-amu", abbr: "AMU", ru: "Амур", en: "Amur", color: "#f15a22", color2: "#111111", mark: "hawk" },
  { id: "team-avg", abbr: "AVG", ru: "Авангард", en: "Avangard", color: "#e30613", color2: "#111111", mark: "hawk" },
  { id: "team-avt", abbr: "AVT", ru: "Автомобилист", en: "Avtomobilist", color: "#ff6b00", color2: "#1a1a1a", mark: "wheel" },
  { id: "team-bar", abbr: "BAR", ru: "Барыс", en: "Barys", color: "#0057b8", color2: "#f5c518", mark: "bear" },
  { id: "team-csk", abbr: "CSK", ru: "ЦСКА", en: "CSKA", color: "#e30613", color2: "#0033a0", mark: "star" },
  { id: "team-dyn", abbr: "DYN", ru: "Динамо Мск", en: "Dynamo Moscow", color: "#0d47a1", color2: "#ffffff", mark: "letter" },
  { id: "team-lad", abbr: "LAD", ru: "Лада", en: "Lada", color: "#1565c0", color2: "#ffffff", mark: "wheel" },
  { id: "team-lok", abbr: "LOK", ru: "Локомотив", en: "Lokomotiv", color: "#c8102e", color2: "#1b5e20", mark: "wheel" },
  { id: "team-mmg", abbr: "MMG", ru: "Металлург Мг", en: "Metallurg Mg", color: "#f47321", color2: "#1a365d", mark: "shield" },
  { id: "team-mm2", abbr: "MM2", ru: "MM2", en: "MM2", color: "#455a64", color2: "#90caf9", mark: "ice" },
  { id: "team-nfh", abbr: "NFH", ru: "Нефтехимик", en: "Neftekhimik", color: "#5b8c3e", color2: "#f5c518", mark: "flame" },
  { id: "team-sal", abbr: "SAL", ru: "Салават Юлаев", en: "Salavat Yulaev", color: "#2e7d32", color2: "#ffffff", mark: "star" },
  { id: "team-sev", abbr: "SEV", ru: "Северсталь", en: "Severstal", color: "#f2c200", color2: "#0a3161", mark: "bolt" },
  { id: "team-shd", abbr: "SHD", ru: "Шанхай", en: "Shanghai", color: "#c8102e", color2: "#d4a017", mark: "dragon" },
  { id: "team-sib", abbr: "SIB", ru: "Сибирь", en: "Sibir", color: "#1e7a46", color2: "#ffffff", mark: "ice" },
  { id: "team-ska", abbr: "SKA", ru: "СКА", en: "SKA", color: "#c8102e", color2: "#c5a572", mark: "star" },
  { id: "team-soc", abbr: "SOC", ru: "Сочи", en: "Sochi", color: "#0277bd", color2: "#f47b20", mark: "wave" },
  { id: "team-spa", abbr: "SPA", ru: "Спартак", en: "Spartak", color: "#e30613", color2: "#ffffff", mark: "diamond" },
  { id: "team-tor", abbr: "TOR", ru: "Торпедо", en: "Torpedo", color: "#00a0b0", color2: "#ffffff", mark: "bolt" },
  { id: "team-trk", abbr: "TRK", ru: "Трактор", en: "Traktor", color: "#f5c518", color2: "#111111", mark: "gear" },
];

export function teamLabel(team: TeamItem, lang: "ru" | "en"): string {
  return lang === "ru" ? team.ru || team.en : team.en || team.ru;
}

export function findTeamForMatch(
  teams: TeamItem[],
  match?: MatchInfo | null
): TeamItem | undefined {
  if (!match) return undefined;
  if (match.teamId) {
    const byId = teams.find((team) => team.id === match.teamId);
    if (byId) return byId;
  }
  const abbr = match.opponent.trim().toUpperCase();
  if (!abbr) return undefined;
  return teams.find((team) => team.abbr.toUpperCase() === abbr);
}

export function sortTeams(teams: TeamItem[]): TeamItem[] {
  return [...teams].sort((a, b) => a.abbr.localeCompare(b.abbr, "en"));
}
