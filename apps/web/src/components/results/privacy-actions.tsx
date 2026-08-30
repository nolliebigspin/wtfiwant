import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type PrivacyActionsProps = {
  sessionId: string;
  onDelete: (sessionId: string) => Promise<void>;
  onResend: (sessionId: string) => Promise<void>;
};

export function PrivacyActions({
  sessionId,
  onDelete,
  onResend,
}: PrivacyActionsProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [delivery, setDelivery] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const deleteReflection = async () => {
    if (!window.confirm(t("Results.deleteConfirm"))) return;

    await onDelete(sessionId);
    localStorage.removeItem("wtfiwant.sessionId");
    window.location.assign(`/${locale}`);
  };

  const resend = async () => {
    setDelivery("sending");
    try {
      await onResend(sessionId);
      setDelivery("sent");
    } catch {
      setDelivery("error");
    }
  };

  return (
    <section className="flex justify-between border-t border-ink/17 px-[clamp(1.2rem,9vw,9rem)] pt-8 pb-16 text-[0.7rem] text-muted max-[800px]:flex-col max-[800px]:items-start max-[800px]:gap-4">
      <p>{t("Common.privacy")}</p>
      <div className="flex gap-5">
        <button
          className="motion-button-quiet cursor-pointer border-0 bg-transparent underline underline-offset-2"
          type="button"
          disabled={delivery === "sending"}
          onClick={resend}
        >
          {delivery === "sending"
            ? t("Results.resending")
            : delivery === "sent"
              ? t("Results.resent")
              : delivery === "error"
                ? t("Results.resendError")
                : t("Results.resend")}
        </button>
        <button
          className="motion-button-quiet cursor-pointer border-0 bg-transparent text-[#a22d19] underline underline-offset-2 hover:text-[#7f2110]"
          type="button"
          onClick={deleteReflection}
        >
          {t("Results.delete")}
        </button>
      </div>
    </section>
  );
}
