import type { Metadata } from "next";
import { RULES_AS_OF, SOURCES } from "@/lib/driving";
import { DISCLAIMER_SHORT, HONESTY } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer", description: DISCLAIMER_SHORT };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <p className="font-mono text-[11px] tracking-[0.28em] text-amber uppercase">Read this</p>
      <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">Disclaimer</h1>
      <p className="mt-4 text-lg text-foreground">{DISCLAIMER_SHORT}</p>
      <p className="mt-2 text-muted">{HONESTY}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="text-base font-semibold text-foreground">What this is</h2>
          <p className="mt-2">
            A free educational checker. It applies a dated reading (as of {RULES_AS_OF}) of the Road Traffic Act rules on driving in Japan with a foreign license (art. 107-2: 1949 Geneva Convention international driving permits, the Japanese-translation route for Switzerland, Germany, France, Belgium, Monaco and Taiwan, the 1-year period and the 3-month rule) and on converting a foreign license (外国免許切替, art. 97-2), as published by the National Police Agency, the Tokyo Metropolitan Police (Keishicho) and JAF, including the Geneva Convention list compiled by NPA (May 2026) and the conversion changes of 2025-10-01.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">What it is not</h2>
          <p className="mt-2">
            It is not legal advice and is not affiliated with the National Police Agency, any prefectural police, any driver&apos;s license center, JAF or any rental car company. It can&apos;t inspect your IDP, translation or license, tell whether your IDP is in the Geneva format, or know how an officer or a rental counter will judge your documents. Lists change as countries answer NPA&apos;s inquiries, and prefectures run conversion slightly differently (fees, booking, test days). Driving without a valid license (無免許運転) is a crime in Japan, can void your insurance and, for foreign residents, can affect your status of residence. Confirm with the license center for your address, the police or your rental company before you drive or apply.
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {SOURCES.map((s) => (
              <li key={s}>
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold text-foreground">Your data</h2>
          <p className="mt-2">The choices you make stay in your browser (or in a share link you create). No login, no names, no database.</p>
        </section>
      </div>
    </div>
  );
}
