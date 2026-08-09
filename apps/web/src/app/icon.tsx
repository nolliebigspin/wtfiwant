import { ImageResponse } from "next/og";

/*
 * The landing orbit reduced to what survives at 16px: the person at the centre
 * and the influences circling them. The core keeps the organic, slightly
 * off-round silhouette it has on the landing page rather than becoming a plain
 * dot, because that asymmetry is the recognisable part of the mark.
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const PAPER = "#f3f0e8";
const INK = "#161713";
const ACCENT = "#ff4f24";

export default function Icon() {
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
      <svg fill="none" height="32" viewBox="0 0 32 32" width="32">
        {/*
         * One ring, not two: at 16px a second ring closes the gap and the mark
         * collapses into a bullseye. The single orbit plus two influence nodes
         * riding it is what still reads as orbiting at tab size.
         */}
        <circle
          cx="16"
          cy="16"
          r="9"
          stroke={INK}
          strokeOpacity="0.45"
          strokeWidth="1.75"
        />
        {/*
         * A single influence on the ring. A second, smaller node disappears at
         * 16px and only muddies the silhouette, so one node carries the idea:
         * something out there, pulling.
         */}
        <circle cx="22.4" cy="9.6" fill={INK} r="2.9" />
        {/*
         * The core stays small so the ring keeps its air. Slightly wider than
         * tall, echoing the landing page's organic silhouette rather than a
         * perfect dot.
         */}
        <ellipse cx="16" cy="16" fill={ACCENT} rx="4.5" ry="4.1" />
      </svg>
    </div>,
    size,
  );
}
