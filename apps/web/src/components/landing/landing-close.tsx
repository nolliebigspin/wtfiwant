import { eyebrowBaseClassName } from "@/lib/styles";

export function LandingClose() {
  return (
    <section className="bg-accent px-[clamp(1.2rem,7vw,8rem)] py-[clamp(5rem,9vw,9rem)] text-ink">
      <p className={eyebrowBaseClassName}>
        A SERIOUS QUESTION. A USEFUL ANSWER.
      </p>
      <h2 className="m-0 max-w-[17ch] text-[clamp(2.8rem,5vw,5.8rem)] leading-[0.95] tracking-[-0.065em]">
        Not what your parents want.
        <br />
        Not what success looks like online.
        <br />
        <em className="font-[Georgia,serif] font-normal">
          What do you want your life to feel like?
        </em>
      </h2>
      <a
        className="mt-12 inline-flex items-center gap-12 rounded-full bg-paper px-[1.8rem] py-[1.2rem] font-black text-ink no-underline transition-transform hover:-translate-y-0.5 active:translate-y-0"
        href="/commitment"
      >
        Give it twenty minutes <span>→</span>
      </a>
      <p className="mt-16 mb-0 text-[0.7rem] opacity-70">
        This is guided reflection, not psychological diagnosis, therapy, or
        crisis support.
      </p>
    </section>
  );
}
