import { CommitmentCard } from "@/components/commitment/commitment-card";
import { BrandLink } from "@/components/ui/brand-link";

export default function CommitmentPage() {
  return (
    <main className="min-h-screen px-[clamp(1rem,4vw,4rem)] pb-16">
      <header className="flex min-h-20 items-center">
        <BrandLink />
      </header>
      <CommitmentCard />
    </main>
  );
}
