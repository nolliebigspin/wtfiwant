import { chapters } from "@wtfiwant/shared";

export function ChapterProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <nav className="chapter-progress" aria-label="Reflection chapters">
      {chapters.map((chapter, index) => (
        <span
          key={chapter.id}
          className={
            index === activeIndex
              ? "active"
              : index < activeIndex
                ? "complete"
                : ""
          }
        >
          {index < activeIndex ? "✓" : chapter.label}
        </span>
      ))}
    </nav>
  );
}
