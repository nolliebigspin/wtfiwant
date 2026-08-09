type ActionPlanSubmitProps = {
  saving: boolean;
  done: boolean;
};

export function ActionPlanSubmit({ saving, done }: ActionPlanSubmitProps) {
  const t = useTranslations("Results");
  return (
    <div className="mt-12 flex flex-wrap items-center gap-6">
      <p className="mr-auto max-w-[25rem] text-muted">{t("submitCopy")}</p>
      <button
        className="min-h-[4.3rem] cursor-pointer rounded-full border-0 bg-accent px-9 py-4 font-black text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0"
        disabled={saving}
        type="submit"
      >
        {saving ? t("starting") : t("startNow")}
      </button>
      {done ? (
        <strong className="basis-full text-[#4b662e]">{t("started")}</strong>
      ) : null}
    </div>
  );
}

import { useTranslations } from "next-intl";
