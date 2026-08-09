type ActionPlanSubmitProps = {
  saving: boolean;
  done: boolean;
};

export function ActionPlanSubmit({ saving, done }: ActionPlanSubmitProps) {
  return (
    <div className="start-submit">
      <p>Motivation may show up after you begin. Make beginning smaller.</p>
      <button className="start-button" disabled={saving} type="submit">
        {saving ? "Starting…" : "Start now"}
      </button>
      {done ? (
        <strong className="started-message">
          Started. Not solved — started.
        </strong>
      ) : null}
    </div>
  );
}
