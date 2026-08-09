import type { Analysis } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { eyebrowClassName } from "@/lib/styles";

export function ResultHero({ summary }: { summary: Analysis["summary"] }) {
  const t = useTranslations("Results");
  return (
    <section className="motion-hero-copy flex min-h-[88vh] flex-col justify-center px-[clamp(1.2rem,12vw,13rem)] py-[clamp(5rem,10vw,10rem)]">
      <p className={eyebrowClassName}>{t("heroEyebrow")}</p>
      <h1 className="m-0 text-[clamp(4rem,10vw,11rem)] leading-[0.8] tracking-[-0.09em]">
        {t("heroTitle")}
      </h1>
      <p className="mt-10 mb-20 max-w-[35rem] font-serif text-lg leading-relaxed text-muted italic">
        {t("heroCopy")}
      </p>
      <p className="mr-0 ml-auto max-w-[50rem] text-[clamp(1.5rem,2.7vw,3rem)] leading-tight font-bold tracking-[-0.035em]">
        {summary}
      </p>
    </section>
  );
}
