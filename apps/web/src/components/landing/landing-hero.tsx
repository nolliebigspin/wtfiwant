import { ResumeLink } from "@/components/resume-link";

export function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="hero-copy">
        <p className="eyebrow">A 20–30 MINUTE GUIDED REFLECTION</p>
        <h1>
          What the fuck do I <em>actually</em> want?
        </h1>
        <div className="hero-prose">
          <p>You spend years optimizing your life.</p>
          <p>Career. Money. Relationships. Fitness. Productivity.</p>
          <p>
            But when did you last ask whether you're optimizing for a life you
            actually want?
          </p>
        </div>
        <div className="hero-actions">
          <a className="primary-button large" href="/commitment">
            Figure it out <span>↗</span>
          </a>
          <ResumeLink />
        </div>
      </div>
      <div className="hero-orbit" aria-hidden="true">
        <div className="orbit outer">
          <span>OTHER PEOPLE</span>
        </div>
        <div className="orbit middle">
          <span>EXPECTATIONS</span>
        </div>
        <div className="orbit inner">
          <b>YOU</b>
        </div>
      </div>
    </section>
  );
}
