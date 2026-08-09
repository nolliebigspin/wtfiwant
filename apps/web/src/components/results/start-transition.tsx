import { eyebrowBaseClassName } from "@/lib/styles";

export function StartTransition() {
  const t = useTranslations("Results");
  return (
    <section className="bg-accent px-[clamp(1.2rem,9vw,9rem)] py-[clamp(6rem,12vw,12rem)] text-ink">
      <p className={eyebrowBaseClassName}>{t("transitionEyebrow")}</p>
      <h2 className="m-0 text-[clamp(3.5rem,8vw,9rem)] leading-[0.85] tracking-[-0.08em]">
        {t("thoughtEnough")}
        <br />
        <em className="font-[Georgia,serif] font-normal">{t("doSomething")}</em>
      </h2>
      <p className="mt-12 max-w-[35rem] text-xl leading-relaxed">
        {t("transitionCopy")}
      </p>
      <div className="mt-32 flex items-baseline justify-between border-t border-ink/40 pt-5">
        <span>{t("whatever")}</span>
        <strong className="text-[clamp(2.5rem,7vw,7rem)] tracking-[-0.08em]">
          {t("start")}
        </strong>
      </div>
    </section>
  );
}

import { useTranslations } from "next-intl";
