import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { FaqSection, type FaqItem } from "@/components/faq-section";
import { SOURCES } from "@/lib/driving";
import { EXAMPLE_RESIDENT, EXAMPLE_SHARED, PUBLIC_URL, resultPath } from "@/lib/share";

export const revalidate = 3600;

const title = "Can I drive in Japan on my license? IDP, translation & 外免切替 checker 2026";
const description =
  "Free checker for driving in Japan on a foreign license: does your country need a 1949 Geneva IDP or a Japanese translation (Germany, Switzerland, France, Belgium, Monaco, Taiwan), or can't you drive at all (China, Vietnam, Brazil…)? Get your exact last driving day under the 1-year and 3-month rules, and see if you can convert to a Japanese license after the 2025-10-01 changes. Free JSON API for AI agents. Educational, not legal advice.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

const webAppLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Japan Driving Check",
  alternateName: ["国際免許 日本 運転 チェック", "外免切替 判定", "Can I drive in Japan with an international driving permit", "Japan IDP checker"],
  url: PUBLIC_URL,
  applicationCategory: "TravelApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
  inLanguage: ["en", "ja"],
  description: "Unofficial, free checker for driving in Japan on a foreign license: Geneva IDP vs translation vs no route by country (NPA list, May 2026), the 1-year period, IDP validity and the 3-month rule, and 外免切替 conversion eligibility, tests, documents and fees, with a keyless JSON API. Not affiliated with the National Police Agency or JAF.",
};

const faq: FaqItem[] = [
  {
    q: "Can I drive in Japan with an International Driving Permit?",
    a: "Only with a 1949 Geneva Convention IDP issued by a country that issues that format (for example the US, UK, Canada, Australia, Korea, India, Thailand, the Philippines, Hong Kong). Japan does not accept Vienna-format (1968) IDPs or online 'international license' booklets. Carry the IDP together with your home license and passport.",
  },
  {
    q: "My country doesn't issue Geneva IDPs. What then?",
    a: "Licenses from Switzerland, Germany, France, Belgium, Monaco and Taiwan are valid with an official Japanese translation from the issuing authority or embassy, JAF, the Japan Visitor Driving Support Association (訪日運転者支援協会), ADAC for Germany, or the Taiwan–Japan Relations Association / ZIPLUS for Taiwan. Licenses from China, Vietnam, Brazil, Indonesia, Nepal, Mexico and other places not on NPA's list can't be used: you need a Japanese license.",
  },
  {
    q: "How long can I drive in Japan on an IDP?",
    a: "Up to 1 year counted from the day you land, but never past the IDP's own validity (1 year from issue) or your home license's expiry. Tourists start a new period with each landing. People on the resident register who leave and return within less than 3 months don't restart the count; 3 months or more away restarts it.",
  },
  {
    q: "What is the 3-month rule?",
    a: "Road Traffic Act art. 107-2: if you are recorded in Japan's Basic Resident Register (a mid- to long-term resident) and you leave with a re-entry permit and come back in less than 3 months, that return is not a new 'landing' for driving purposes, so your 1 year keeps counting from the original date. It stops residents from extending an IDP forever with short trips home.",
  },
  {
    q: "What changed for converting a foreign license (外免切替) on October 1, 2025?",
    a: "Applicants now need a 住民票 (resident record) copy issued within 6 months, so tourists and short-term visitors can no longer convert. The knowledge check became 50 written questions with 45 needed to pass (no more illustrated questions), and the driving check got stricter. Reported pass rates for Oct–Dec 2025 fell to 42.8% (knowledge) and 13.1% (driving).",
  },
  {
    q: "Which countries skip the tests when converting?",
    a: "Paperwork and an eye test only for licenses from Iceland, Ireland, the UK, Italy, Australia, Austria, the Netherlands, Canada, Korea, Greece, Switzerland, Sweden, Spain, Slovenia, Czechia, Denmark, Germany, New Zealand, Norway, Hungary, Finland, France, Belgium, Poland, Portugal, Monaco, Luxembourg, Taiwan and the US states of Ohio, Oregon, Colorado, Virginia, Hawaii, Maryland and Washington. Indiana skips the driving check only. Everyone else takes both checks.",
  },
  {
    q: "What do I need to convert my license?",
    a: "A valid foreign license (expired ones can't be converted), proof you spent 3+ months in the issuing country after getting it (passport stamps), a Japanese translation, your 住民票, passport, residence card, a 3.0×2.4 cm photo and the fee (Tokyo ordinary: ¥2,500 + ¥2,350). Apply in person at the license center for your address; Tokyo requires an online booking.",
  },
  {
    q: "Can I rent a car in Japan with my US license?",
    a: "Not with the US license alone. Get a Geneva IDP from AAA (or AATA) before you fly; it is valid for 1 year from issue and you can't get one in Japan. Bring the IDP, your US license and your passport to the rental counter.",
  },
  {
    q: "Is there a free API for AI agents?",
    a: `Yes. GET or POST ${PUBLIC_URL}/api/check?country=US&usState=CA&document=idp&entryDate=2026-11-01&idpIssueDate=2026-06-15 (keyless, CORS open), rules at /api/rules, OpenAPI at /openapi.json, llms.txt, and the MCP tool japan_driving_check on free-agent-tools.vercel.app/mcp. Every response carries rulesAsOf, sources and a disclaimer.`,
  },
  {
    q: "国際運転免許証で日本で運転できるのはいつまでですか？",
    a: "日本に上陸した日から1年間、または国際運転免許証の有効期間（発給から1年）のいずれか短い期間です。住民基本台帳に記録されている方が出国し、3か月未満で再入国した場合は、その帰国日から数え直しにはなりません（3か月ルール）。ジュネーブ条約様式の国際免許証のみ有効です。",
  },
  {
    q: "外免切替は観光客でもできますか？",
    a: "2025年10月1日から、申請には住民票の写し（国籍等の記載があるもの、6か月以内）が必要になり、短期滞在の方は原則として申請できません。知識確認は50問中45問以上の正解が必要になり、技能確認も厳格化されました。",
  },
];

const ROWS: [string, string, string][] = [
  ["US, UK, Canada, Australia, NZ, Korea, India, Thailand, Philippines, Malaysia, Singapore, Hong Kong, most of the EU…", "1949 Geneva IDP + home license", "1 year from landing, ≤ IDP validity"],
  ["Germany, Switzerland, France, Belgium, Monaco, Taiwan", "Home license + Japanese translation (JAF etc.)", "1 year from landing"],
  ["Russia, Bulgaria, Serbia, Albania, Ghana, Cuba… (no Geneva-format IDP)", "No route", "Japanese license only"],
  ["China, Vietnam, Brazil, Indonesia, Nepal, Mexico, Ukraine… (not on the list)", "No route", "Japanese license only"],
  ["Nigeria, Morocco, Jamaica, Venezuela, Uganda… (NPA inquiry open)", "Unclear", "Ask the police first"],
];

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Free · Japan · 国際免許 · 外免切替 · rules as of 2026-10-27</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Can I drive in Japan on my license?</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground sm:text-lg">
          It depends on the country that issued your license: some need a 1949 Geneva IDP, six need a Japanese translation, and many (China, Vietnam, Brazil…) can&apos;t drive at all. Either way the limit is 1 year from landing, and residents must then convert, which got much harder on 2025-10-01. Pick your country to see your route, your last driving day and your conversion path.
        </p>
        <p className="mt-3 text-sm text-muted">
          Examples:{" "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_SHARED)}>
            California tourist with an IDP
          </a>
          {" · "}
          <a className="underline underline-offset-2 hover:text-foreground" href={resultPath(EXAMPLE_RESIDENT)}>
            Chinese license, living in Japan
          </a>
        </p>
      </section>

      <section className="mt-8">
        <Calculator />
      </section>

      <section className="mt-16 max-w-5xl">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Which license works in Japan</h2>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel/80 text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">License from</th>
                <th className="px-4 py-3 font-medium">What you need to drive</th>
                <th className="px-4 py-3 font-medium">How long</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {ROWS.map(([a, b, c]) => (
                <tr key={a} className="border-t border-line">
                  <td className="px-4 py-3 text-foreground">{a}</td>
                  <td className="px-4 py-3">{b}</td>
                  <td className="px-4 py-3">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">
          Country list: NPA data as of May 2026 (Keishicho page updated 2026-07-02). UAE and Bangladesh issue two kinds of IDP and only the Geneva-format one works. NPA notes other places may also be covered, so check with the police if yours isn&apos;t listed.
        </p>
        <p className="mt-4 text-sm text-muted">
          Official pages:{" "}
          {SOURCES.slice(0, 5).map((s, i) => (
            <span key={s}>
              {i ? " · " : ""}
              <a className="underline underline-offset-2 hover:text-foreground" href={s} target="_blank" rel="noopener noreferrer">
                {s.replace("https://www.", "").slice(0, 60)}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="mt-12 max-w-3xl rounded-3xl border border-line bg-panel/40 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-foreground">For AI agents and developers</h2>
        <p className="mt-2 text-sm text-muted">
          Keyless JSON, CORS open, GET or POST:{" "}
          <a className="font-mono text-foreground underline underline-offset-2 break-all" href="/api/check?country=US&usState=CA&document=idp&entryDate=2026-11-01&idpIssueDate=2026-06-15">
            /api/check?country=US&amp;usState=CA&amp;document=idp&amp;entryDate=2026-11-01&amp;idpIssueDate=2026-06-15
          </a>
          . Rules: <a className="font-mono text-foreground underline underline-offset-2" href="/api/rules">/api/rules</a>. Docs: <a className="underline underline-offset-2" href="/openapi.json">OpenAPI</a>,{" "}
          <a className="underline underline-offset-2" href="/llms.txt">llms.txt</a>, MCP tool <span className="font-mono text-foreground">japan_driving_check</span> on{" "}
          <a className="underline underline-offset-2" href="https://free-agent-tools.vercel.app" target="_blank" rel="noopener noreferrer">
            free-agent-tools
          </a>
          .
        </p>
      </section>

      <FaqSection items={faq} heading="Driving in Japan: questions" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
