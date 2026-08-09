import { useTranslations } from "next-intl";

const CENTER = 360;

type RingDesign = {
  /** Ring identity, used for CSS animation speed/direction and path ids. */
  id: string;
  radius: number;
  /** Where the label sits on its ring, in degrees clockwise from 12 o'clock. */
  labelAngle: number;
  labelKey: string;
  /** How this influence pulls on the person, shown under the bent label. */
  relationKey: string;
  /**
   * The one planet on this ring, if this label is the one carrying it. Rings
   * shared by two influences give the planet to a single label so no ring ever
   * shows more than one.
   */
  planet?: Planet;
};

/** Brand colors, one ring each, so the whole palette appears exactly once. */
type Planet = {
  fill: string;
  radius: number;
  /** Draws the soft bloom behind the brightest planet. */
  glow?: boolean;
};

const PLANET_ACCENT: Planet = { fill: "var(--color-accent)", radius: 7 };
const PLANET_ACID: Planet = { fill: "var(--color-acid)", radius: 6.5 };
const PLANET_INK: Planet = { fill: "var(--color-ink)", radius: 5 };
const PLANET_ACCENT_INK: Planet = {
  fill: "var(--color-accent-ink)",
  radius: 6,
};
const PLANET_PAPER_DEEP: Planet = {
  fill: "var(--color-paper-deep)",
  radius: 6,
};

/** Gap between a ring and the baseline of the name riding just off it. */
const LABEL_GAP = 15;
/** Gap between the name's baseline and the relationship line beyond it. */
const RELATION_GAP = 15;

function labelRadius(ring: RingDesign): number {
  return ring.radius + LABEL_GAP;
}

function relationRadius(ring: RingDesign): number {
  return labelRadius(ring) + RELATION_GAP;
}

/**
 * A full circle as two arcs, so text can be set along it. Text bent to its own
 * ring stays welded to that ring: it travels, curves, and keeps its distance
 * from the planet no matter where the rotation has carried it.
 */
function ringPath(radius: number): string {
  const left = CENTER - radius;
  const right = CENTER + radius;

  return [
    `M ${left} ${CENTER}`,
    `A ${radius} ${radius} 0 0 1 ${right} ${CENTER}`,
    `A ${radius} ${radius} 0 0 1 ${left} ${CENTER}`,
  ].join(" ");
}

/** Turns a clock angle into a fraction along the path drawn by `ringPath`. */
function labelOffset(angle: number): number {
  const normalized = (((angle + 90) % 360) + 360) % 360;

  return normalized / 360;
}

/*
 * Angles are spread right around each ring so no two names line up radially as
 * the rings turn, and the two names sharing a ring sit well apart on it. Each
 * ring carries exactly one planet; on a shared ring only one label declares it.
 */
const RINGS: RingDesign[] = [
  {
    id: "society",
    radius: 330,
    labelAngle: -58,
    labelKey: "society",
    relationKey: "societyRelation",
    planet: PLANET_PAPER_DEEP,
  },
  {
    id: "culture",
    radius: 330,
    labelAngle: 128,
    labelKey: "culture",
    relationKey: "cultureRelation",
  },
  {
    id: "socialMedia",
    radius: 256,
    labelAngle: 44,
    labelKey: "socialMedia",
    relationKey: "socialMediaRelation",
    planet: PLANET_ACID,
  },
  {
    id: "money",
    radius: 256,
    labelAngle: 205,
    labelKey: "money",
    relationKey: "moneyRelation",
  },
  {
    id: "work",
    radius: 198,
    labelAngle: -125,
    labelKey: "work",
    relationKey: "workRelation",
    planet: PLANET_INK,
  },
  {
    id: "friends",
    radius: 142,
    labelAngle: 30,
    labelKey: "friends",
    relationKey: "friendsRelation",
    planet: PLANET_ACCENT_INK,
  },
  {
    id: "family",
    radius: 92,
    labelAngle: -28,
    labelKey: "family",
    relationKey: "familyRelation",
    planet: { ...PLANET_ACCENT, glow: true },
  },
];

function polar(radius: number, angle: number): { x: number; y: number } {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

/**
 * One influence riding its ring: that ring's single planet, a tick out to the
 * name, and the relationship it has to the person at the center.
 *
 * The name is bent onto its own ring, so it stays welded to that ring's planet
 * through a full turn — reading upside-down while the ring carries it along
 * the bottom, the same way the planet itself keeps going round.
 */
function RingLabel({ ring }: { ring: RingDesign }) {
  const t = useTranslations("Landing");
  const startOffset = `${labelOffset(ring.labelAngle) * 100}%`;
  const node = polar(ring.radius, ring.labelAngle);
  const anchor = polar(labelRadius(ring), ring.labelAngle);
  const planet = ring.planet;

  return (
    <g className="orbit-rider">
      <line
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
        x1={node.x}
        x2={anchor.x}
        y1={node.y}
        y2={anchor.y}
      />
      {planet ? (
        <>
          {planet.glow ? (
            <circle
              className="orbit-node-glow"
              cx={node.x}
              cy={node.y}
              fill={planet.fill}
              fillOpacity="0.32"
              filter="url(#orbit-glow)"
              r={planet.radius * 2}
            />
          ) : null}
          <circle
            cx={node.x}
            cy={node.y}
            fill={planet.fill}
            r={planet.radius}
            stroke="var(--color-ink)"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
        </>
      ) : (
        <circle
          cx={node.x}
          cy={node.y}
          fill="currentColor"
          fillOpacity="0.55"
          r="2.5"
        />
      )}
      <text className="orbit-arc-label">
        <textPath
          href={`#orbit-label-path-${ring.id}`}
          startOffset={startOffset}
          textAnchor="middle"
        >
          {t(ring.labelKey)}
        </textPath>
      </text>
      <text className="orbit-arc-relation">
        <textPath
          href={`#orbit-relation-path-${ring.id}`}
          startOffset={startOffset}
          textAnchor="middle"
        >
          {t(ring.relationKey)}
        </textPath>
      </text>
    </g>
  );
}

export function LandingOrbit() {
  const t = useTranslations("Landing");

  return (
    <div
      className="orbit-visual motion-orbit-enter relative aspect-square w-full max-w-[42rem] justify-self-center max-[800px]:max-w-[27rem]"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 720 720"
      >
        <title>Decorative orbit animation</title>
        <defs>
          <linearGradient id="orbit-accent" x1="70" x2="650" y1="70" y2="650">
            <stop stopColor="#ff4f24" />
            <stop offset="1" stopColor="#c93412" stopOpacity="0.35" />
          </linearGradient>
          <filter
            id="orbit-glow"
            x="-200%"
            y="-200%"
            width="400%"
            height="400%"
          >
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <radialGradient id="orbit-pull" cx="0.5" cy="0.5" r="0.5">
            <stop stopColor="#ff4f24" stopOpacity="0.09" />
            <stop offset="0.55" stopColor="#ff4f24" stopOpacity="0.03" />
            <stop offset="1" stopColor="#ff4f24" stopOpacity="0" />
          </radialGradient>
          {RINGS.map((ring) => (
            <path
              d={ringPath(labelRadius(ring))}
              id={`orbit-label-path-${ring.id}`}
              key={ring.id}
            />
          ))}
          {RINGS.map((ring) => (
            <path
              d={ringPath(relationRadius(ring))}
              id={`orbit-relation-path-${ring.id}`}
              key={ring.id}
            />
          ))}
        </defs>

        <circle
          className="orbit-pull"
          cx={CENTER}
          cy={CENTER}
          fill="url(#orbit-pull)"
          r="215"
        />

        <g className="orbit-layer orbit-layer-outer">
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            r="330"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <circle
            className="orbit-dash"
            cx={CENTER}
            cy={CENTER}
            fill="none"
            pathLength="100"
            r="330"
            stroke="url(#orbit-accent)"
            strokeDasharray="14 3 1 82"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <RingLabel ring={RINGS[0]} />
          <RingLabel ring={RINGS[1]} />
        </g>

        <g className="orbit-layer orbit-layer-fourth">
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            r="256"
            stroke="currentColor"
            strokeDasharray="2 8"
            strokeLinecap="round"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          <path
            d="M179 179a256 256 0 0 1 362 0"
            fill="none"
            stroke="#161713"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          <RingLabel ring={RINGS[2]} />
          <RingLabel ring={RINGS[3]} />
        </g>

        <g className="orbit-layer orbit-layer-middle">
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            r="198"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            pathLength="100"
            r="198"
            stroke="#ff4f24"
            strokeDasharray="22 78"
            strokeLinecap="round"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
          <RingLabel ring={RINGS[4]} />
        </g>

        <g className="orbit-layer orbit-layer-second">
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            r="142"
            stroke="currentColor"
            strokeDasharray="1 6"
            strokeLinecap="round"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <RingLabel ring={RINGS[5]} />
        </g>

        <g className="orbit-layer orbit-layer-inner">
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            r="92"
            stroke="currentColor"
            strokeOpacity="0.32"
            strokeWidth="1.5"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            fill="none"
            pathLength="100"
            r="92"
            stroke="#ff4f24"
            strokeDasharray="34 66"
            strokeLinecap="round"
            strokeOpacity="0.72"
            strokeWidth="2"
          />
          <RingLabel ring={RINGS[6]} />
        </g>

        <g className="orbit-crosshair" stroke="#161713" strokeOpacity="0.24">
          <path d="M352 360h16M360 352v16" />
        </g>

        <path
          className="orbit-signal"
          d="M82 495C181 652 482 692 642 507"
          fill="none"
          pathLength="100"
          stroke="#ff4f24"
          strokeDasharray="1 7"
          strokeLinecap="round"
          strokeOpacity="0.48"
          strokeWidth="3"
        />
      </svg>

      <div className="orbit-core">
        <span className="orbit-core-halo" />
        <span className="orbit-core-grid" />
        <b>{t("you")}</b>
      </div>
    </div>
  );
}
