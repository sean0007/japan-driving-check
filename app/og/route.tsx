import { ImageResponse } from "next/og";
import { EXAMPLE_SHARED, parseShared, safeCheck } from "@/lib/share";

export async function GET(req: Request) {
  const shared = parseShared(new URL(req.url).searchParams) ?? EXAMPLE_SHARED;
  const r = safeCheck(shared) ?? safeCheck(EXAMPLE_SHARED)!;
  const good = r.verdict === "can_drive" || r.verdict === "not_yet";
  const bad = r.verdict === "not_valid" || r.verdict === "expired";
  const route = { idp: "Geneva IDP", translation: "translation", none: "no route", unclear: "unclear", japan: "JP license" }[r.country.route];
  const stats = [
    { label: "license from", value: r.country.en },
    { label: "route", value: route },
    { label: "last driving day", value: r.period.lastDay ?? "1 yr from landing" },
  ];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#07080c", color: "#f3efe4", padding: "56px 64px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f0b429" }}>Japan Driving Check</div>
          <div style={{ display: "flex", fontSize: 22, color: "#9b9588" }}>rules as of {r.rulesAsOf}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 34, color: "#c9c3b6" }}>Can I drive in Japan on my license?</div>
          <div style={{ display: "flex", marginTop: 10, fontSize: 96, fontWeight: 800, letterSpacing: "-0.03em", color: bad ? "#fca5a5" : good ? "#99f6e4" : "#fde68a", lineHeight: 1.05 }}>{r.verdictLabel}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 30, color: "#f0b429", maxWidth: 1070 }}>{r.headline}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", flex: 1, border: "2px solid #23252c", borderRadius: 24, padding: "14px 20px", background: "#101218" }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: "#f3efe4" }}>{s.value}</span>
              <span style={{ fontSize: 20, color: "#9b9588" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#6f6a60" }}>
          <span>japan-driving-check.vercel.app · free, no login</span>
          <span>Educational, not legal advice. Not affiliated with NPA or JAF.</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable" } },
  );
}
