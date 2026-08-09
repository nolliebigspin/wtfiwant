import { CommitmentCard } from "@/components/commitment/commitment-card";
import { BrandLink } from "@/components/ui/brand-link";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { horizontalHeaderClassName } from "@/lib/styles";

export default function CommitmentPage() {
  return (
    <main className="min-h-screen pb-16">
      <header className={horizontalHeaderClassName}>
        <BrandLink />
        <LanguageSwitcher />
      </header>
      <div className="px-[clamp(1rem,4vw,4rem)]">
        <CommitmentCard />
      </div>
    </main>
  );
}
