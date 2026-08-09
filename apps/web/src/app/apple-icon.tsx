import { ImageResponse } from "next/og";

/*
 * The same orbit as `icon.tsx`, drawn for the 180px home-screen tile. iOS masks
 * the corners and never shows a transparent ground, so this one keeps the paper
 * background and gains the second influence node that is too small to survive
 * in a browser tab.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const PAPER = "#f3f0e8";
const INK = "#161713";
const ACCENT = "#ff4f24";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: PAPER,
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: rendered to a PNG, never to the DOM */}
      <svg fill="none" height="180" viewBox="0 0 180 180" width="180">
        <circle
          cx="90"
          cy="90"
          r="62"
          stroke={INK}
          strokeOpacity="0.22"
          strokeWidth="6"
        />
        <circle
          cx="90"
          cy="90"
          r="43"
          stroke={INK}
          strokeOpacity="0.45"
          strokeWidth="6"
        />
        <circle cx="120.4" cy="59.6" fill={INK} r="12.5" />
        <circle cx="46" cy="107" fill={INK} fillOpacity="0.5" r="8" />
        <ellipse cx="90" cy="90" fill={ACCENT} rx="22" ry="20" />
      </svg>
    </div>,
    size,
  );
}
