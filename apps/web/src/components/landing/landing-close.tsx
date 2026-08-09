import { eyebrowBaseClassName } from "@/lib/styles";

export function LandingClose() {
  const t = useTranslations("Landing");
  return (
    <section className="bg-accent px-[clamp(1.2rem,7vw,8rem)] py-[clamp(5rem,9vw,9rem)] text-ink">
      <p className={`${eyebrowBaseClassName} motion-reveal`}>
        {t("closeEyebrow")}
      </p>
      <h2 className="motion-reveal m-0 max-w-[17ch] text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.95] tracking-[-0.065em]">
        {t("parents")}
        <br />
        {t("success")}
        <br />
        <em className="font-serif font-normal">{t("feel")}</em>
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
