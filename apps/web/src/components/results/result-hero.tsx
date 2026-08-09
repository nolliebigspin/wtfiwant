import type { Analysis } from "@wtfiwant/shared";
import { eyebrowClassName } from "@/lib/styles";

export function ResultHero({ summary }: { summary: Analysis["summary"] }) {
  return (
    <section className="flex min-h-[88vh] flex-col justify-center px-[clamp(1.2rem,12vw,13rem)] py-[clamp(5rem,10vw,10rem)]">
      <p className={eyebrowClassName}>YOUR ANSWERS, READ BACK CAREFULLY</p>
      <h1 className="m-0 text-[clamp(4rem,10vw,11rem)] leading-[0.8] tracking-[-0.09em]">
        Your Compass
      </h1>
      <p className="mt-10 mb-20 max-w-[35rem] font-[Georgia,serif] text-lg leading-relaxed text-muted italic">
        This isn't who you are. It's our best interpretation of what you told
        us. Keep what feels true. Challenge what doesn't.
      </p>
      <p className="mr-0 ml-auto max-w-[50rem] text-[clamp(1.5rem,2.7vw,3rem)] leading-tight font-bold tracking-[-0.035em]">
        {summary}
      </p>
    </section>
  );
}
