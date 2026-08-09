import { eyebrowBaseClassName } from "@/lib/styles";

export function LandingClose() {
  const t = useTranslations("Landing");
  return (
    <section className="bg-accent px-[clamp(1.2rem,7vw,8rem)] py-[clamp(5rem,9vw,9rem)] text-ink">
      <p className={eyebrowBaseClassName}>{t("closeEyebrow")}</p>
      <h2 className="m-0 max-w-[17ch] text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.95] tracking-[-0.065em]">
        {t("parents")}
        <br />
        {t("success")}
        <br />
        <em className="font-[Georgia,serif] font-normal">{t("feel")}</em>
      </h2>
      <Link
        className="mt-12 inline-flex items-center gap-12 rounded-full bg-paper px-[1.8rem] py-[1.2rem] font-black text-ink no-underline transition-transform hover:-translate-y-0.5 focus-visible:outline-ink active:translate-y-0"
        href="/commitment"
      >
        {t("twenty")} <span>→</span>
      </Link>
      <p className="mt-16 mb-0 text-[0.7rem] opacity-70">{t("disclaimer")}</p>
    </section>
  );
}

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
