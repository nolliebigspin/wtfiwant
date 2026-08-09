import { ResumeLink } from "@/components/resume-link";
import { eyebrowClassName, largePrimaryButtonClassName } from "@/lib/styles";

export function LandingHero() {
  return (
    <section className="grid min-h-[calc(100vh-5rem)] grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] items-center gap-16 px-[clamp(1.2rem,7vw,8rem)] py-[clamp(4rem,8vw,8rem)] max-[800px]:min-h-auto max-[800px]:grid-cols-1">
      <div>
        <p className={eyebrowClassName}>A 20–30 MINUTE GUIDED REFLECTION</p>
        <h1 className="m-0 max-w-[12ch] text-[clamp(3.6rem,7.4vw,8.5rem)] leading-[0.85] font-black tracking-[-0.075em]">
          What the fuck do I{" "}
          <em className="font-[Georgia,serif] font-normal text-accent-ink">
            actually
          </em>{" "}
          want?
        </h1>
        <div className="my-10 max-w-[38rem] text-[clamp(1rem,1.4vw,1.25rem)] leading-[1.55] [&_p]:my-1">
          <p>You spend years optimizing your life.</p>
          <p>Career. Money. Relationships. Fitness. Productivity.</p>
          <p>
            But when did you last ask whether you're optimizing for a life you
            actually want?
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <a className={largePrimaryButtonClassName} href="/commitment">
            Figure it out <span className="text-xl">↗</span>
          </a>
          <ResumeLink />
        </div>
      </div>
      <div
        className="relative aspect-square w-full max-w-[34rem] justify-self-center max-[800px]:max-w-[23rem]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 grid animate-[slow-spin_38s_linear_infinite] place-items-center rounded-full border border-ink/30">
          <span className="absolute top-2 bg-paper px-2.5 py-[0.2rem] text-[0.56rem] font-black tracking-[0.17em]">
            OTHER PEOPLE
          </span>
        </div>
        <div className="absolute inset-[17%] grid animate-[slow-spin_29s_linear_infinite] place-items-center rounded-full border border-ink/30 [animation-direction:reverse]">
          <span className="absolute top-2 bg-paper px-2.5 py-[0.2rem] text-[0.56rem] font-black tracking-[0.17em]">
            EXPECTATIONS
          </span>
        </div>
        <div className="absolute inset-[36%] grid place-items-center rounded-full border border-accent bg-accent text-ink">
          <b className="text-[clamp(1.2rem,3vw,2.5rem)] tracking-[-0.06em]">
            YOU
          </b>
        </div>
      </div>
    </section>
  );
}
