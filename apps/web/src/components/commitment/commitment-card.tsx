import { SeedButtons } from "@/components/seed-buttons";
import { StartReflectionButton } from "@/components/start-reflection-button";

export function CommitmentCard() {
  return (
    <section className="commitment-card">
      <p className="eyebrow">BEFORE YOU BEGIN</p>
      <h1>Give this 20 minutes.</h1>
      <div className="commitment-copy">
        <p>This isn't a personality test.</p>
        <p>There are no right answers.</p>
        <p>Don't answer as the person you think you should be.</p>
        <strong>Answer as yourself.</strong>
      </div>
      <CommitmentChecklist />
      <div className="commitment-actions">
        <StartReflectionButton />
        <a href="/">I'll do this later</a>
      </div>
      <aside>
        <span>PRIVATE BY DEFAULT</span>
        <p>
          Your progress is saved under an anonymous ID. No account, ads, or
          tracking scripts.
        </p>
      </aside>
      {process.env.NODE_ENV !== "production" ? <SeedButtons /> : null}
    </section>
  );
}

function CommitmentChecklist() {
  return (
    <ul>
      <li>
        <span>01</span> Put the phone away
      </li>
      <li>
        <span>02</span> Find somewhere quiet
      </li>
      <li>
        <span>03</span> Don't rush
      </li>
    </ul>
  );
}
