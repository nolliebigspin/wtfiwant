import { SeedButtons } from "@/components/seed-buttons";
import { StartReflectionButton } from "@/components/start-reflection-button";
import { eyebrowClassName } from "@/lib/styles";

export function CommitmentCard() {
  const t = useTranslations("Commitment");
  return (
    <section className="motion-page-enter mx-auto my-[5vh] max-w-[53rem]">
      <p className={eyebrowClassName}>{t("eyebrow")}</p>
      <h1 className="m-0 text-[clamp(3.5rem,8vw,7rem)] leading-[0.9] tracking-[-0.08em]">
        {t("title")}
      </h1>
      <div className="my-12 border-l-[3px] border-accent pl-6 text-lg leading-[1.45] [&_p]:my-1 [&_p]:text-muted">
        <p>{t("line1")}</p>
        <p>{t("line2")}</p>
        <p>{t("line3")}</p>
        <strong className="mt-2 block">{t("line4")}</strong>
      </div>
      <CommitmentChecklist />
      <div className="flex items-center gap-8 max-[520px]:flex-col max-[520px]:items-start [&>a]:text-sm [&>a]:text-muted">
        <StartReflectionButton />
        <Link href="/">{t("later")}</Link>
      </div>
      <aside className="motion-reveal mt-12 flex gap-8 rounded-2xl border border-ink/15 p-5">
        <span className="text-[0.65rem] font-black tracking-[0.13em] text-accent-ink">
          {t("private")}
        </span>
        <p className="m-0 text-[0.8rem] text-muted">{t("privateCopy")}</p>
      </aside>
      {process.env.NODE_ENV !== "production" ? <SeedButtons /> : null}
      {process.env.NODE_ENV !== "production" &&
      process.env.PAYMENT_TEST_ENABLED === "true" ? (
        <PaymentTestForm />
      ) : null}
    </section>
  );
}

function CommitmentChecklist() {
  const t = useTranslations("Commitment");
  return (
    <ul className="motion-list my-12 grid list-none grid-cols-3 p-0 max-[800px]:grid-cols-1">
      <li className="border-t border-ink/20 py-4 pr-3 font-bold">
        <span className="mb-8 block text-[0.65rem] text-accent-ink max-[800px]:mr-4 max-[800px]:mb-0 max-[800px]:inline">
          01
        </span>{" "}
        {t("phone")}
      </li>
      <li className="border-t border-ink/20 py-4 pr-3 font-bold">
        <span className="mb-8 block text-[0.65rem] text-accent-ink max-[800px]:mr-4 max-[800px]:mb-0 max-[800px]:inline">
          02
        </span>{" "}
        {t("quiet")}
      </li>
      <li className="border-t border-ink/20 py-4 pr-3 font-bold">
        <span className="mb-8 block text-[0.65rem] text-accent-ink max-[800px]:mr-4 max-[800px]:mb-0 max-[800px]:inline">
          03
        </span>{" "}
        {t("rush")}
      </li>
    </ul>
  );
}

import { useTranslations } from "next-intl";
import { PaymentTestForm } from "@/components/payment-test-form";
import { Link } from "@/i18n/navigation";
