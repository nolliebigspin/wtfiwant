import { merchant, type WithdrawalReceipt } from "@wtfiwant/shared";
import { Resend } from "resend";
import { renderCompassPdf } from "../report/pdf";
import type { EmailDeliveryProvider, FullCompassEmail } from "./provider";
import { renderFullCompassEmail } from "./report";
import { withdrawalConfirmation } from "./withdrawal";

export class ResendEmailDeliveryProvider implements EmailDeliveryProvider {
  private readonly resend: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async sendFullCompass(input: FullCompassEmail) {
    const report = renderFullCompassEmail(
      input.analysis.result,
      input.locale,
      input.resultUrl,
      input.evidence,
      input.purchase,
    );
    const pdf = await renderCompassPdf(
      input.analysis.result,
      input.locale,
      input.evidence,
      input.actionPlan,
    );
    const { data, error } = await this.resend.emails.send(
      {
        from: this.from,
        to: input.to,
        subject: report.subject,
        html: report.html,
        text: report.text,
        attachments: [
          {
            filename: `wtfiwant-compass-${input.locale}.pdf`,
            content: pdf,
            contentType: "application/pdf",
          },
        ],
      },
      { idempotencyKey: input.idempotencyKey },
    );
    if (error || !data) throw new Error("Email provider rejected delivery");
    return { messageId: data.id };
  }

  async sendWithdrawalConfirmation(input: WithdrawalReceipt) {
    const { data, error } = await this.resend.emails.send(
      {
        from: this.from,
        to: input.email,
        bcc: merchant.email,
        ...withdrawalConfirmation(input),
      },
      { idempotencyKey: `withdrawal/${input.requestId}` },
    );
    if (error || !data) throw new Error("Email provider rejected delivery");
    return { messageId: data.id };
  }
}
