import { Resend } from "resend";
import type { EmailDeliveryProvider, FullCompassEmail } from "./provider";
import { renderFullCompassEmail } from "./report";

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
    );
    const { data, error } = await this.resend.emails.send(
      {
        from: this.from,
        to: input.to,
        subject: report.subject,
        html: report.html,
        text: report.text,
      },
      { idempotencyKey: input.idempotencyKey },
    );
    if (error || !data) throw new Error("Email provider rejected delivery");
    return { messageId: data.id };
  }
}
