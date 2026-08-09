import { useTranslations } from "next-intl";

export function LandingOrbit() {
  const t = useTranslations("Landing");

  return (
    <div
      className="orbit-visual motion-orbit-enter relative aspect-square w-full max-w-[36rem] justify-self-center max-[800px]:max-w-[25rem]"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 size-full overflow-visible"
        viewBox="0 0 620 620"
      >
        <title>Decorative orbit animation</title>
        <defs>
          <linearGradient id="orbit-accent" x1="90" x2="530" y1="90" y2="530">
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
        </defs>

        <g className="orbit-layer orbit-layer-outer">
          <circle
            cx="310"
            cy="310"
            fill="none"
            r="258"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <circle
            className="orbit-dash"
            cx="310"
            cy="310"
            fill="none"
            pathLength="100"
            r="258"
            stroke="url(#orbit-accent)"
            strokeDasharray="14 3 1 82"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle
            className="orbit-node-glow"
            cx="310"
            cy="52"
            fill="#ff4f24"
            fillOpacity="0.3"
            filter="url(#orbit-glow)"
            r="9"
          />
          <circle cx="310" cy="52" fill="#ff4f24" r="5" />
        </g>

        <g className="orbit-layer orbit-layer-middle">
          <circle
            cx="310"
            cy="310"
            fill="none"
            r="187"
            stroke="currentColor"
            strokeDasharray="2 7"
            strokeLinecap="round"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          <path
            d="M178 178a187 187 0 0 1 264 0"
            fill="none"
            stroke="#161713"
            strokeOpacity="0.42"
            strokeWidth="2"
          />
          <circle cx="442" cy="178" fill="#d9ff52" r="6" stroke="#161713" />
        </g>

        <g className="orbit-layer orbit-layer-inner">
          <circle
            cx="310"
            cy="310"
            fill="none"
            r="112"
            stroke="currentColor"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <circle
            cx="310"
            cy="310"
            fill="none"
            pathLength="100"
            r="98"
            stroke="#ff4f24"
            strokeDasharray="34 66"
            strokeLinecap="round"
            strokeOpacity="0.72"
            strokeWidth="2"
          />
          <circle cx="310" cy="212" fill="#161713" r="4" />
        </g>

        <g className="orbit-crosshair" stroke="#161713" strokeOpacity="0.24">
          <path d="M310 25v34M310 561v34M25 310h34M561 310h34" />
          <path d="M302 310h16M310 302v16" />
        </g>

        <path
          className="orbit-signal"
          d="M94 428C172 536 373 590 506 450"
          fill="none"
          pathLength="100"
          stroke="#ff4f24"
          strokeDasharray="1 7"
          strokeLinecap="round"
          strokeOpacity="0.48"
          strokeWidth="3"
        />
      </svg>

      <span className="orbit-label orbit-label-outer">
        <small>01</small>
        {t("otherPeople")}
      </span>
      <span className="orbit-label orbit-label-inner">
        <small>02</small>
        {t("expectations")}
      </span>

      <div className="orbit-core">
        <span className="orbit-core-halo" />
        <span className="orbit-core-grid" />
        <b>{t("you")}</b>
      </div>
    </div>
  );
}
