import { DOCUMENTS, RESIDENCIES, checkDriving, type CheckInput, type Document, type Residency } from "./driving";
import { resolveCountry } from "./countries";

export const PUBLIC_URL = "https://japan-driving-check.vercel.app";

/** Share links: /r?c=US[&st=CA][&d=idp][&s=resident][&e=2026-11-01][&i=2026-06-15][&x=2028-01-01][&m=24][&t=2026-08-01_2026-09-10] */
type Params = URLSearchParams | Record<string, string | string[] | undefined>;
function one(p: Params, key: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
}
const D = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: string | undefined) => (v && D.test(v) ? v : null);

export type Shared = {
  country: string;
  usState: string | null;
  document: Document;
  residency: Residency;
  entryDate: string | null;
  idpIssueDate: string | null;
  licenseExpiry: string | null;
  monthsInIssuingCountry: number | null;
  trips: string | null;
};

const BASE = { usState: null, document: "auto" as Document, residency: "visitor" as Residency, entryDate: null, idpIssueDate: null, licenseExpiry: null, monthsInIssuingCountry: null, trips: null };
export const EXAMPLE_SHARED: Shared = { ...BASE, country: "US", usState: "CA", document: "idp", entryDate: "2026-11-01", idpIssueDate: "2026-06-15" };
export const EXAMPLE_RESIDENT: Shared = { ...BASE, country: "CN", document: "license_only", residency: "resident", monthsInIssuingCountry: 36 };
export const EXAMPLES: Shared[] = [EXAMPLE_SHARED, EXAMPLE_RESIDENT];

export function parseShared(p: Params): Shared | null {
  const c = one(p, "c");
  if (!c || !/^[A-Za-z]{2}$/.test(c) || !resolveCountry(c)) return null;
  const d = one(p, "d") ?? "auto";
  const s = one(p, "s") ?? "visitor";
  const st = one(p, "st");
  const m = one(p, "m");
  const t = one(p, "t");
  return {
    country: c.toUpperCase(),
    usState: c.toUpperCase() === "US" && st && /^[A-Za-z]{2}$/.test(st) ? st.toUpperCase() : null,
    document: ((DOCUMENTS as readonly string[]).includes(d) ? d : "auto") as Document,
    residency: ((RESIDENCIES as readonly string[]).includes(s) ? s : "visitor") as Residency,
    entryDate: date(one(p, "e")),
    idpIssueDate: date(one(p, "i")),
    licenseExpiry: date(one(p, "x")),
    monthsInIssuingCountry: m && /^\d{1,4}$/.test(m) ? Number(m) : null,
    trips: t && /^[\d_,-]{21,400}$/.test(t) ? t : null,
  };
}

export function sharedQuery(s: Shared): string {
  const q = new URLSearchParams();
  q.set("c", s.country);
  if (s.usState) q.set("st", s.usState);
  if (s.document !== "auto") q.set("d", s.document);
  if (s.residency !== "visitor") q.set("s", s.residency);
  if (s.entryDate) q.set("e", s.entryDate);
  if (s.idpIssueDate) q.set("i", s.idpIssueDate);
  if (s.licenseExpiry) q.set("x", s.licenseExpiry);
  if (s.monthsInIssuingCountry !== null) q.set("m", String(s.monthsInIssuingCountry));
  if (s.trips) q.set("t", s.trips);
  return q.toString().replace(/%2C/g, ",");
}

export function toCheckInput(s: Shared, today?: string): CheckInput {
  return { ...s, today: today ?? null };
}
export function safeCheck(s: Shared, today?: string) {
  try {
    return checkDriving(toCheckInput(s, today));
  } catch {
    return null;
  }
}
export function resultPath(s: Shared): string {
  return `/r?${sharedQuery(s)}`;
}
export function ogPath(s: Shared): string {
  return `/og?${sharedQuery(s)}`;
}
export function isIndexable(s: Shared): boolean {
  return EXAMPLES.some((e) => resultPath(e) === resultPath(s));
}
