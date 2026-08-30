import { eyebrowClassName, primaryButtonClassName } from "@/lib/styles";
import { ResultShell } from "./result-shell";

const stateClassName =
  "motion-page-enter grid min-h-[calc(100vh-4rem)] place-content-center justify-items-start p-8 [&_h1]:mb-4 [&_h1]:max-w-[13ch] [&_h1]:text-[clamp(3rem,7vw,7rem)] [&_h1]:leading-[0.9] [&_h1]:tracking-[-0.075em] [&>p]:max-w-[38rem] [&>p]:leading-relaxed [&>p]:text-muted";

export function ResultError({ message }: { message: string }) {
  const t = useTranslations("Results");
  return (
    <ResultShell>
      <main className={stateClassName}>
        <h1>{t("errorTitle")}</h1>
        <p>{message}</p>
        <button
          className={primaryButtonClassName}
          onClick={() => window.location.reload()}
          type="button"
        >
          {t("retry")}
        </button>
      </main>
    </ResultShell>
  );
}

export function SafetyResult({ message }: { message: string }) {
  const t = useTranslations("Results");
  return (
    <ResultShell>
      <main className={stateClassName}>
        <p className={eyebrowClassName}>{t("pause")}</p>
        <h1>{t("safetyTitle")}</h1>
        <p>{message}</p>
      </main>
    </ResultShell>
  );
}

export function ResultLoading({
  title,
  copy,
}: {
  title?: string;
  copy?: string;
} = {}) {
  const t = useTranslations("Results");
  return (
    <ResultShell>
      <main className={stateClassName}>
        <div
          className="animate-[pulse-mark_1.3s_infinite_alternate] text-5xl text-accent"
          aria-hidden="true"
        >
          ✦
        </div>
        <h1>{title ?? t("loadingTitle")}</h1>
        <p>{copy ?? t("loadingCopy")}</p>
      </main>
    </ResultShell>
  );
}

import { useTranslations } from "next-intl";
