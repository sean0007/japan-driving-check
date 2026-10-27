import assert from "node:assert/strict";
import test from "node:test";
import { EXAMPLES, EXAMPLE_SHARED, isIndexable, parseShared, resultPath, safeCheck, sharedQuery } from "./share";

test("share link round-trips", () => {
  for (const ex of EXAMPLES) {
    assert.deepEqual(parseShared(new URLSearchParams(sharedQuery(ex))), ex);
    assert.ok(isIndexable(ex));
    assert.ok(safeCheck(ex, "2026-10-27"));
  }
  assert.equal(resultPath(EXAMPLE_SHARED), "/r?c=US&st=CA&d=idp&e=2026-11-01&i=2026-06-15");
  const t = { ...EXAMPLE_SHARED, country: "AU", usState: null, residency: "resident" as const, trips: "2026-08-01_2026-09-10,2026-12-20_2027-01-05" };
  assert.ok(sharedQuery(t).includes("t=2026-08-01_2026-09-10,2026-12-20_2027-01-05"));
  assert.deepEqual(parseShared(new URLSearchParams(sharedQuery(t))), t);
});

test("example results", () => {
  const a = safeCheck(EXAMPLE_SHARED, "2026-10-27")!;
  assert.equal(a.verdict, "not_yet");
  assert.equal(a.period.lastDay, "2027-06-14");
  const b = safeCheck(EXAMPLES[1], "2026-10-27")!;
  assert.equal(b.verdict, "not_valid");
  assert.equal(b.conversion.canApply, "yes");
});

test("bad share params → null", () => {
  assert.equal(parseShared(new URLSearchParams("c=Atlantis")), null);
  assert.equal(parseShared(new URLSearchParams("d=idp")), null);
  assert.equal(parseShared(new URLSearchParams("c=US&e=tomorrow"))?.entryDate, null);
});
