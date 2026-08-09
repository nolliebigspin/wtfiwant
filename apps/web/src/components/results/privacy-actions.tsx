type PrivacyActionsProps = {
  sessionId: string;
  onDelete: (sessionId: string) => Promise<void>;
};

export function PrivacyActions({ sessionId, onDelete }: PrivacyActionsProps) {
  const locale = useLocale();
  const t = useTranslations();
  const deleteReflection = async () => {
    if (!window.confirm(t("Results.deleteConfirm"))) return;

    await onDelete(sessionId);
    localStorage.removeItem("wtfiwant.sessionId");
    window.location.assign(`/${locale}`);
  };

  return (
    <section className="flex justify-between border-t border-ink/17 px-[clamp(1.2rem,9vw,9rem)] pt-8 pb-16 text-[0.7rem] text-muted max-[800px]:flex-col max-[800px]:items-start max-[800px]:gap-4">
      <p>{t("Common.privacy")}</p>
      <button
        className="cursor-pointer border-0 bg-transparent text-[#a22d19] underline underline-offset-2"
        type="button"
        onClick={deleteReflection}
      >
        {t("Results.delete")}
      </button>
    </section>
  );
}

import { useLocale, useTranslations } from "next-intl";
