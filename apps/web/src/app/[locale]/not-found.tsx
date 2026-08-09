import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { eyebrowClassName, primaryButtonClassName } from "@/lib/styles";

export default function NotFound() {
  const t = useTranslations("NotFound");
  return (
    <main className="motion-page-enter grid min-h-[calc(100vh-4rem)] place-content-center justify-items-start p-8">
      <p className={eyebrowClassName}>404</p>
      <h1 className="mb-4 max-w-[13ch] text-[clamp(3rem,7vw,7rem)] leading-[0.9] tracking-[-0.075em]">
        {t("title")}
      </h1>
      <Link className={primaryButtonClassName} href="/">
        {t("home")}
      </Link>
    </main>
  );
}
