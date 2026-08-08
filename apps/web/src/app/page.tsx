import { ResumeLink } from "@/components/resume-link";

export default function Home() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="wordmark" href="/">
          wtfiwant<span>.</span>
        </a>
        <a href="#what-this-is">What this is</a>
      </nav>
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
      <section className="positioning" id="what-this-is">
        <div className="positioning-lead">
          <p className="eyebrow">NOT ANOTHER PERSONALITY TEST</p>
          <h2>
            Stop. Understand.
            <br />
            <em>Then start.</em>
          </h2>
        </div>
        <div className="positioning-grid">
          <article>
            <span>01</span>
            <h3>Look at evidence</h3>
            <p>
              Real moments when you felt alive, not abstract values you think
              you should choose.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Cut through noise</h3>
            <p>
              Separate what you want from what parents, status, LinkedIn, or
              Instagram taught you to want.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Pay the price</h3>
            <p>
              Choose between competing goods. Every life has a cost; vague
              preference is cheap.
            </p>
          </article>
          <article>
            <span>04</span>
            <h3>Do one real thing</h3>
            <p>
              Turn the pattern into a reversible experiment and a next action
              small enough to begin.
            </p>
          </article>
        </div>
      </section>
      <section className="landing-facts">
        <div>
          <strong>20–30</strong>
          <span>minutes, roughly</span>
        </div>
        <div>
          <strong>0</strong>
          <span>right answers</span>
        </div>
        <div>
          <strong>AI</strong>
          <span>finds patterns, not diagnoses</span>
        </div>
        <div>
          <strong>NO</strong>
          <span>account required</span>
        </div>
      </section>
      <section className="landing-close">
        <p className="eyebrow light">A SERIOUS QUESTION. A USEFUL ANSWER.</p>
        <h2>
          Not what your parents want.
          <br />
          Not what success looks like online.
          <br />
          <em>What do you want your life to feel like?</em>
        </h2>
        <a className="paper-button" href="/commitment">
          Give it twenty minutes <span>→</span>
        </a>
        <p className="disclaimer">
          This is guided reflection, not psychological diagnosis, therapy, or
          crisis support.
        </p>
      </section>
    </main>
  );
}
