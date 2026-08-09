import { SeedButtons } from "@/components/seed-buttons";
import { StartReflectionButton } from "@/components/start-reflection-button";
import { eyebrowClassName } from "@/lib/styles";

export function CommitmentCard() {
  return (
    <section className="mx-auto my-[5vh] max-w-[53rem]">
      <p className={eyebrowClassName}>BEFORE YOU BEGIN</p>
      <h1 className="m-0 text-[clamp(3.5rem,8vw,7rem)] leading-[0.9] tracking-[-0.08em]">
        Give this 20 minutes.
      </h1>
      <div className="my-12 border-l-[3px] border-accent pl-6 text-lg leading-[1.45] [&_p]:my-1 [&_p]:text-muted">
        <p>This isn't a personality test.</p>
        <p>There are no right answers.</p>
        <p>Don't answer as the person you think you should be.</p>
        <strong className="mt-2 block">Answer as yourself.</strong>
      </div>
      <CommitmentChecklist />
      <div className="flex items-center gap-8 max-[520px]:flex-col max-[520px]:items-start [&>a]:text-sm [&>a]:text-muted">
        <StartReflectionButton />
        <a href="/">I'll do this later</a>
      </div>
      <aside className="mt-12 flex gap-8 rounded-2xl border border-ink/15 p-5">
        <span className="text-[0.65rem] font-black tracking-[0.13em] text-accent-ink">
          PRIVATE BY DEFAULT
        </span>
        <p className="m-0 text-[0.8rem] text-muted">
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
    <ul className="my-12 grid list-none grid-cols-3 p-0 max-[800px]:grid-cols-1">
      <li className="border-t border-ink/20 py-4 pr-3 font-bold">
        <span className="mb-8 block text-[0.65rem] text-accent-ink max-[800px]:mr-4 max-[800px]:mb-0 max-[800px]:inline">
          01
        </span>{" "}
        Put the phone away
      </li>
      <li className="border-t border-ink/20 py-4 pr-3 font-bold">
        <span className="mb-8 block text-[0.65rem] text-accent-ink max-[800px]:mr-4 max-[800px]:mb-0 max-[800px]:inline">
          02
        </span>{" "}
        Find somewhere quiet
      </li>
      <li className="border-t border-ink/20 py-4 pr-3 font-bold">
        <span className="mb-8 block text-[0.65rem] text-accent-ink max-[800px]:mr-4 max-[800px]:mb-0 max-[800px]:inline">
          03
        </span>{" "}
        Don't rush
      </li>
    </ul>
  );
}
