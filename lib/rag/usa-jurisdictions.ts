import type { Locale } from "@/lib/i18n";

export const USA_FEDERAL_SUB_JURISDICTION = "FEDERAL" as const;

/** Federal + 50 states + DC + 5 US territories. */
const USA_STATE_AND_TERRITORY_JURISDICTIONS = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "PR",
  "GU",
  "VI",
  "AS",
  "MP",
] as const;

export const USA_SUB_JURISDICTIONS = [
  USA_FEDERAL_SUB_JURISDICTION,
  ...USA_STATE_AND_TERRITORY_JURISDICTIONS,
] as const;

export type UsaSubJurisdiction = (typeof USA_SUB_JURISDICTIONS)[number];

const EN_LABELS: Record<UsaSubJurisdiction, string> = {
  FEDERAL: "Federal (nationwide)",
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  PR: "Puerto Rico",
  GU: "Guam",
  VI: "U.S. Virgin Islands",
  AS: "American Samoa",
  MP: "Northern Mariana Islands",
};

const UK_LABELS: Record<UsaSubJurisdiction, string> = {
  FEDERAL: "Федеральна (загальнодержавна)",
  AL: "Алабама",
  AK: "Аляска",
  AZ: "Аризона",
  AR: "Арканзас",
  CA: "Каліфорнія",
  CO: "Колорадо",
  CT: "Коннектикут",
  DE: "Делавер",
  DC: "Округ Колумбія",
  FL: "Флорида",
  GA: "Джорджія",
  HI: "Гаваї",
  ID: "Айдахо",
  IL: "Іллінойс",
  IN: "Індіана",
  IA: "Айова",
  KS: "Канзас",
  KY: "Кентуккі",
  LA: "Луїзіана",
  ME: "Мен",
  MD: "Меріленд",
  MA: "Массачусетс",
  MI: "Мічиган",
  MN: "Міннесота",
  MS: "Міссісіпі",
  MO: "Міссурі",
  MT: "Монтана",
  NE: "Небраска",
  NV: "Невада",
  NH: "Нью-Гемпшир",
  NJ: "Нью-Джерсі",
  NM: "Нью-Мексико",
  NY: "Нью-Йорк",
  NC: "Північна Кароліна",
  ND: "Північна Дакота",
  OH: "Огайо",
  OK: "Оклахома",
  OR: "Орегон",
  PA: "Пенсильванія",
  RI: "Род-Айленд",
  SC: "Південна Кароліна",
  SD: "Південна Дакота",
  TN: "Теннессі",
  TX: "Техас",
  UT: "Юта",
  VT: "Вермонт",
  VA: "Вірджинія",
  WA: "Вашингтон",
  WV: "Західна Вірджинія",
  WI: "Вісконсин",
  WY: "Вайомінг",
  PR: "Пуерто-Рико",
  GU: "Гуам",
  VI: "Віргінські острови США",
  AS: "Американське Самоа",
  MP: "Північні Маріанські острови",
};

export function isUsaSubJurisdiction(value: string): value is UsaSubJurisdiction {
  return (USA_SUB_JURISDICTIONS as readonly string[]).includes(value);
}

export function parseUsaSubJurisdiction(value: string | null | undefined): UsaSubJurisdiction | null {
  if (!value) return null;
  return isUsaSubJurisdiction(value) ? value : null;
}

export function getUsaSubJurisdictionLabel(code: UsaSubJurisdiction, locale: Locale): string {
  return locale === "uk" ? UK_LABELS[code] : EN_LABELS[code];
}

export function compareUsaSubJurisdictions(left: UsaSubJurisdiction, right: UsaSubJurisdiction, locale: Locale) {
  return getUsaSubJurisdictionLabel(left, locale).localeCompare(getUsaSubJurisdictionLabel(right, locale), locale);
}

/** Federal first, then states and territories alphabetically by English label. */
export const USA_SUB_JURISDICTIONS_SORTED = [
  USA_FEDERAL_SUB_JURISDICTION,
  ...[...USA_STATE_AND_TERRITORY_JURISDICTIONS].sort((left, right) =>
    EN_LABELS[left].localeCompare(EN_LABELS[right]),
  ),
];

export function documentMatchesUsaSubJurisdiction(
  scope: UsaSubJurisdiction,
  documentSub: UsaSubJurisdiction | null,
): boolean {
  if (!documentSub) return false;
  if (documentSub === scope) return true;
  return documentSub === USA_FEDERAL_SUB_JURISDICTION && scope !== USA_FEDERAL_SUB_JURISDICTION;
}
