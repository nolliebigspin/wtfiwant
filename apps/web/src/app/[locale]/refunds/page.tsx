import type { Metadata } from "next";
import { getLegalDocument } from "@/components/legal/legal-content";
import { LegalDocument } from "@/components/legal/legal-document";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${getLegalDocument("refunds", locale === "de" ? "de" : "en").title} | wtfiwant.app`,
  };
}

export default async function RefundsPage({ params }: Props) {
  const { locale } = await params;
  return (
    <LegalDocument kind="refunds" locale={locale === "de" ? "de" : "en"} />
  );
}
