import type { Metadata } from "next";
import { MerchantContact } from "@/components/legal/merchant-contact";
import { WithdrawalForm } from "@/components/legal/withdrawal-form";
import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { Link } from "@/i18n/navigation";
import { horizontalHeaderClassName } from "@/lib/styles";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${locale === "de" ? "Vertrag widerrufen" : "Withdraw from contract"} | wtfiwant.app`,
  };
}

export default async function WithdrawalPage({ params }: Props) {
  const { locale } = await params;
  const de = locale === "de";
  return (
    <main className="min-h-screen pb-20">
      <header className={horizontalHeaderClassName}>
        <BrandLink />
        <LanguageSwitcher />
      </header>
      <div className="mx-auto max-w-[42rem] px-6 py-16 sm:px-10">
        <h1 className="text-4xl font-bold tracking-tight">
          {de ? "Vertrag widerrufen" : "Withdraw from contract"}
        </h1>
        <p className="my-8 leading-relaxed text-muted">
          {de
            ? "Hier kannst du deinen gesetzlichen Widerruf erklären. Im nächsten Schritt prüfst du deine Angaben und bestätigst die Übermittlung. Ein Konto oder eine Begründung ist nicht erforderlich."
            : "Use this form to exercise your statutory right of withdrawal. In the next step, review your details and confirm submission. No account or reason is required."}
        </p>
        <section className="mb-10 rounded-2xl border border-ink/15 p-6">
          <h2 className="mb-3 text-lg font-bold">
            {de ? "Empfänger deines Widerrufs" : "Recipient of your withdrawal"}
          </h2>
          <MerchantContact locale={de ? "de" : "en"} />
          <p className="mt-4 text-sm text-muted">
            {de
              ? "Du kannst auch per E-Mail oder Post widerrufen. Eine Brief- oder E-Mail-Vorlage findest du hier:"
              : "You can also withdraw by email or post. A template is available here:"}{" "}
            <Link href="/refunds">
              {de
                ? "Widerrufsinformationen und Formularvorlage"
                : "Withdrawal information and template"}
            </Link>
          </p>
        </section>
        <WithdrawalForm locale={de ? "de" : "en"} />
      </div>
    </main>
  );
}
