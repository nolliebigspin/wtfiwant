import { chapters } from "@wtfiwant/shared";

export function ChapterProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <nav
      className="flex justify-center gap-[clamp(0.6rem,2vw,2.3rem)] overflow-hidden border-b border-ink/12 p-[1.1rem] max-[800px]:justify-start"
      aria-label="Reflection chapters"
    >
      {chapters.map((chapter, index) => (
        <span
          key={chapter.id}
          className={`text-[0.55rem] font-black tracking-[0.11em] whitespace-nowrap ${
            index === activeIndex
              ? "text-accent-ink"
              : index < activeIndex
                ? "text-ink"
                : "text-ink/30"
          }`}
        >
          {index < activeIndex ? "✓" : chapter.label}
        </span>
      ))}
    </nav>
  );
}
