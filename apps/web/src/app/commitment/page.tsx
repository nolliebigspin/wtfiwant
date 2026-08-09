import { CommitmentCard } from "@/components/commitment/commitment-card";
import { BrandLink } from "@/components/ui/brand-link";

export default function CommitmentPage() {
  return (
    <main className="commitment-page">
      <header>
        <BrandLink />
      </header>
      <CommitmentCard />
    </main>
  );
}
