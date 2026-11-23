import { ImageResponse } from "next/og";

export const alt = "Breach: see the whales before the market does";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAIL =
  "M28.6 50 C29 45 29.4 41.5 29.6 38.6 C23.5 38.2 15.6 34.8 10.5 24.2 C10.2 23.4 10.9 22.8 11.6 23.3 C17.8 27.4 25 28.8 30.4 30.2 C31.1 30.4 31.6 31 32 31.8 C32.4 31 32.9 30.4 33.6 30.2 C39 28.8 46.2 27.4 52.4 23.3 C53.1 22.8 53.8 23.4 53.5 24.2 C48.4 34.8 40.5 38.2 34.4 38.6 C34.6 41.5 35 45 35.4 50 Z";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#03203d", padding: 72, color: "#eef3f8" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="15" fill="#105BFF" />
            <path transform="translate(0 -4.4)" d={TAIL} fill="#EDEBE6" />
          </svg>
          <div style={{ fontSize: 44, letterSpacing: 6, fontWeight: 600 }}>BREACH</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 82, lineHeight: 1.02, fontWeight: 300, maxWidth: 980 }}>See the whales before the market does.</div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#a3bdd4" }}>Live $10K+ Polymarket bets, ranked traders, and what the top wallets hold.</div>
        </div>
        <div style={{ display: "flex", height: 8, width: 220, background: "#639cc5", borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}
