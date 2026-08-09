type PrivacyActionsProps = {
  sessionId: string;
  onDelete: (sessionId: string) => Promise<void>;
};

export function PrivacyActions({ sessionId, onDelete }: PrivacyActionsProps) {
  const deleteReflection = async () => {
    if (
      !window.confirm(
        "Delete this reflection and every answer? This cannot be undone.",
      )
    )
      return;

    await onDelete(sessionId);
    localStorage.removeItem("wtfiwant.sessionId");
    window.location.assign("/");
  };

  return (
    <section className="flex justify-between border-t border-ink/17 px-[clamp(1.2rem,9vw,9rem)] pt-8 pb-16 text-[0.7rem] text-muted max-[800px]:flex-col max-[800px]:items-start max-[800px]:gap-4">
      <p>
        Your reflections can be deeply personal. We only use them to generate
        your result.
      </p>
      <button
        className="cursor-pointer border-0 bg-transparent text-[#a22d19] underline underline-offset-2"
        type="button"
        onClick={deleteReflection}
      >
        Delete my reflection
      </button>
    </section>
  );
}
