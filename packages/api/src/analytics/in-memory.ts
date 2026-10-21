import type {
  AnalyticsContext,
  AnalyticsEvent,
  Locale,
} from "@wtfiwant/shared";
import type { AnalyticsStore, StoredEvent } from "./store";
import type { AnalyticsDestination } from "./umami";

export class InMemoryAnalyticsStore implements AnalyticsStore {
  readonly rows: StoredEvent[] = [];
  private readonly delivered = new Set<string>();
  constructor(private readonly destination?: AnalyticsDestination) {}
  private readonly revoked = new Set<string>();
  private readonly checkouts = new Map<
    string,
    { context: AnalyticsContext; locale: Locale; converted: boolean }
  >();
  async record(event: AnalyticsEvent) {
    if (
      !this.revoked.has(event.visitId) &&
      !this.rows.some((row) => row.id === event.id)
    )
      this.rows.push({ ...event, createdAt: new Date().toISOString() });
  }
  async checkout(id: string, context: AnalyticsContext, locale: Locale) {
    if (this.revoked.has(context.visitId) || this.checkouts.has(id)) return;
    this.checkouts.set(id, { context, locale, converted: false });
    this.rows.push({
      ...context,
      id: crypto.randomUUID(),
      name: "checkout_started",
      page: "result",
      locale,
      createdAt: new Date().toISOString(),
    });
  }
  async purchase(id: string, amount: number | null, currency: string | null) {
    const checkout = this.checkouts.get(id);
    if (
      !checkout ||
      checkout.converted ||
      this.revoked.has(checkout.context.visitId)
    )
      return;
    checkout.converted = true;
    this.rows.push({
      ...checkout.context,
      id: crypto.randomUUID(),
      name: "purchase",
      page: "result",
      locale: checkout.locale,
      amountCents: amount ?? undefined,
      currency: currency ?? undefined,
      createdAt: new Date().toISOString(),
    });
  }
  async forget(visitId: string) {
    this.revoked.add(visitId);
    for (let index = this.rows.length - 1; index >= 0; index--)
      if (this.rows[index].visitId === visitId) this.rows.splice(index, 1);
    for (const [id, row] of this.checkouts)
      if (row.context.visitId === visitId) this.checkouts.delete(id);
  }
  async flush() {
    if (!this.destination) return;
    for (const row of this.rows) {
      if (this.delivered.has(row.id)) continue;
      await this.destination.send(row);
      this.delivered.add(row.id);
    }
  }
}
