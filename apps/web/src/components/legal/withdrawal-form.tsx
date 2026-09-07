"use client";

import {
  type Locale,
  type WithdrawalInput,
  withdrawalInputSchema,
  withdrawalResponseSchema,
} from "@wtfiwant/shared";
import { useRef, useState } from "react";
import { fieldControlClassName, primaryButtonClassName } from "@/lib/styles";

async function sendWithdrawal(input: WithdrawalInput) {
  const response = await fetch("/api/withdrawals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Withdrawal submission failed");
  return withdrawalResponseSchema.parse(await response.json());
}

export function WithdrawalForm({
  locale,
  submit = sendWithdrawal,
}: {
  locale: Locale;
  submit?: typeof sendWithdrawal;
}) {
  const de = locale === "de";
  const [draft, setDraft] = useState<WithdrawalInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [receipt, setReceipt] = useState<{
    receivedAt: string;
    confirmationSent: boolean;
  } | null>(null);
  const submitting = useRef(false);
  const attempted = useRef(false);
  const inputClass = `mt-2 ${fieldControlClassName}`;
  const buttonClass = primaryButtonClassName;

  async function confirm() {
    if (!draft || submitting.current) return;
    submitting.current = true;
    attempted.current = true;
    setBusy(true);
    setError(false);
    try {
      setReceipt(await submit(draft));
    } catch {
      setError(true);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (receipt)
    return (
      <section
        aria-live="polite"
        className="space-y-5 rounded-2xl border border-ink/20 p-6"
      >
        <h2 className="text-xl font-bold">
          {de ? "Widerruf eingegangen" : "Withdrawal received"}
        </h2>
        <p>
          {de ? "Eingang (UTC)" : "Received (UTC)"}: {receipt.receivedAt}
        </p>
        <p>
          {de ? "Referenz" : "Reference"}: {draft?.requestId}
        </p>
        <p>
          {receipt.confirmationSent
            ? de
              ? "Die Eingangsbestätigung wurde an deine E-Mail-Adresse gesendet. Wir prüfen deinen Widerruf und melden uns zur Abwicklung."
              : "A receipt has been sent to your email address. We will review your withdrawal and contact you about processing it."
            : de
              ? "Dein Widerruf ist gespeichert. Die Bestätigungsmail konnte noch nicht gesendet werden. Du kannst den Versand erneut versuchen; der Eingangszeitpunkt bleibt unverändert."
              : "Your withdrawal is saved. The confirmation email could not yet be sent. You can retry delivery; your original receipt time will remain unchanged."}
        </p>
        {!receipt.confirmationSent && (
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={confirm}
          >
            {de ? "Bestätigung erneut senden" : "Retry confirmation email"}
          </button>
        )}
        {error && (
          <p role="alert">
            {de
              ? "Erneuter Versand fehlgeschlagen. Bitte kontaktiere contact@awinter.dev mit deiner Referenz."
              : "Retry failed. Please contact contact@awinter.dev with your reference."}
          </p>
        )}
      </section>
    );

  if (draft)
    return (
      <section className="space-y-5 rounded-2xl border border-ink/20 p-6">
        <h2 className="text-xl font-bold">
          {de ? "Widerruf prüfen" : "Review withdrawal"}
        </h2>
        <dl className="space-y-2 break-words">
          <dt className="font-bold">Name</dt>
          <dd>{draft.name}</dd>
          <dt className="font-bold">Email</dt>
          <dd>{draft.email}</dd>
          <dt className="font-bold">{de ? "Vertrag" : "Contract"}</dt>
          <dd>{draft.contractReference}</dd>
        </dl>
        <p>
          {de
            ? "Hiermit widerrufe ich den oben bezeichneten Vertrag."
            : "I hereby withdraw from the contract identified above."}
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={confirm}
          >
            {busy
              ? de
                ? "Wird übermittelt …"
                : "Submitting …"
              : de
                ? "Widerruf bestätigen"
                : "Confirm withdrawal"}
          </button>
          {!attempted.current && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setDraft(null)}
            >
              {de ? "Angaben ändern" : "Edit details"}
            </button>
          )}
        </div>
        {error && (
          <p role="alert">
            {de
              ? "Der Eingang konnte nicht bestätigt werden. Bitte versuche es erneut oder sende deinen Widerruf an contact@awinter.dev."
              : "We could not confirm receipt. Please retry or email your withdrawal to contact@awinter.dev."}
          </p>
        )}
      </section>
    );

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const input = withdrawalInputSchema.safeParse({
          requestId: crypto.randomUUID(),
          locale,
          name: data.get("name"),
          email: data.get("email"),
          contractReference: data.get("contractReference"),
        });
        if (input.success) {
          setDraft(input.data);
          setError(false);
        } else setError(true);
      }}
    >
      <label className="block">
        {de ? "Vollständiger Name" : "Full name"}
        <input
          name="name"
          autoComplete="name"
          required
          maxLength={200}
          className={inputClass}
        />
      </label>
      <label className="block">
        {de
          ? "E-Mail-Adresse für die Eingangsbestätigung"
          : "Email address for your receipt"}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className={inputClass}
        />
      </label>
      <label className="block">
        {de
          ? "Welchen Vertrag möchtest du widerrufen?"
          : "Which contract do you want to withdraw from?"}
        <textarea
          name="contractReference"
          required
          maxLength={500}
          className={inputClass}
          aria-describedby="contract-help"
        />
      </label>
      <p id="contract-help" className="text-sm text-muted">
        {de
          ? "Nenne z. B. die Bestellreferenz aus deiner Bestätigungsmail oder Kaufdatum und beim Kauf verwendete E-Mail-Adresse. Keine Kartendaten oder Reflexionsantworten."
          : "For example, give the order reference from your confirmation email, or the purchase date and email used at Checkout. Do not include card details or reflection answers."}
      </p>
      <button type="submit" className={buttonClass}>
        {de ? "Weiter zur Bestätigung" : "Continue to confirmation"}
      </button>
      {error && (
        <p role="alert">
          {de ? "Bitte prüfe deine Angaben." : "Please check your details."}
        </p>
      )}
    </form>
  );
}
