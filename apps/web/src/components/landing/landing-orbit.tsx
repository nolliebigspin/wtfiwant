import { useTranslations } from "next-intl";

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
        </defs>

        <g className="orbit-layer orbit-layer-outer">
          <circle
            cx="360"
            cy="360"
            fill="none"
            r="330"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="1.5"
          />
          <circle
            className="orbit-dash"
            cx="360"
            cy="360"
            fill="none"
            pathLength="100"
            r="330"
            stroke="url(#orbit-accent)"
            strokeDasharray="14 3 1 82"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle
            className="orbit-node-glow"
            cx="360"
            cy="30"
            fill="#ff4f24"
            fillOpacity="0.3"
            filter="url(#orbit-glow)"
            r="10"
          />
          <circle cx="360" cy="30" fill="#ff4f24" r="5" />
        </g>

        <g className="orbit-layer orbit-layer-fourth">
          <circle
            cx="360"
            cy="360"
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
          <circle cx="541" cy="179" fill="#d9ff52" r="6" stroke="#161713" />
        </g>

        <g className="orbit-layer orbit-layer-middle">
          <circle
            cx="360"
            cy="360"
            fill="none"
            r="198"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          <circle
            cx="360"
            cy="360"
            fill="none"
            pathLength="100"
            r="198"
            stroke="#ff4f24"
            strokeDasharray="22 78"
            strokeLinecap="round"
            strokeOpacity="0.55"
            strokeWidth="2"
          />
          <circle cx="162" cy="360" fill="#161713" r="4" />
        </g>

        <g className="orbit-layer orbit-layer-second">
          <circle
            cx="360"
            cy="360"
            fill="none"
            r="142"
            stroke="currentColor"
            strokeDasharray="1 6"
            strokeLinecap="round"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <circle cx="460" cy="460" fill="#ff4f24" r="5" stroke="#161713" />
        </g>

        <g className="orbit-layer orbit-layer-inner">
          <circle
            cx="360"
            cy="360"
            fill="none"
            r="92"
            stroke="currentColor"
            strokeOpacity="0.32"
            strokeWidth="1.5"
          />
          <circle
            cx="360"
            cy="360"
            fill="none"
            pathLength="100"
            r="92"
            stroke="#ff4f24"
            strokeDasharray="34 66"
            strokeLinecap="round"
            strokeOpacity="0.72"
            strokeWidth="2"
          />
          <circle cx="360" cy="280" fill="#161713" r="4" />
        </g>

        <g className="orbit-crosshair" stroke="#161713" strokeOpacity="0.24">
          <path d="M360 4v38M360 678v38M4 360h38M678 360h38" />
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

      <span className="orbit-label orbit-label-family">{t("family")}</span>
      <span className="orbit-label orbit-label-friends">{t("friends")}</span>
      <span className="orbit-label orbit-label-society">{t("society")}</span>
      <span className="orbit-label orbit-label-social">{t("socialMedia")}</span>
      <span className="orbit-label orbit-label-work">{t("work")}</span>
      <span className="orbit-label orbit-label-money">{t("money")}</span>
      <span className="orbit-label orbit-label-culture">{t("culture")}</span>

      <div className="orbit-core">
        <span className="orbit-core-halo" />
        <span className="orbit-core-grid" />
        <b>{t("you")}</b>
      </div>
    </div>
  );
}
