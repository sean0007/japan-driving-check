/**
 * Can I drive in Japan? IDP / translation / 外免切替 checker. Rules as of 2026-10-27.
 * Sources: Road Traffic Act art. 107-2 (driving on a foreign license), art. 97-2 (conversion);
 * NPA 外国免許をお持ちの方へ; Keishicho pages kokugai04 (Geneva list, 令和8年5月), gaikokumenkyo (translation),
 * kokusaimenkyo (IDP rules), kokugai05 (conversion), oshirase/low (2025-10-01 changes); JAF switch page;
 * NTV news 2026-03-05 (NPA pass-rate figures).
 */
import {
  COUNTRIES,
  EXEMPT_BOTH,
  NOT_LISTED_NOTE,
  US_STATES,
  US_STATES_EXEMPT_BOTH,
  US_STATES_EXEMPT_SKILL,
  resolveCountry,
  resolveUsState,
  type CountryInfo,
  type Route,
} from "./countries";

export const RULES_AS_OF = "2026-10-27";

export class RuleInputError extends Error {}

export const DOCUMENTS = ["auto", "idp", "translation", "license_only", "japanese_license"] as const;
export type Document = (typeof DOCUMENTS)[number];
export const RESIDENCIES = ["visitor", "resident", "japanese_abroad"] as const;
export type Residency = (typeof RESIDENCIES)[number];

export const DOCUMENT_LABEL: Record<Document, string> = {
  auto: "Not sure / tell me what I need",
  idp: "International Driving Permit (IDP)",
  translation: "Home license + Japanese translation",
  license_only: "Only my home license",
  japanese_license: "A Japanese driver's license",
};
export const RESIDENCY_LABEL: Record<Residency, { en: string; ja: string }> = {
  visitor: { en: "Tourist / short-term visitor", ja: "短期滞在（観光など）" },
  resident: { en: "Resident with a residence card (on 住民票)", ja: "在留カードあり（住民基本台帳に記録）" },
  japanese_abroad: { en: "Japanese national living abroad", ja: "海外在住の日本人" },
};

export type Verdict = "can_drive" | "not_yet" | "expired" | "need_document" | "not_valid" | "unclear";
export const VERDICT_LABEL: Record<Verdict, string> = {
  can_drive: "You can drive",
  not_yet: "Valid once you land",
  expired: "Your period is over",
  need_document: "Get the right document first",
  not_valid: "Not valid in Japan",
  unclear: "Unclear: ask the police",
};

export type Trip = { left: string; returned: string };

export type CheckInput = {
  country: string;
  usState?: string | null;
  document?: Document;
  residency?: Residency;
  /** Date you (last) landed in Japan. Residents: the landing that started the count (first entry). */
  entryDate?: string | null;
  /** Residents: trips abroad after entryDate, for the 3-month rule */
  trips?: Trip[] | string | null;
  idpIssueDate?: string | null;
  licenseExpiry?: string | null;
  /** Months spent in the issuing country after getting the license (cumulative) */
  monthsInIssuingCountry?: number | null;
  age?: number | null;
  today?: string | null;
};

export const SOURCES = [
  "https://www.npa.go.jp/policies/application/license_renewal/have_DL_issed_another_country.html",
  "https://www.keishicho.metro.tokyo.lg.jp/menkyo/menkyo/kokugai/kokugai04.html",
  "https://www.keishicho.metro.tokyo.lg.jp/menkyo/menkyo/kokugai/gaikokumenkyo.html",
  "https://www.keishicho.metro.tokyo.lg.jp/menkyo/menkyo/kokugai/kokusaimenkyo.html",
  "https://www.keishicho.metro.tokyo.lg.jp/menkyo/menkyo/kokugai/kokugai05.html",
  "https://www.keishicho.metro.tokyo.lg.jp/menkyo/oshirase/low.html",
  "https://english.jaf.or.jp/driving-in-japan/drive-in-japan/switch-to-japanese-license",
];

export const DISCLAIMER =
  "Educational estimate, not legal advice. Not affiliated with the National Police Agency, any prefectural police or JAF. Driving without a valid license in Japan is a crime (無免許運転); rental companies and the police decide on the spot. Confirm with the police or your rental company before you drive.";

const DAY = 86_400_000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parseDate(v: string | null | undefined, name: string): number | null {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const t = String(v).trim().replace(/\//g, "-");
  if (!ISO.test(t)) throw new RuleInputError(`${name} must be YYYY-MM-DD, got "${v}"`);
  const ms = Date.UTC(Number(t.slice(0, 4)), Number(t.slice(5, 7)) - 1, Number(t.slice(8, 10)));
  if (new Date(ms).toISOString().slice(0, 10) !== t) throw new RuleInputError(`${name} is not a real date: "${v}"`);
  return ms;
}
export function fmt(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
export function todayJst(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}
/** Same day N months later, clamped to month end (for the 3-month rule). */
function addMonths(ms: number, months: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return Date.UTC(y, m, Math.min(d.getUTCDate(), last));
}
/** Last day of a period of N months that starts on (and counts) `ms` (Civil Code art. 143). */
export function periodLastDay(ms: number, months: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  if (d.getUTCDate() > last) return Date.UTC(y, m, last); // no corresponding day → month end
  return Date.UTC(y, m, d.getUTCDate()) - DAY;
}

export function parseTrips(raw: Trip[] | string | null | undefined): Trip[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw)
    .split(/[,;\s]+/)
    .filter(Boolean)
    .map((p) => {
      const m = p.match(/^(\d{4}[-/]\d{2}[-/]\d{2})(?:_|\.\.|~|〜|to)(\d{4}[-/]\d{2}[-/]\d{2})$/);
      if (!m) throw new RuleInputError(`trips: use left_returned pairs like 2026-08-01_2026-09-10, got "${p}"`);
      return { left: m[1], returned: m[2] };
    });
}

export type TestPlan = "exempt_both" | "exempt_skill" | "both" | "depends_on_state";
export function conversionTests(c: CountryInfo, usState: string | null): TestPlan {
  if (c.code === "US") {
    if (!usState) return "depends_on_state";
    if ((US_STATES_EXEMPT_BOTH as readonly string[]).includes(usState)) return "exempt_both";
    if ((US_STATES_EXEMPT_SKILL as readonly string[]).includes(usState)) return "exempt_skill";
    return "both";
  }
  return (EXEMPT_BOTH as readonly string[]).includes(c.code) ? "exempt_both" : "both";
}
export const TEST_LABEL: Record<TestPlan, string> = {
  exempt_both: "Paperwork + eye test only (knowledge and driving checks waived)",
  exempt_skill: "Knowledge check only (driving check waived)",
  both: "Knowledge check (50 questions, 45 to pass) + driving check",
  depends_on_state: "Depends on your US state",
};

const ROUTE_TEXT: Record<Route, string> = {
  idp: "1949 Geneva-format International Driving Permit (IDP) + your home license",
  translation: "your home license + an official Japanese translation",
  none: "no short-term route: you need a Japanese license (外免切替 or driving school)",
  unclear: "unclear: NPA has no confirmed answer for this country's IDP",
  japan: "a Japanese driver's license",
};
const TRANSLATORS: Record<string, string[]> = {
  _all: ["the issuing authority or its embassy/consulate in Japan", "JAF (Japan Automobile Federation)", "訪日運転者支援協会 (Japan Visitor Driving Support Association)"],
  DE: ["ADAC (German Automobile Club, Germany only)"],
  TW: ["台湾日本関係協会 (Taiwan–Japan Relations Association)", "ZIPLUS (ジップラス, Taiwan only)"],
};

export function checkDriving(input: CheckInput) {
  const country = resolveCountry(input.country ?? "");
  if (!country) throw new RuleInputError(`Unknown country "${input.country}". Use an ISO code (US, GB, CN, TW…) or the English/Japanese name.`);
  const usState = country.code === "US" ? resolveUsState(input.usState) : null;
  if (country.code === "US" && input.usState && !usState) throw new RuleInputError(`Unknown US state "${input.usState}". Use a two-letter code like CA or WA.`);
  const residency: Residency = input.residency ?? "visitor";
  const doc: Document = input.document ?? "auto";
  const todayStr = input.today ? input.today : todayJst();
  const today = parseDate(todayStr, "today")!;
  const entry = parseDate(input.entryDate, "entryDate");
  const idpIssue = parseDate(input.idpIssueDate, "idpIssueDate");
  const licExp = parseDate(input.licenseExpiry, "licenseExpiry");
  const trips = parseTrips(input.trips);
  const months = input.monthsInIssuingCountry ?? null;
  const age = input.age ?? null;
  if (months !== null && (!(months >= 0) || months > 1200)) throw new RuleInputError("monthsInIssuingCountry must be 0–1200");
  if (age !== null && (!(age >= 0) || age > 120)) throw new RuleInputError("age must be 0–120");

  const warnings: string[] = [];
  const steps: string[] = [];
  const route: Route = country.route;
  if (country.note) warnings.push(country.note);

  // ---- 1) Short-term driving on a foreign license ----
  let verdict: Verdict;
  let headline: string;
  let summary: string;
  let countStart: number | null = null;
  let lastDay: number | null = null;
  const limits: { reason: string; lastDay: string }[] = [];
  const restarts: string[] = [];

  const assumed = doc === "auto" && (route === "idp" || route === "translation");
  const usableDoc = (route === "idp" && (doc === "idp" || assumed)) || (route === "translation" && (doc === "translation" || assumed));
  const withDoc = assumed ? (route === "idp" ? "With a Geneva IDP: " : "With a translation: ") : "";
  if (doc === "japanese_license" || route === "japan") {
    verdict = "can_drive";
    headline = "A valid Japanese license lets you drive";
    summary = "With a valid Japanese driver's license you can drive in Japan with no 1-year limit. Keep it renewed; an expired one must be reinstated at a license center.";
  } else if (route === "unclear" && doc !== "translation" && doc !== "license_only") {
    verdict = "unclear";
    headline = `${country.en}: IDP status not confirmed by NPA`;
    summary = `${country.en} is on the UN Geneva Convention list, but NPA's inquiry about its IDP is open or unanswered (May 2026). Ask the police license center or your rental company before relying on it; the safe route is a Japanese license.`;
  } else if (!usableDoc || (assumed && entry === null)) {
    const wrongDoc = doc === "idp" || doc === "translation" || doc === "license_only";
    if (route === "none" || route === "unclear") {
      verdict = "not_valid";
      headline = `A ${country.en} license can't be used to drive in Japan`;
      summary = `${country.en} has no accepted IDP or translation route in Japan, so neither its license nor its IDP lets you drive. Residents can convert it to a Japanese license (外免切替); visitors can't drive.`;
    } else if (wrongDoc && !assumed) {
      verdict = "not_valid";
      headline = doc === "license_only" ? "Your home license alone isn't enough" : route === "idp" ? "For this country you need a Geneva IDP, not a translation" : "For this country you need a translation, not an IDP";
      summary = `To drive in Japan on a ${country.en} license you need ${ROUTE_TEXT[route]}. ${route === "translation" ? `${country.en} IDPs are not valid in Japan.` : "A translation is only accepted for Switzerland, Germany, France, Belgium, Monaco and Taiwan."}`;
    } else {
      verdict = "need_document";
      headline = route === "idp" ? "Bring a 1949 Geneva IDP and your home license" : "Bring your home license and an official Japanese translation";
      summary = `With a ${country.en} license you can drive in Japan for up to 1 year from landing using ${ROUTE_TEXT[route]}. Get it before you fly: ${route === "idp" ? "IDPs are issued only in the country that issued your license" : "translations come from JAF, the issuing authority/embassy or the other approved bodies"}.`;
    }
    if (route === "idp") steps.push(`Get a 1949 Geneva-format IDP in ${country.en} before you travel (Japan does not accept Vienna-format IDPs).`);
    if (route === "translation") steps.push(`Get a Japanese translation from: ${[...(TRANSLATORS[country.code] ?? []), ...TRANSLATORS._all].join("; ")}.`);
  } else {
    // We have (or assume) a valid kind of document; work out the dates.
    if (assumed) steps.push(route === "idp" ? `Get a 1949 Geneva-format IDP in ${country.en} before you travel; without it your home license alone isn't valid.` : `Get a Japanese translation from: ${[...(TRANSLATORS[country.code] ?? []), ...TRANSLATORS._all].join("; ")}.`);
    if (entry === null) {
      verdict = "can_drive";
      headline = route === "idp" ? "Your Geneva IDP works: 1 year from landing" : "Your license + translation works: 1 year from landing";
      summary = `You can drive for up to 1 year counted from the day you land in Japan${route === "idp" ? ", and never past the IDP's own 1-year validity" : ""} or your home license's expiry. Add your landing date for the exact last day.`;
    } else {
      countStart = entry;
      if (residency === "visitor") {
        const latest = trips.map((t) => parseDate(t.returned, "trips")!).filter((r) => r <= today).sort((a, b) => a - b).pop();
        if (latest !== undefined && latest > entry) {
          countStart = latest;
          restarts.push(`${fmt(latest)}: you landed again as a visitor, so the 1 year restarts from this landing.`);
        }
      } else {
        const sorted = trips.map((t) => ({ l: parseDate(t.left, "trips")!, r: parseDate(t.returned, "trips")! })).sort((a, b) => a.l - b.l);
        for (const t of sorted) {
          if (t.r < t.l) throw new RuleInputError("trips: returned date is before departure");
          if (t.l < entry) throw new RuleInputError("trips must be after entryDate");
          if (t.r > today) {
            warnings.push(`Trip returning ${fmt(t.r)} is in the future: ignored for today's answer.`);
            continue;
          }
          if (t.r >= addMonths(t.l, 3)) {
            countStart = t.r;
            restarts.push(`${fmt(t.l)} → ${fmt(t.r)}: away 3 months or more, so the 1 year restarts on ${fmt(t.r)}.`);
          } else {
            restarts.push(`${fmt(t.l)} → ${fmt(t.r)}: away less than 3 months, so the count does NOT restart (3-month rule).`);
          }
        }
      }
      const yearEnd = periodLastDay(countStart, 12);
      limits.push({ reason: "1 year from landing", lastDay: fmt(yearEnd) });
      if (route === "idp") {
        if (idpIssue !== null) limits.push({ reason: "IDP validity (1 year from issue)", lastDay: fmt(periodLastDay(idpIssue, 12)) });
        else warnings.push("Add the IDP issue date: a Geneva IDP is valid for 1 year from issue, which may end before your 1 year in Japan.");
      }
      if (licExp !== null) limits.push({ reason: "home license expiry", lastDay: fmt(licExp) });
      lastDay = Math.min(...limits.map((l) => parseDate(l.lastDay, "x")!));
      const limiting = limits.find((l) => l.lastDay === fmt(lastDay!))!;
      const daysLeft = Math.round((lastDay - today) / DAY) + 1;
      if (idpIssue !== null && idpIssue > countStart && idpIssue > today) warnings.push("The IDP issue date is in the future.");
      if (today < countStart) {
        verdict = "not_yet";
        headline = `${withDoc}From ${fmt(countStart)} you can drive until ${fmt(lastDay)}`;
        summary = `Counting from your landing on ${fmt(countStart)}, your last driving day is ${fmt(lastDay)} (limited by ${limiting.reason}).`;
      } else if (today > lastDay) {
        verdict = "expired";
        headline = `${withDoc}Your last driving day was ${fmt(lastDay)}`;
        summary = `Your period ended on ${fmt(lastDay)} (${limiting.reason}). Driving now would be driving without a license. ${residency === "resident" ? "Convert to a Japanese license (外免切替)." : "A new trip to Japan (visitors) or a new IDP may start a new period."}`;
      } else {
        verdict = "can_drive";
        headline = `${withDoc}You can drive until ${fmt(lastDay)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`;
        summary = `Counting from ${fmt(countStart)}, your last driving day is ${fmt(lastDay)}, limited by ${limiting.reason}. Carry ${route === "idp" ? "the IDP, your home license and passport" : "your home license, the translation and passport"} whenever you drive.`;
      }
      if (residency === "resident") {
        warnings.push("3-month rule: once you're on the resident register, a trip abroad of less than 3 months does not restart the 1 year. After it runs out you must convert (外免切替).");
        if (verdict === "can_drive") steps.push(`Book your 外免切替 well before ${fmt(lastDay)}: appointments in Tokyo are weeks out, and you can't drive on the foreign license after that day.`);
      }
    }
  }
  if (route === "idp" && (doc === "idp" || doc === "auto")) warnings.push("Only 1949 Geneva-format IDPs are valid. Vienna-format (1968) IDPs, online \"international license\" booklets and IDPs from a different country than your license are not.");
  if (country.code === "US") warnings.push("US IDPs are issued only by AAA (and AATA). Get one before you fly; you can't get one in Japan.");

  // ---- 2) Conversion to a Japanese license (外免切替) ----
  const tests = conversionTests(country, usState);
  const blockers: string[] = [];
  if (route === "japan" || doc === "japanese_license") {
    // nothing to convert
  } else {
    if (residency === "visitor") blockers.push("Since 2025-10-01 you need a 住民票 (resident record): tourists and other short-term visitors can't convert.");
    if (licExp !== null && licExp < today) blockers.push("Your foreign license has expired: only a valid license can be converted.");
    if (months !== null && months < 3) blockers.push(`You need 3+ months (cumulative) in ${country.en} after getting the license; you entered ${months}. Passport stamps are the proof.`);
    if (age !== null && age < 17.5) blockers.push("Ordinary (普通) license: apply from 17 years 6 months; issued at 18.");
  }
  const canConvert = route === "japan" || doc === "japanese_license" ? "not_needed" : blockers.length ? "no" : months === null ? "check" : "yes";
  const conversion =
    canConvert === "not_needed"
      ? { canApply: canConvert, blockers, tests: null, testsLabel: null, documents: [], fees: null, notes: [] }
      : {
          canApply: canConvert as "yes" | "no" | "check",
          blockers,
          tests,
          testsLabel: TEST_LABEL[tests] + (tests === "depends_on_state" ? `: exempt from both for ${US_STATES_EXEMPT_BOTH.map((s) => US_STATES[s]).join(", ")}; driving check waived for Indiana; other states take both.` : ""),
          documents: [
            "Application form (at the license center)",
            "Photo 3.0 × 2.4 cm, taken within 6 months",
            residency === "japanese_abroad" ? "戸籍謄本/抄本 or 戸籍の附票 + proof of where you stay in Japan" : "住民票の写し with nationality etc. (特定事項) shown, issued within 6 months (required since 2025-10-01)",
            "Your valid foreign license (original; an IDP is not accepted)",
            "Japanese translation of the license (JAF, embassy, or other approved body)",
            "Passport(s) covering the time you got the license and the 3+ months in that country",
            "Residence card or other ID",
          ],
          fees: { currency: "JPY", application: 2500, issuance: 2350, total: 4850, note: "Tokyo (Keishicho) fees for an ordinary (普通) car license; translation fee extra. Other prefectures are similar." },
          notes: [
            "Since 2025-10-01 the knowledge check is 50 written questions and you need 45 (90%); illustration questions were dropped. The driving check got stricter (crosswalks, railroad crossings, more scoring).",
            "Reported pass rates after the change (Oct–Dec 2025, NPA figures via NTV 2026-03-05): knowledge 42.8%, driving 13.1% (2024: 92.5% and 30.4%).",
            "Vision: both eyes 0.7+, each eye 0.3+ (ordinary).",
            "The new license has the green band and you must show the beginner mark (初心者マーク) for your first year.",
            "Apply in person at the license center for your address (Tokyo: book online for Fuchu, Samezu or Koto). No proxies.",
          ],
        };

  if (residency === "resident" && canConvert !== "not_needed") steps.push(tests === "exempt_both" ? "Convert: gather the documents and book a 外免切替 appointment; for your country it's paperwork and an eye test." : "Convert: book a 外免切替 appointment and study for the 50-question knowledge check; many people now need several driving-check attempts, so start early.");
  if (residency === "visitor" && route !== "japan") steps.push("Rental companies check the document at pickup: bring the original license, the IDP or translation, and your passport.");

  const sources = [...SOURCES];
  return {
    country: { code: country.code, en: country.en, ja: country.ja, route },
    usState: usState ? { code: usState, name: US_STATES[usState] } : null,
    residency,
    document: doc,
    verdict,
    verdictLabel: VERDICT_LABEL[verdict],
    headline,
    summary,
    howToDrive: ROUTE_TEXT[route],
    period: {
      countStart: countStart !== null ? fmt(countStart) : null,
      lastDay: lastDay !== null ? fmt(lastDay) : null,
      daysLeft: lastDay !== null ? Math.round((lastDay - today) / DAY) + 1 : null,
      limits,
      restarts,
      today: fmt(today),
    },
    conversion,
    steps,
    warnings,
    sources,
    rulesAsOf: RULES_AS_OF,
    disclaimer: DISCLAIMER,
  };
}
export type CheckResult = ReturnType<typeof checkDriving>;

export const RULES = {
  rulesAsOf: RULES_AS_OF,
  name: "Driving in Japan on a foreign license, and converting it (外免切替)",
  legalBasis: "Road Traffic Act art. 107-2 (international/foreign licenses), art. 97-2(1)(iii) (conversion)",
  shortTerm: {
    routes: {
      idp: "1949 Geneva Convention IDP from a party that issues the Geneva format (+ home license). Vienna-format IDPs are not valid.",
      translation: "License from Switzerland, Germany, France, Belgium, Monaco or Taiwan + Japanese translation by the issuing authority/embassy, JAF, 訪日運転者支援協会, ADAC (Germany) or 台湾日本関係協会 / ZIPLUS (Taiwan).",
    },
    period: "Up to 1 year counted from the landing date, but not past the IDP's validity (1 year from issue) or the home license's expiry.",
    threeMonthRule: "People on the Basic Resident Register who leave and return within less than 3 months don't restart the count; 3 months or more restarts it. Visitors restart on each landing.",
    genevaIdpCountries: Object.values(COUNTRIES).filter((c) => c.route === "idp").map((c) => `${c.code} ${c.en}`),
    translationCountries: Object.values(COUNTRIES).filter((c) => c.route === "translation").map((c) => `${c.code} ${c.en}`),
    nonIssuingParties: Object.values(COUNTRIES).filter((c) => c.route === "none" && c.note !== NOT_LISTED_NOTE).map((c) => `${c.code} ${c.en}`),
    unclear: Object.values(COUNTRIES).filter((c) => c.route === "unclear").map((c) => `${c.code} ${c.en}`),
    listAsOf: "NPA data 令和8年5月 (Keishicho page updated 2026-07-02)",
  },
  conversion: {
    who: "Holders of a valid foreign license who spent 3+ months (cumulative) in the issuing country after getting it and who have a 住民票 (since 2025-10-01; tourists can't apply). Exceptions for diplomats, SOFA etc.; Japanese nationals abroad use 戸籍 documents.",
    exemptBoth: EXEMPT_BOTH.map((c) => (c === "US" ? `US (${US_STATES_EXEMPT_BOTH.join(", ")} only)` : c)),
    exemptSkillOnly: ["US (IN)"],
    knowledgeCheck: "50 questions, pass 45 (since 2025-10-01)",
    passRates: { period: "2025-10 to 2025-12", knowledge: 0.428, skill: 0.131, previousYear2024: { knowledge: 0.925, skill: 0.304 }, source: "NPA figures reported by NTV, 2026-03-05" },
    feesTokyoOrdinary: { application: 2500, issuance: 2350 },
    age: "Ordinary: apply from 17y6m, license from 18; medium 20; large 21",
    vision: "Ordinary: both eyes 0.7+, each eye 0.3+",
  },
  sources: SOURCES,
  disclaimer: DISCLAIMER,
};
