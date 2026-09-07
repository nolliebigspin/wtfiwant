import { merchant, type WithdrawalReceipt } from "@wtfiwant/shared";

export function withdrawalConfirmation(input: WithdrawalReceipt) {
  const de = input.locale === "de";
  return {
    subject: de
      ? "Eingangsbestätigung deines Widerrufs"
      : "Receipt of your withdrawal",
    text: [
      de
        ? "Deine Widerrufserklärung ist bei uns eingegangen."
        : "We have received your withdrawal declaration.",
      `${de ? "Empfänger" : "Recipient"}: ${merchant.name} (${merchant.email})`,
      `${de ? "Name" : "Name"}: ${input.name}`,
      `Email: ${input.email}`,
      `${de ? "Vertrag" : "Contract"}: ${input.contractReference}`,
      de
        ? "Erklärung: Hiermit widerrufe ich den oben bezeichneten Vertrag."
        : "Declaration: I hereby withdraw from the contract identified above.",
      `${de ? "Eingang (UTC)" : "Received (UTC)"}: ${input.receivedAt}`,
      `${de ? "Referenz" : "Reference"}: ${input.requestId}`,
      de
        ? "Dies bestätigt den Eingang deiner Erklärung. Wir prüfen die gesetzlichen Voraussetzungen und melden uns zur Abwicklung. Diese Bestätigung ist keine Zusage einer freiwilligen Erstattung."
        : "This confirms receipt of your declaration. We will review the statutory requirements and contact you about processing it. This receipt is not a promise of a voluntary refund.",
    ].join("\n\n"),
  };
}
