import type { AnalysisPreview } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
import { primaryButtonClassName } from "@/lib/styles";
import { EvidenceDrawer } from "./evidence-drawer";
import { ResultShell } from "./result-shell";
import type { EvidenceAnswers } from "./results.types";

export function CompassPreview({
  preview,
  purchasing,
  error,
  answers,
  checkoutAvailable,
  legalLinks,
  onPurchase,
}: {
  preview: AnalysisPreview;
  purchasing: boolean;
  error: string | null;
  answers: EvidenceAnswers;
  checkoutAvailable: boolean;
  legalLinks: { termsUrl: string; refundPolicyUrl: string } | null;
  onPurchase: () => void;
}) {
  const t = useTranslations("Results");
  return (
    <ResultShell>
      <main>
        <section className="mx-auto flex min-h-[75vh] w-[min(100%-2rem,58rem)] flex-col justify-center py-20">
          <p className="mb-4 text-xs tracking-[0.18em] text-accent uppercase">
            {t("previewEyebrow")}
          </p>
          <h1 className="mb-8 text-[clamp(3.5rem,9vw,8rem)] leading-[0.85] tracking-[-0.075em]">
            {t("heroTitle")}
          </h1>
          <p className="max-w-[48rem] text-[clamp(1.35rem,3vw,2.5rem)] leading-tight font-bold">
            {preview.summary}
          </p>
        </section>
        <section className="border-y border-ink/15 bg-paper px-[clamp(1.2rem,10vw,10rem)] py-20">
          <p className="mb-3 text-xs tracking-[0.16em] text-accent uppercase">
            {t("previewSignal")}
          </p>
          <h2 className="mb-4 text-4xl tracking-[-0.04em]">
            {preview.coreDriver.name}
          </h2>
          <p className="max-w-[42rem] text-lg leading-relaxed text-muted">
            {preview.coreDriver.explanation}
          </p>
          <EvidenceDrawer
            ids={preview.coreDriver.evidenceQuestionIds}
            answers={answers}
          />
        </section>
        <section className="mx-auto w-[min(100%-2rem,58rem)] py-24 text-center">
          <p className="mb-3 text-xs tracking-[0.16em] text-accent uppercase">
            {t("unlockEyebrow")}
          </p>
          <h2 className="mx-auto mb-6 max-w-[14ch] text-[clamp(2.7rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">
            {t("unlockTitle")}
          </h2>
          <p className="mx-auto mb-8 max-w-[40rem] leading-relaxed text-muted">
            {t("unlockCopy")}
          </p>
          <ul className="mx-auto mb-10 grid max-w-[38rem] gap-3 text-left">
            {preview.lockedSections.map((section) => (
              <li className="border-b border-ink/15 pb-3" key={section}>
                ✦ {t(`locked.${section}`)}
              </li>
            ))}
          </ul>
          {checkoutAvailable ? (
            <>
              <button
                className={primaryButtonClassName}
                type="button"
                disabled={purchasing}
                onClick={onPurchase}
              >
                {purchasing ? t("openingCheckout") : t("purchase")}
              </button>
              <p className="mx-auto mt-5 max-w-[34rem] text-xs leading-relaxed text-muted">
                {t("emailWarning")}
              </p>
              <p className="mx-auto mt-2 max-w-[34rem] text-xs leading-relaxed text-muted">
                {t("purchaseTerms")}{" "}
                <a href={legalLinks?.termsUrl} rel="noreferrer">
                  {t("termsLink")}
                </a>{" "}
                ·{" "}
                <a href={legalLinks?.refundPolicyUrl} rel="noreferrer">
                  {t("refundLink")}
                </a>
              </p>
            </>
          ) : (
            <p className="mx-auto max-w-[34rem] text-sm leading-relaxed text-muted">
              {t("paymentsUnavailable")}
            </p>
          )}
          {error ? (
            <p className="mt-4 text-sm font-bold text-[#a22d19]">{error}</p>
          ) : null}
        </section>
      </main>
    </ResultShell>
  );
}
