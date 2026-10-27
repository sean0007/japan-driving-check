import assert from "node:assert/strict";
import test from "node:test";
import { COUNTRIES, GENEVA_IDP_COUNTRIES, NON_ISSUING_PARTIES, UNCLEAR_PARTIES, resolveCountry } from "./countries";
import { RULES, RuleInputError, checkDriving, periodLastDay } from "./driving";

const T = "2026-10-27";

test("country lists match the NPA/Keishicho May 2026 tables", () => {
  assert.equal(NON_ISSUING_PARTIES.length, 12);
  assert.equal(UNCLEAR_PARTIES.length, 14);
  for (const c of ["US", "GB", "AU", "KR", "HK", "TH", "IN", "PH", "AE", "BD"]) assert.ok(GENEVA_IDP_COUNTRIES.includes(c), c);
  for (const c of ["FR", "BE", "MC", "DE", "CH", "TW"]) assert.equal(COUNTRIES[c].route, "translation", c);
  for (const c of ["CN", "VN", "BR", "RU", "MX"]) assert.equal(COUNTRIES[c].route, "none", c);
  assert.equal(resolveCountry("usa")?.code, "US");
  assert.equal(resolveCountry("中国")?.code, "CN");
  assert.equal(resolveCountry("ドイツ")?.code, "DE");
  assert.equal(resolveCountry("Côte d'Ivoire")?.code, "CI");
  assert.equal(resolveCountry("ZZ")?.route, "none");
});

test("periodLastDay: 1 year counts the landing day; Feb 29 → Feb 28", () => {
  assert.equal(new Date(periodLastDay(Date.UTC(2026, 10, 1), 12)).toISOString().slice(0, 10), "2027-10-31");
  assert.equal(new Date(periodLastDay(Date.UTC(2028, 1, 29), 12)).toISOString().slice(0, 10), "2029-02-28");
});

test("US tourist with Geneva IDP: IDP validity limits the period", () => {
  const r = checkDriving({ country: "US", usState: "CA", document: "idp", entryDate: "2026-10-20", idpIssueDate: "2026-03-01", today: T });
  assert.equal(r.verdict, "can_drive");
  assert.equal(r.period.lastDay, "2027-02-28");
  assert.equal(r.period.limits.length, 2);
  assert.ok(r.headline.includes("2027-02-28"));
  assert.equal(r.conversion.canApply, "no");
  assert.ok(r.conversion.blockers[0].includes("住民票"));
  assert.equal(r.conversion.tests, "both");
});

test("Germany: translation route; IDP not valid", () => {
  assert.equal(checkDriving({ country: "DE", document: "translation", entryDate: "2026-10-01", today: T }).verdict, "can_drive");
  const idp = checkDriving({ country: "DE", document: "idp", today: T });
  assert.equal(idp.verdict, "not_valid");
  assert.ok(idp.steps.some((s) => s.includes("ADAC")));
  assert.equal(checkDriving({ country: "FR", document: "idp", today: T }).verdict, "not_valid");
});

test("China / Vietnam: no route; residents can convert with tests", () => {
  const r = checkDriving({ country: "CN", document: "license_only", residency: "resident", monthsInIssuingCountry: 24, today: T });
  assert.equal(r.verdict, "not_valid");
  assert.equal(r.conversion.canApply, "yes");
  assert.equal(r.conversion.tests, "both");
  assert.equal(r.conversion.fees?.total, 4850);
  assert.equal(checkDriving({ country: "VN", document: "idp", today: T }).verdict, "not_valid");
});

test("auto document: tells what is needed, computes dates when landing known", () => {
  const a = checkDriving({ country: "GB", today: T });
  assert.equal(a.verdict, "need_document");
  const b = checkDriving({ country: "GB", entryDate: "2026-11-10", today: T });
  assert.equal(b.verdict, "not_yet");
  assert.equal(b.period.lastDay, "2027-11-09");
  assert.ok(b.headline.startsWith("With a Geneva IDP"));
});

test("resident 3-month rule: short trip doesn't restart, long trip does", () => {
  const short = checkDriving({ country: "AU", document: "idp", residency: "resident", entryDate: "2025-11-01", trips: "2026-08-01_2026-10-20", today: T });
  assert.equal(short.period.countStart, "2025-11-01");
  assert.equal(short.period.lastDay, "2026-10-31");
  assert.equal(short.verdict, "can_drive");
  assert.equal(short.period.daysLeft, 5);
  const long = checkDriving({ country: "AU", document: "idp", residency: "resident", entryDate: "2025-11-01", trips: "2026-06-01_2026-09-01", today: T });
  assert.equal(long.period.countStart, "2026-09-01");
  assert.equal(long.period.lastDay, "2027-08-31");
  const exactly3 = checkDriving({ country: "AU", document: "idp", residency: "resident", entryDate: "2025-11-01", trips: [{ left: "2026-05-15", returned: "2026-08-15" }], today: T });
  assert.equal(exactly3.period.countStart, "2026-08-15");
});

test("expired period and expired license", () => {
  const r = checkDriving({ country: "CA", document: "idp", residency: "resident", entryDate: "2025-09-01", today: T, monthsInIssuingCountry: 120 });
  assert.equal(r.verdict, "expired");
  assert.equal(r.conversion.tests, "exempt_both");
  const lic = checkDriving({ country: "KR", document: "idp", entryDate: "2026-10-01", licenseExpiry: "2026-10-15", today: T });
  assert.equal(lic.verdict, "expired");
});

test("US state exemptions", () => {
  const ok = (s: string) => checkDriving({ country: "US", usState: s, residency: "resident", today: T }).conversion.tests;
  assert.equal(ok("WA"), "exempt_both");
  assert.equal(ok("Hawaii"), "exempt_both");
  assert.equal(ok("IN"), "exempt_skill");
  assert.equal(ok("NY"), "both");
  assert.equal(checkDriving({ country: "US", residency: "resident", today: T }).conversion.tests, "depends_on_state");
});

test("conversion blockers: <3 months, too young, expired license", () => {
  const r = checkDriving({ country: "TW", residency: "resident", monthsInIssuingCountry: 1, age: 17, licenseExpiry: "2026-01-01", today: T });
  assert.equal(r.conversion.canApply, "no");
  assert.equal(r.conversion.blockers.length, 3);
});

test("unclear and non-issuing parties", () => {
  assert.equal(checkDriving({ country: "NG", document: "idp", today: T }).verdict, "unclear");
  assert.equal(checkDriving({ country: "RU", document: "idp", today: T }).verdict, "not_valid");
  assert.equal(checkDriving({ country: "AE", document: "idp", today: T, entryDate: "2026-10-26" }).warnings.some((w) => w.includes("two kinds")), true);
});

test("japanese license and bad input", () => {
  assert.equal(checkDriving({ country: "JP", today: T }).verdict, "can_drive");
  assert.equal(checkDriving({ country: "JP", today: T }).conversion.canApply, "not_needed");
  assert.throws(() => checkDriving({ country: "Atlantis" }), RuleInputError);
  assert.throws(() => checkDriving({ country: "US", entryDate: "2026-02-30" }), RuleInputError);
  assert.throws(() => checkDriving({ country: "AU", residency: "resident", entryDate: "2026-01-01", trips: "bad" }), RuleInputError);
  assert.throws(() => checkDriving({ country: "US", usState: "Narnia" }), RuleInputError);
});

test("RULES exposes lists and sources", () => {
  assert.ok(RULES.shortTerm.genevaIdpCountries.length > 70);
  assert.equal(RULES.shortTerm.translationCountries.length, 6);
  assert.equal(RULES.conversion.exemptBoth.length, 29);
  assert.ok(RULES.sources.length >= 5);
});
