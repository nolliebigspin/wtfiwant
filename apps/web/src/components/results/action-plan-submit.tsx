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
        className="min-h-[4.3rem] cursor-pointer rounded-full border-0 bg-accent px-9 py-4 font-black text-ink transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#ff653f] hover:shadow-[0_10px_24px_rgb(255_79_36_/_0.2)] active:translate-y-0 active:scale-[0.98] active:shadow-none disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        disabled={saving}
        type="submit"
      >
        {saving ? t("starting") : t("startNow")}
      </button>
      {done ? (
        <strong className="motion-feedback basis-full text-[#4b662e]">
          {t("started")}
        </strong>
      ) : null}
    </div>
  );
}

import { useTranslations } from "next-intl";
