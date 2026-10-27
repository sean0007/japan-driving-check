"use client";

import { useState } from "react";
import { CardDisclaimer } from "@/components/card-disclaimer";
import { ShareBar } from "@/components/share-bar";
import { COUNTRIES, US_STATES } from "@/lib/countries";
import { DOCUMENTS, DOCUMENT_LABEL, RESIDENCIES, RESIDENCY_LABEL, type Document, type Residency } from "@/lib/driving";
import { EXAMPLE_SHARED, PUBLIC_URL, resultPath, safeCheck, type Shared } from "@/lib/share";

const field = "mt-2 w-full rounded-xl border border-line bg-black/40 px-3 py-2 text-sm text-foreground focus:border-amber";

const VERDICT_STYLE: Record<string, string> = {
  can_drive: "text-teal-200",
  not_yet: "text-teal-200",
  need_document: "text-amber-200",
  unclear: "text-amber-200",
  expired: "text-red-300",
  not_valid: "text-red-300",
};
const CONVERT_STYLE: Record<string, string> = { yes: "text-teal-200", check: "text-amber-200", no: "text-red-300" };
const COUNTRY_LIST = Object.values(COUNTRIES).sort((a, b) => a.en.localeCompare(b.en));
const D = /^\d{4}-\d{2}-\d{2}$/;

export function Calculator({ initial }: { initial?: Shared }) {
  const start = initial ?? EXAMPLE_SHARED;
  const [country, setCountry] = useState(start.country);
  const [usState, setUsState] = useState(start.usState ?? "");
  const [document, setDocument] = useState<Document>(start.document);
  const [residency, setResidency] = useState<Residency>(start.residency);
  const [entry, setEntry] = useState(start.entryDate ?? "");
  const [idp, setIdp] = useState(start.idpIssueDate ?? "");
  const [expiry, setExpiry] = useState(start.licenseExpiry ?? "");
  const [months, setMonths] = useState(start.monthsInIssuingCountry !== null ? String(start.monthsInIssuingCountry) : "");
  const [trips, setTrips] = useState(start.trips ?? "");

  const resident = residency !== "visitor";
  const shared: Shared = {
    country,
    usState: country === "US" && usState ? usState : null,
    document,
    residency,
    entryDate: D.test(entry) ? entry : null,
    idpIssueDate: document !== "translation" && D.test(idp) ? idp : null,
    licenseExpiry: D.test(expiry) ? expiry : null,
    monthsInIssuingCountry: resident && /^\d{1,4}$/.test(months.trim()) ? Number(months.trim()) : null,
    trips: resident && trips.trim() ? trips.trim().replace(/\s+/g, "") : null,
  };
  const r = safeCheck(shared);
  const shareUrl = `${PUBLIC_URL}${resultPath(shared)}`;
  const conv = r?.conversion;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
      <div className="rounded-3xl border border-line bg-panel/60 p-5 sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Your license and your stay</p>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Country that issued your driver&apos;s license</span>
          <select data-testid="country" className={field} value={country} onChange={(e) => setCountry(e.target.value)}>
            {COUNTRY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.en} · {c.ja}
              </option>
            ))}
          </select>
        </label>
        {country === "US" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-foreground">US state on the license</span>
            <select data-testid="state" className={field} value={usState} onChange={(e) => setUsState(e.target.value)}>
              <option value="">Not sure</option>
              {Object.entries(US_STATES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">What you have (or plan to bring)</span>
          <select data-testid="document" className={field} value={document} onChange={(e) => setDocument(e.target.value as Document)}>
            {DOCUMENTS.map((d) => (
              <option key={d} value={d}>
                {DOCUMENT_LABEL[d]}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Your stay in Japan</span>
          <select data-testid="residency" className={field} value={residency} onChange={(e) => setResidency(e.target.value as Residency)}>
            {RESIDENCIES.map((x) => (
              <option key={x} value={x}>
                {RESIDENCY_LABEL[x].en} · {RESIDENCY_LABEL[x].ja}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">{resident ? "Date you landed in Japan (start of your stay)" : "Date you land in Japan"}</span>
          <input data-testid="entry" type="date" className={field} value={entry} onChange={(e) => setEntry(e.target.value)} />
        </label>
        {document !== "translation" ? (
          <label className="mt-4 block">
            <span className="text-sm font-medium text-foreground">IDP issue date (optional)</span>
            <input data-testid="idp" type="date" className={field} value={idp} onChange={(e) => setIdp(e.target.value)} />
            <span className="mt-1 block text-xs text-muted">A Geneva IDP is valid for 1 year from issue.</span>
          </label>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium text-foreground">Home license expiry (optional)</span>
          <input data-testid="expiry" type="date" className={field} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </label>
        {resident ? (
          <>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Trips abroad since then (optional)</span>
              <input data-testid="trips" placeholder="e.g. 2026-08-01_2026-09-10, 2026-12-20_2027-01-05" className={field} value={trips} onChange={(e) => setTrips(e.target.value)} />
              <span className="mt-1 block text-xs text-muted">Departure_return pairs. Under 3 months away doesn&apos;t restart the 1 year.</span>
            </label>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-foreground">Months you lived in that country after getting the license</span>
              <input data-testid="months" inputMode="numeric" placeholder="e.g. 24" className={field} value={months} onChange={(e) => setMonths(e.target.value)} />
              <span className="mt-1 block text-xs text-muted">3+ months in total is needed to convert (passport stamps prove it).</span>
            </label>
          </>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-panel/60">
        <div className="p-5 sm:p-7" data-testid="result">
          {r ? (
            <>
              <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
                {r.country.en} · {r.country.ja} · {RESIDENCY_LABEL[r.residency].ja}
              </p>
              <p className={`mt-2 font-display text-4xl tracking-tight sm:text-5xl ${VERDICT_STYLE[r.verdict]}`}>{r.verdictLabel}</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{r.headline}</p>
              <p className="mt-3 text-base text-foreground">{r.summary}</p>
              <div className="mt-4 rounded-2xl border border-line bg-black/20 p-4 text-sm text-muted">
                <p>
                  <span className="font-semibold text-foreground">How a {r.country.en} license drives in Japan:</span> {r.howToDrive}
                </p>
                {r.period.limits.length ? (
                  <ul className="mt-2 space-y-1">
                    {r.period.limits.map((l) => (
                      <li key={l.reason}>
                        {l.reason}: <span className="text-foreground">{l.lastDay}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {r.period.restarts.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {r.period.restarts.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {conv && conv.canApply !== "not_needed" ? (
                <div className="mt-4 rounded-2xl border border-line bg-black/20 p-4 text-sm text-muted">
                  <p className="font-semibold text-foreground">
                    Convert to a Japanese license (外免切替):{" "}
                    <span className={CONVERT_STYLE[conv.canApply]}>{conv.canApply === "yes" ? "you can apply" : conv.canApply === "no" ? "not yet / not possible" : "likely, check the 3-month stay"}</span>
                  </p>
                  <p className="mt-1">{conv.testsLabel}</p>
                  {conv.blockers.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-red-100">
                      {conv.blockers.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  ) : null}
                  {conv.fees ? <p className="mt-2">Fees (Tokyo, ordinary car): ¥{conv.fees.application.toLocaleString()} application + ¥{conv.fees.issuance.toLocaleString()} issuance = ¥{conv.fees.total.toLocaleString()}, translation extra.</p> : null}
                </div>
              ) : null}
              {[
                ["What to do", r.steps],
                ["Documents to convert", conv?.documents ?? []],
                ["Good to know", [...(conv?.notes ?? []), ...r.warnings]],
              ].map(([title, items]) =>
                (items as string[]).length ? (
                  <div key={title as string}>
                    <h3 className="mt-6 text-sm font-semibold text-foreground">{title as string}</h3>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                      {(items as string[]).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null,
              )}
              <div className="mt-6">
                <ShareBar url={shareUrl} text={`Can I drive in Japan on a ${r.country.en} license? → ${r.verdictLabel}`} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Check the dates: use YYYY-MM-DD, and trips as departure_return pairs separated by commas.</p>
          )}
        </div>
        <CardDisclaimer />
      </div>
    </div>
  );
}
