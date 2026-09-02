import { ImageResponse } from "next/og";
export const runtime = "edge";
export const alt = "Rayid Ali · AI engineer, New York City";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "radial-gradient(ellipse at 62% 38%, #132066 0%, #0a1440 38%, #070c22 82%)", color: "#efe8d6", padding: 56, fontFamily: "monospace" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#9fb4ff", letterSpacing: 4 }}>
          <span>RAYID.EXE  v2026</span><span>rayidali.com</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 1, letterSpacing: -4, textShadow: "0 0 30px rgba(47,92,255,.6)" }}>RAYID ALI</div>
          <div style={{ fontSize: 40, marginTop: 18, color: "#f4d35e" }}>&gt; ai engineer. new york city.</div>
          <div style={{ fontSize: 30, marginTop: 10, color: "#9fb4ff" }}>builds things with AI. ships them. _</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#0b0b0f" }}>
          {["CINECHRONY.EXE", "IEDIT.EXE", "PDF2VIDEO.EXE"].map((t) => (
            <div key={t} style={{ background: "#e6e2d6", border: "3px solid #000", padding: "8px 16px", boxShadow: "6px 6px 0 #000" }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
