import { eyebrowBaseClassName } from "@/lib/styles";
import { cn } from "@/lib/utils";

export function LandingClose() {
  const t = useTranslations("Landing");
  return (
    <section className="bg-accent px-[clamp(1.2rem,7vw,8rem)] py-[clamp(5rem,9vw,9rem)] text-ink">
      <p className={cn(eyebrowBaseClassName, "motion-reveal")}>
        {t("closeEyebrow")}
      </p>
      <h2 className="motion-reveal m-0 text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.93] font-bold tracking-[-0.055em]">
        <span className="block min-[960px]:whitespace-nowrap">
          {t("parents")}
        </span>
        <span className="block min-[960px]:whitespace-nowrap">
          {t("success")}
        </span>
        <em className="block font-serif font-medium tracking-[-0.035em] min-[960px]:whitespace-nowrap">
          {t("feel")}
        </em>
      </h2>
      <div className="motion-reveal mt-12">
        <Link
          className="motion-button inline-flex items-center gap-12 rounded-full bg-paper px-[1.8rem] py-[1.2rem] font-black text-ink no-underline hover:shadow-[0_12px_28px_rgb(22_23_19_/_0.14)] focus-visible:outline-ink"
          href="/commitment"
        >
          {t("twenty")}{" "}
          <span className="motion-button-icon" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
      <p className="mt-16 mb-0 text-[0.7rem] opacity-70">{t("disclaimer")}</p>
    </section>
  );
}

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
