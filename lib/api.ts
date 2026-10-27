import { InputError, type Endpoint, type Input } from "./agent-api";
import { DISCLAIMER, DOCUMENTS, RESIDENCIES, RuleInputError, checkDriving, type Document, type Residency } from "./driving";
import { SITE_NAME, SITE_TAGLINE } from "./site";

export const PUBLIC_URL = "https://japan-driving-check.vercel.app";
export const API_DISCLAIMER = DISCLAIMER;
export const API_INFO = { title: `${SITE_NAME} API`, description: SITE_TAGLINE, version: "1.0.0" };

export const EXAMPLE_GET = "/api/check?country=US&usState=CA&document=idp&entryDate=2026-11-01&idpIssueDate=2026-06-15";

function first(v: unknown): unknown {
  return Array.isArray(v) ? v[0] : v;
}
function s(v: unknown): string | null {
  const f = first(v);
  return f === undefined || f === null || String(f).trim() === "" ? null : String(f).trim();
}
function n(v: unknown, name: string): number | null {
  const raw = s(v);
  if (raw === null) return null;
  const x = Number(raw.replace(/[,_\s]/g, "").replace(/(months?|mo|か月|ヶ月|歳|years?|y)$/i, ""));
  if (!Number.isFinite(x)) throw new InputError(`Not a number: ${name}`);
  return x;
}

const DOC_ALIASES: Record<string, Document> = {
  international_driving_permit: "idp", international_permit: "idp", international_license: "idp", geneva: "idp", 国際免許: "idp", 国際運転免許証: "idp",
  translation: "translation", jaf: "translation", jaf_translation: "translation", 翻訳: "translation", 翻訳文: "translation",
  license: "license_only", home_license: "license_only", none: "license_only", only_license: "license_only", foreign_license: "license_only", 外国免許: "license_only",
  japanese: "japanese_license", jp_license: "japanese_license", 日本の免許: "japanese_license", 日本免許: "japanese_license",
  unknown: "auto", not_sure: "auto", "?": "auto",
};
const RES_ALIASES: Record<string, Residency> = {
  tourist: "visitor", short_term: "visitor", temporary_visitor: "visitor", visa_free: "visitor", traveler: "visitor", 観光: "visitor", 短期滞在: "visitor",
  residence_card: "resident", resident_card: "resident", mid_long_term: "resident", living_in_japan: "resident", expat: "resident", 在留カード: "resident", 住民票: "resident", 中長期: "resident",
  japanese: "japanese_abroad", japanese_national: "japanese_abroad", 日本人: "japanese_abroad",
};

function pick<T extends string>(raw: string | null, allowed: readonly T[], aliases: Record<string, T>, name: string, fallback: T): T {
  if (!raw) return fallback;
  const k = raw.toLowerCase().replace(/[\s\-・]+/g, "_");
  const v = (aliases[k] ?? aliases[raw] ?? k) as T;
  if (!(allowed as readonly string[]).includes(v)) throw new InputError(`Invalid ${name} "${raw}". Allowed: ${allowed.join(", ")}`);
  return v;
}

export function computeCheck(input: Input) {
  try {
    const country = s(input.country ?? input.licenseCountry ?? input.issuingCountry);
    if (!country) throw new InputError("Missing country: the country (or region) that issued your driver's license, e.g. US, GB, CN, TW, DE.");
    const tripsRaw = input.trips;
    return checkDriving({
      country,
      usState: s(input.usState ?? input.state),
      document: pick(s(input.document ?? input.permit ?? input.doc), DOCUMENTS, DOC_ALIASES, "document", "auto"),
      residency: pick(s(input.residency ?? input.status ?? input.stay), RESIDENCIES, RES_ALIASES, "residency", "visitor"),
      entryDate: s(input.entryDate ?? input.landingDate ?? input.arrival),
      trips: Array.isArray(tripsRaw) && typeof tripsRaw[0] === "object" ? (tripsRaw as { left: string; returned: string }[]) : s(Array.isArray(tripsRaw) ? tripsRaw.join(",") : tripsRaw),
      idpIssueDate: s(input.idpIssueDate ?? input.idpIssued),
      licenseExpiry: s(input.licenseExpiry ?? input.licenseExpires),
      monthsInIssuingCountry: n(input.monthsInIssuingCountry ?? input.monthsInCountry, "monthsInIssuingCountry"),
      age: n(input.age, "age"),
      today: s(input.today ?? input.date),
    });
  } catch (e) {
    if (e instanceof RuleInputError) throw new InputError(e.message);
    throw e;
  }
}

export const ENDPOINTS: Record<"check", Endpoint> = {
  check: {
    path: "/api/check",
    operationId: "japanDrivingCheck",
    summary: "Can this person drive in Japan on their foreign license (Geneva IDP or Japanese translation), until which date, and can they convert it to a Japanese license (外免切替) with or without tests?",
    description:
      "Applies Road Traffic Act art. 107-2 / 97-2 as described by NPA and the Tokyo police (rules as of 2026-10-27, Geneva list as of May 2026): which document a license from this country needs (1949 Geneva IDP, or a Japanese translation for Switzerland, Germany, France, Belgium, Monaco and Taiwan, or none), the 1-year-from-landing period capped by the IDP's 1-year validity and the license expiry, the residents' 3-month rule for trips abroad, and 外免切替 eligibility (住民票 required since 2025-10-01, 3+ months in the issuing country, test exemptions incl. US states, 50-question knowledge check, Tokyo fees, reported pass rates). Returns verdict (can_drive | not_yet | expired | need_document | not_valid | unclear), headline, summary, howToDrive, period {countStart, lastDay, daysLeft, limits, restarts}, conversion {canApply, blockers, tests, documents, fees, notes}, steps, warnings, sources, rulesAsOf and disclaimer.",
    params: [
      { name: "country", type: "string", required: true, description: "Country/region that issued the driver's license: ISO code (US, GB, CN, TW, DE, HK…) or English/Japanese name." },
      { name: "usState", type: "string", description: "US licenses: issuing state code (WA, HI, OH… matter for conversion tests)." },
      { name: "document", type: "string", enum: DOCUMENTS, default: "auto", description: "What the driver holds: idp | translation | license_only | japanese_license | auto (tell me what's needed)." },
      { name: "residency", type: "string", enum: RESIDENCIES, default: "visitor", description: "visitor (tourist/short-term), resident (residence card, on 住民票), japanese_abroad." },
      { name: "entryDate", type: "string", description: "YYYY-MM-DD landing date in Japan (residents: the landing that started the count)." },
      { name: "trips", type: "string", description: "Residents: trips abroad since entryDate as left_returned pairs, comma separated, e.g. 2026-08-01_2026-09-10 (3-month rule)." },
      { name: "idpIssueDate", type: "string", description: "YYYY-MM-DD date the IDP was issued (valid 1 year)." },
      { name: "licenseExpiry", type: "string", description: "YYYY-MM-DD expiry of the home license." },
      { name: "monthsInIssuingCountry", type: "number", description: "Conversion: total months spent in the issuing country after getting the license (3+ needed)." },
      { name: "age", type: "number", description: "Driver's age (ordinary license from 18; apply from 17.5)." },
      { name: "today", type: "string", description: "YYYY-MM-DD date to check (default: today in Japan)." },
    ],
    example: EXAMPLE_GET,
    compute: computeCheck,
  },
};

export const PLUGIN = {
  name: "Japan Driving Check",
  nameForModel: "japan_driving_check",
  descriptionForHuman: "Can I drive in Japan on my license? IDP, translation, 1-year limit and 外免切替.",
  descriptionForModel:
    "Use when someone asks whether they can drive or rent a car in Japan on a foreign license or International Driving Permit (IDP), which document their country needs (1949 Geneva IDP vs JAF translation for Germany, Switzerland, France, Belgium, Monaco, Taiwan; no route for China, Vietnam, Brazil etc.), until which date they may drive (1 year from landing, IDP validity, 3-month rule for residents), or whether and how they can convert to a Japanese license (外免切替): 住民票 requirement since 2025-10-01, 3 months in the issuing country, test exemptions incl. US states, 50-question test, fees and pass rates. Rules as of 2026-10-27. Relay the disclaimer (educational, not legal advice; the police decide).",
  logo: "/icon.svg",
};
