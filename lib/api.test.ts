import assert from "node:assert/strict";
import test from "node:test";
import { apiHandler, openapiDoc } from "./agent-api";
import { API_DISCLAIMER, API_INFO, ENDPOINTS, EXAMPLE_GET, PUBLIC_URL } from "./api";

const e = ENDPOINTS.check;
const handler = apiHandler(e.compute, { disclaimer: API_DISCLAIMER, docs: `${PUBLIC_URL}/openapi.json`, example: `${PUBLIC_URL}${e.example}` });

test(`GET ${EXAMPLE_GET} → last day capped by IDP validity`, async () => {
  const res = await handler(new Request(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-27`));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  const body = await res.json();
  assert.equal(body.disclaimer, API_DISCLAIMER);
  assert.equal(body.verdict, "not_yet");
  assert.equal(body.period.lastDay, "2027-06-14");
  assert.ok(body.sources.length);
});

test("POST JSON body matches GET", async () => {
  const url = new URL(`${PUBLIC_URL}${EXAMPLE_GET}&today=2026-10-27`);
  const post = await handler(new Request(`${PUBLIC_URL}${e.path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(url.searchParams)) }));
  const get = await handler(new Request(url));
  assert.equal(post.status, 200);
  assert.deepEqual(await post.json(), await get.json());
});

test("POST trips as objects + aliases", async () => {
  const res = await handler(
    new Request(`${PUBLIC_URL}${e.path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: "オーストラリア", document: "国際免許", status: "在留カード", entryDate: "2025-11-01", trips: [{ left: "2026-06-01", returned: "2026-09-01" }], monthsInCountry: "24か月", today: "2026-10-27" }),
    }),
  );
  const b = await res.json();
  assert.equal(res.status, 200);
  assert.equal(b.country.code, "AU");
  assert.equal(b.residency, "resident");
  assert.equal(b.period.countStart, "2026-09-01");
  assert.equal(b.conversion.tests, "exempt_both");
});

test("errors → 400 with disclaimer", async () => {
  for (const q of ["", "?country=Atlantis", "?country=US&document=magic", "?country=US&entryDate=2026-13-01"]) {
    const res = await handler(new Request(`${PUBLIC_URL}${e.path}${q}`));
    assert.equal(res.status, 400, q);
    assert.equal((await res.json()).disclaimer, API_DISCLAIMER);
  }
});

test("openapi lists the check endpoint", () => {
  const doc = openapiDoc(API_INFO, PUBLIC_URL, Object.values(ENDPOINTS)) as { paths: Record<string, unknown> };
  assert.ok(doc.paths["/api/check"]);
});
