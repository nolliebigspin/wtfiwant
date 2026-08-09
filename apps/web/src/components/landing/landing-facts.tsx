import { useTranslations } from "next-intl";

export function LandingFacts() {
  const t = useTranslations("Landing");
  const facts = [
    ["20–30", t("facts.minutes")],
    ["0", t("facts.answers")],
    ["AI", t("facts.ai")],
    [t("facts.no"), t("facts.account")],
  ];
  return (
    <section className="grid grid-cols-4 border-b border-ink/20 max-[800px]:grid-cols-2">
      {facts.map(([value, label]) => (
        <div
          className="flex min-h-52 flex-col justify-between border-r border-ink/20 p-8 max-[800px]:min-h-36"
          key={label}
        >
          <strong className="text-[clamp(2.7rem,5vw,5rem)] tracking-[-0.08em]">
            {value}
          </strong>
          <span className="text-xs font-extrabold tracking-[0.1em] text-muted uppercase">
            {label}
          </span>
        </div>
      ))}
    </section>
  );
}
