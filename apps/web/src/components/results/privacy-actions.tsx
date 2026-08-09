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
    <section className="privacy-actions">
      <p>
        Your reflections can be deeply personal. We only use them to generate
        your result.
      </p>
      <button type="button" onClick={deleteReflection}>
        Delete my reflection
      </button>
    </section>
  );
}
