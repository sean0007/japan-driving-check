export const SITE_NAME = "Japan Driving Check";

export const SITE_TAGLINE =
  "Can I drive in Japan on my license? Check whether your country needs a Geneva IDP or a Japanese translation (or can't drive at all), your exact last driving day under the 1-year and 3-month rules, and whether you can convert to a Japanese license (外免切替) after the 2025-10-01 changes.";

export const DISCLAIMER_SHORT = "Educational guide, not legal advice, not affiliated with the National Police Agency, prefectural police or JAF. Driving without a valid license is a crime in Japan; confirm with the police or your rental company before you drive.";

export const HONESTY =
  "Rules as of 2026-10-27 from NPA and Tokyo police (Keishicho) pages: the Geneva Convention list (NPA data, May 2026), the translation route, the 3-month rule, and the 外免切替 rules changed on 2025-10-01. It can't inspect your IDP or license.";

export const SIBLING_TOOLS = [
  { href: "https://japan-trip-brain.vercel.app", label: "Japan Trip Brain" },
  { href: "https://japan-reentry-check.vercel.app", label: "Japan Re-entry Deadline Check" },
  { href: "https://japan-customs-allowance.vercel.app", label: "Japan Customs Allowance" },
  { href: "https://japan-parttime-check.vercel.app", label: "Japan Part-time Work Check" },
  { href: "https://japan-alert-decoder.vercel.app", label: "Japan Alert Decoder" },
  { href: "https://free-agent-tools.vercel.app", label: "Free Agent Tools MCP" },
] as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
  return "https://japan-driving-check.vercel.app";
}
