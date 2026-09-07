import type { Metadata } from "next";
import { WithdrawalForm } from "@/components/legal/withdrawal-form";
import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
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
        <WithdrawalForm locale={de ? "de" : "en"} />
      </div>
    </main>
  );
}
