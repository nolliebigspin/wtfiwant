import type { Metadata } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import "../globals.css";

const dmSans = DM_Sans({
  axes: ["opsz"],
  display: "swap",
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const newsreader = Newsreader({
  axes: ["opsz"],
  display: "swap",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html className={cn(dmSans.variable, newsreader.variable)} lang={locale}>
      <body className="bg-paper font-sans text-ink antialiased">
        <NextIntlClientProvider messages={await getMessages()}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
