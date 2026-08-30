import type { EmailDeliveryProvider, FullCompassEmail } from "./provider";

/** Development-only capture adapter. It never sends or logs private content. */
export class LocalEmailDeliveryProvider implements EmailDeliveryProvider {
  readonly sent: FullCompassEmail[] = [];

  async sendFullCompass(input: FullCompassEmail) {
    this.sent.push(structuredClone(input));
    return { messageId: `local_${crypto.randomUUID()}` };
  }
}
