import { ImageResponse } from "next/og";

/** Monti mark on deep teal, rendered to PNG for home-screen icons (iOS ignores SVG icons). */
export function appIcon(px: number) {
  const pad = Math.round(px * 0.16);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B4F4A" }}>
        <svg width={px - pad * 2} height={px - pad * 2} viewBox="0 0 64 64">
          <path d="M6 50 L22 20 L32 34 L42 12 L58 50" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M42 12 V2" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <path d="M42 2 L52 5.5 L42 9 Z" fill="#3EE6A8" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}
