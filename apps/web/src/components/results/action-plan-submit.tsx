type ActionPlanSubmitProps = {
  saving: boolean;
  done: boolean;
};

export function ActionPlanSubmit({ saving, done }: ActionPlanSubmitProps) {
  return (
    <div className="mt-12 flex flex-wrap items-center gap-6">
      <p className="mr-auto max-w-[25rem] text-muted">
        Motivation may show up after you begin. Make beginning smaller.
      </p>
      <button
        className="min-h-[4.3rem] cursor-pointer rounded-full border-0 bg-accent px-9 py-4 font-black text-ink transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0"
        disabled={saving}
        type="submit"
      >
        {saving ? "Starting…" : "Start now"}
      </button>
      {done ? (
        <strong className="basis-full text-[#4b662e]">
          Started. Not solved — started.
        </strong>
      ) : null}
    </div>
  );
}
