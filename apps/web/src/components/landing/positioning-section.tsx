import { darkEyebrowClassName } from "@/lib/styles";

export function PositioningSection() {
  const t = useTranslations("Landing");
  const principles = ["evidence", "noise", "price", "action"].map((key) => ({
    title: t(`principles.${key}.title`),
    description: t(`principles.${key}.description`),
  }));
  return (
    <section
      className="grid grid-cols-[0.8fr_1.2fr] gap-24 bg-ink px-[clamp(1.2rem,7vw,8rem)] py-[clamp(5rem,9vw,9rem)] text-white max-[800px]:grid-cols-1 max-[800px]:gap-16"
      id="what-this-is"
    >
      <div className="motion-reveal motion-reveal-left">
        <p className={darkEyebrowClassName}>{t("positioningEyebrow")}</p>
        <h2 className="m-0 text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.95] tracking-[-0.065em]">
          {t("stop")}
          <br />
          <em className="font-serif font-normal text-acid">{t("then")}</em>
        </h2>
      </div>
      <div className="grid grid-cols-2 max-[520px]:grid-cols-1">
        {principles.map((principle, index) => (
          <article
            className="motion-reveal min-h-56 border-t border-white/22 py-6 pr-8 pb-8 even:border-l even:pl-8 max-[520px]:even:border-l-0 max-[520px]:even:pl-0"
            key={principle.title}
          >
            <span className="text-[0.7rem] font-black tracking-[0.18em] text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-[2.7rem] mb-[0.7rem] text-2xl">
              {principle.title}
            </h3>
            <p className="leading-relaxed text-white/62">
              {principle.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

import { useTranslations } from "next-intl";
