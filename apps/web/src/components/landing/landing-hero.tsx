import { useTranslations } from "next-intl";
import { ResumeLink } from "@/components/resume-link";
import { Link } from "@/i18n/navigation";
import { eyebrowClassName, largePrimaryButtonClassName } from "@/lib/styles";
import { LandingOrbit } from "./landing-orbit";

export function LandingHero() {
  const t = useTranslations("Landing");
  return (
    <section className="grid min-h-[calc(100vh-5rem)] grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] items-center gap-16 px-[clamp(1.2rem,7vw,8rem)] py-[clamp(4rem,8vw,8rem)] max-[800px]:min-h-auto max-[800px]:grid-cols-1">
      <div className="motion-hero-copy">
        <p className={eyebrowClassName}>{t("eyebrow")}</p>
        <h1 className="m-0 max-w-[12ch] text-[clamp(3.6rem,7.4vw,8.5rem)] leading-[0.88] font-extrabold tracking-[-0.062em]">
          {t("titleBefore")}
          <em className="font-serif font-normal tracking-[-0.035em] text-accent-ink">
            {t("titleEmphasis")}
          </em>{" "}
          {t("titleAfter")}
        </h1>
        <div className="my-10 max-w-[38rem] text-[clamp(1rem,1.4vw,1.25rem)] leading-[1.55] [&_p]:my-1">
          <p>{t("intro1")}</p>
          <p>{t("intro2")}</p>
          <p>{t("intro3")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Link className={largePrimaryButtonClassName} href="/commitment">
            {t("cta")}{" "}
            <span className="motion-button-icon text-xl" aria-hidden="true">
              ↗
            </span>
          </Link>
          <ResumeLink />
        </div>
      </div>
      <LandingOrbit />
    </section>
  );
}
