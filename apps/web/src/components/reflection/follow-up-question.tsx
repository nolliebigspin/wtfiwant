import { FormError } from "@/components/ui/form-error";
import {
  eyebrowClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/lib/styles";
import { questionInputClassName } from "./question-input.types";

type FollowUpQuestionProps = {
  question: string;
  locale: Locale;
  response: string;
  error: string | null;
  saving: boolean;
  onResponseChange: (response: string) => void;
  onSkip: () => void;
  onSubmit: () => void;
};

export function FollowUpQuestion({
  question,
  locale: _locale,
  response,
  error,
  saving,
  onResponseChange,
  onSkip,
  onSubmit,
}: FollowUpQuestionProps) {
  const t = useTranslations("Reflection");
  return (
    <section className="motion-question-enter">
      <p className={eyebrowClassName}>{t("followUpEyebrow")}</p>
      <h1 className="mb-4 max-w-[18ch] text-[clamp(2.5rem,5vw,5rem)] leading-[0.95] tracking-[-0.07em]">
        {question}
      </h1>
      <p className="mb-9 max-w-[42rem] text-[1.05rem] leading-relaxed text-muted">
        {t("followUpDescription")}
      </p>
      <textarea
        className={`${questionInputClassName} min-h-48 resize-y`}
        value={response}
        aria-label={question}
        onChange={(event) => onResponseChange(event.target.value)}
      />
      <FormError>{error}</FormError>
      <div className="mt-8 flex items-center justify-between">
        <button
          className={secondaryButtonClassName}
          type="button"
          onClick={onSkip}
        >
          {t("skip")}
        </button>
        <button
          className={primaryButtonClassName}
          type="button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? t("saving") : t("seeCompass")}
        </button>
      </div>
    </section>
  );
}

import type { Locale } from "@wtfiwant/shared";
import { useTranslations } from "next-intl";
