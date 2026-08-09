import { LandingClose } from "@/components/landing/landing-close";
import { LandingFacts } from "@/components/landing/landing-facts";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingNav } from "@/components/landing/landing-nav";
import { PositioningSection } from "@/components/landing/positioning-section";

export default function Home() {
  return (
    <main className="landing">
      <LandingNav />
      <LandingHero />
      <PositioningSection />
      <LandingFacts />
      <LandingClose />
    </main>
  );
}
