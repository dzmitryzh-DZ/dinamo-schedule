import { FLIGHT_DEST_MAX, type FlightDest, type Lang } from "./types";

export type Airport = {
  code: string;
  ru: string;
  en: string;
};

type AirportDef = Airport & {
  aliases?: string[];
};

const AIRPORT_DEFS: AirportDef[] = [
  { code: "MSQ", ru: "Минск", en: "Minsk", aliases: ["минск", "minsk"] },
  {
    code: "KUF",
    ru: "Самара",
    en: "Samara",
    aliases: ["самара", "samara", "курумоч", "kurumoch"],
  },
  { code: "KZN", ru: "Казань", en: "Kazan", aliases: ["казань", "kazan"] },
  {
    code: "SVX",
    ru: "Екатеринбург",
    en: "Yekaterinburg",
    aliases: ["екб", "екатеринбург", "yekaterinburg", "koltsovo"],
  },
  {
    code: "CEK",
    ru: "Челябинск",
    en: "Chelyabinsk",
    aliases: ["челябинск", "chelyabinsk"],
  },
  {
    code: "OVB",
    ru: "Новосибирск",
    en: "Novosibirsk",
    aliases: ["новосибирск", "novosibirsk", "толмачево"],
  },
  {
    code: "LED",
    ru: "Санкт-Петербург",
    en: "Saint Petersburg",
    aliases: ["спб", "питер", "pulkovo", "пулково", "petersburg"],
  },
  {
    code: "SVO",
    ru: "Москва",
    en: "Moscow",
    aliases: ["москва", "moscow", "шереметьево", "svo"],
  },
  { code: "DME", ru: "Москва (Домодедово)", en: "Moscow (Domodedovo)" },
  { code: "VKO", ru: "Москва (Внуково)", en: "Moscow (Vnukovo)" },
  { code: "AER", ru: "Сочи", en: "Sochi", aliases: ["сочи", "sochi"] },
  { code: "UFA", ru: "Уфа", en: "Ufa", aliases: ["уфа", "ufa"] },
  {
    code: "GOJ",
    ru: "Нижний Новгород",
    en: "Nizhny Novgorod",
    aliases: ["нижний", "nizhny", "strigino"],
  },
  { code: "OMS", ru: "Омск", en: "Omsk", aliases: ["омск", "omsk"] },
  {
    code: "KHV",
    ru: "Хабаровск",
    en: "Khabarovsk",
    aliases: ["хабаровск", "khabarovsk"],
  },
  {
    code: "VVO",
    ru: "Владивосток",
    en: "Vladivostok",
    aliases: ["владивосток", "vladivostok"],
  },
  {
    code: "MQF",
    ru: "Магнитогорск",
    en: "Magnitogorsk",
    aliases: ["магнитогорск", "magnitogorsk"],
  },
  {
    code: "NBC",
    ru: "Нижнекамск",
    en: "Nizhnekamsk",
    aliases: ["нижнекамск", "begishevo", "бегишево"],
  },
  {
    code: "NQZ",
    ru: "Астана",
    en: "Astana",
    aliases: ["астана", "astana", "tse", "нурсултан"],
  },
  {
    code: "IAR",
    ru: "Ярославль",
    en: "Yaroslavl",
    aliases: ["ярославль", "yaroslavl", "tunoshna"],
  },
  {
    code: "CEE",
    ru: "Череповец",
    en: "Cherepovets",
    aliases: ["череповец", "cherepovets"],
  },
  {
    code: "PVG",
    ru: "Шанхай",
    en: "Shanghai",
    aliases: ["шанхай", "shanghai", "pudong"],
  },
  { code: "SHA", ru: "Шанхай (Хунцяо)", en: "Shanghai (Hongqiao)" },
  {
    code: "KGD",
    ru: "Калининград",
    en: "Kaliningrad",
    aliases: ["калининград", "kaliningrad"],
  },
  { code: "PEK", ru: "Пекин", en: "Beijing", aliases: ["пекин", "beijing"] },
  { code: "KRR", ru: "Краснодар", en: "Krasnodar" },
  { code: "ROV", ru: "Ростов-на-Дону", en: "Rostov-on-Don" },
  { code: "TJM", ru: "Тюмень", en: "Tyumen" },
  { code: "PEE", ru: "Пермь", en: "Perm" },
  { code: "IKT", ru: "Иркутск", en: "Irkutsk" },
  { code: "KJA", ru: "Красноярск", en: "Krasnoyarsk" },
  { code: "SKX", ru: "Саранск", en: "Saransk", aliases: ["саранск", "saransk"] },
];

const AIRPORT_BY_KEY = new Map<string, Airport>();

function indexKey(value: string): string {
  return value.replace(/\s+/g, "").toLocaleUpperCase();
}

for (const airport of AIRPORT_DEFS) {
  const record: Airport = {
    code: airport.code,
    ru: airport.ru,
    en: airport.en,
  };
  AIRPORT_BY_KEY.set(airport.code, record);
  for (const alias of airport.aliases ?? []) {
    AIRPORT_BY_KEY.set(indexKey(alias), record);
  }
}

/** Strip "to "/"в " prefixes and collapse spaces for airport lookup. */
export function normalizeAirportKey(dest: string): string {
  return dest
    .replace(/^\s*(to|в|во)\s+/i, "")
    .replace(/\s+/g, "")
    .trim()
    .toLocaleUpperCase();
}

export function findAirport(dest: string): Airport | undefined {
  const key = normalizeAirportKey(dest);
  if (!key) return undefined;
  return AIRPORT_BY_KEY.get(key);
}

export type FlightStamp = {
  code: string;
  airport?: Airport;
};

/** Word shown on the stamp for the active language, with fallback to the other. */
export function flightDestText(
  dest: FlightDest | string,
  lang: Lang
): string {
  if (typeof dest === "string") return dest.trim();
  const primary = (lang === "en" ? dest.en : dest.ru).trim();
  const fallback = (lang === "en" ? dest.ru : dest.en).trim();
  return primary || fallback;
}

function stampDisplay(dest: string): string {
  return dest
    .replace(/^\s*(to|в|во)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FLIGHT_DEST_MAX)
    .toLocaleUpperCase();
}

/** Short stamp: IATA code if the user typed a code, otherwise the word as written. */
export function resolveFlightStamp(dest: string): FlightStamp {
  const airport = findAirport(dest);
  const key = normalizeAirportKey(dest);
  if (airport && key === airport.code) {
    return { code: airport.code, airport };
  }
  const code = stampDisplay(dest) || key;
  if (airport) return { code, airport };
  return { code };
}

export function airportCity(airport: Airport, lang: Lang): string {
  return lang === "en" ? airport.en || airport.ru : airport.ru || airport.en;
}

export type AirportLegendItem = {
  code: string;
  name: string;
};

function isIataCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value);
}

export function collectAirportLegend(
  dests: Iterable<string>,
  lang: Lang
): AirportLegendItem[] {
  const seen = new Set<string>();
  const items: AirportLegendItem[] = [];
  for (const dest of dests) {
    const stamp = resolveFlightStamp(dest);
    if (!stamp.code) continue;
    if (!stamp.airport && !isIataCode(stamp.code)) continue;
    const id = stamp.airport?.code ?? stamp.code;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      code: stamp.airport?.code ?? stamp.code,
      name: stamp.airport ? airportCity(stamp.airport, lang) : "",
    });
  }
  items.sort((a, b) => a.code.localeCompare(b.code, "en"));
  return items;
}
