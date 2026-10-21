import { createHmac } from "node:crypto";
import type {
  AnalyticsContext,
  AnalyticsEvent,
  Locale,
} from "@wtfiwant/shared";
import postgres, { type Sql } from "postgres";
import type { AnalyticsDestination } from "./umami";

export type StoredEvent = Omit<AnalyticsEvent, "name" | "page"> & {
  name: AnalyticsEvent["name"] | "checkout_started" | "purchase";
  page: AnalyticsEvent["page"];
  amountCents?: number;
  currency?: string;
  createdAt: string;
};
export interface AnalyticsStore {
  record(event: AnalyticsEvent): Promise<void>;
  checkout(
    checkoutId: string,
    context: AnalyticsContext,
    locale: Locale,
  ): Promise<void>;
  purchase(
    checkoutId: string,
    amountCents: number | null,
    currency: string | null,
  ): Promise<void>;
  forget(visitId: string): Promise<void>;
  flush(): Promise<void>;
}

export class PostgresAnalyticsStore implements AnalyticsStore {
  private nextPrune = 0;
  constructor(
    private readonly sql: Sql,
    private readonly secret: string,
    private readonly destination: AnalyticsDestination,
  ) {}
  static connect(
    url: string,
    secret: string,
    destination: AnalyticsDestination,
  ) {
    return new PostgresAnalyticsStore(
      postgres(url, {
        max: 2,
        connect_timeout: 3,
        connection: { statement_timeout: 2000 },
      }),
      secret,
      destination,
    );
  }
  private hash(checkoutId: string) {
    return createHmac("sha256", this.secret).update(checkoutId).digest("hex");
  }
  private async transaction<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
    // All writers and revocation use the same lock; opt-out wins over delayed events.
    return this.sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(7824193)`;
      if (Date.now() >= this.nextPrune) {
        await pruneAnalytics(tx as unknown as Sql);
        this.nextPrune = Date.now() + 3600_000;
      }
      return work(tx as unknown as Sql);
    }) as Promise<T>;
  }
  async record(event: AnalyticsEvent) {
    await this.transaction(async (sql) => {
      await sql`INSERT INTO analytics_events (id, visit_id, name, page, locale, step, attribution)
        SELECT ${event.id}, ${event.visitId}, ${event.name}, ${event.page}, ${event.locale}, ${event.step ?? null}, ${sql.json(event.attribution)}
        WHERE NOT EXISTS (SELECT 1 FROM analytics_revocations WHERE visit_id = ${event.visitId})
        AND (SELECT count(*) FROM analytics_events WHERE visit_id = ${event.visitId}) < 500
        ON CONFLICT (id) DO NOTHING`;
    });
  }
  async checkout(
    checkoutId: string,
    context: AnalyticsContext,
    locale: Locale,
  ) {
    await this.transaction(async (sql) => {
      const rows =
        await sql`INSERT INTO analytics_checkouts (checkout_hash, visit_id, attribution, locale)
        SELECT ${this.hash(checkoutId)}, ${context.visitId}, ${sql.json(context.attribution)}, ${locale}
        WHERE NOT EXISTS (SELECT 1 FROM analytics_revocations WHERE visit_id = ${context.visitId})
        ON CONFLICT (checkout_hash) DO NOTHING RETURNING checkout_hash`;
      if (rows.length)
        await sql`INSERT INTO analytics_events(id, visit_id, name, page, locale, attribution)
        VALUES (${crypto.randomUUID()}, ${context.visitId}, 'checkout_started', 'result', ${locale}, ${sql.json(context.attribution)})`;
    });
  }
  async purchase(
    checkoutId: string,
    amountCents: number | null,
    currency: string | null,
  ) {
    await this.transaction(async (sql) => {
      const rows = await sql`UPDATE analytics_checkouts SET converted = true
        WHERE checkout_hash = ${this.hash(checkoutId)} AND converted = false
        AND NOT EXISTS (SELECT 1 FROM analytics_revocations WHERE visit_id = analytics_checkouts.visit_id)
        RETURNING visit_id, attribution, locale`;
      if (rows[0])
        await sql`INSERT INTO analytics_events(id, visit_id, name, page, locale, attribution, amount_cents, currency)
        VALUES (${crypto.randomUUID()}, ${rows[0].visit_id}, 'purchase', 'result', ${rows[0].locale}, ${sql.json(rows[0].attribution)}, ${amountCents}, ${currency && /^[a-z]{3}$/i.test(currency) ? currency.toUpperCase() : null})`;
    });
  }
  async forget(visitId: string) {
    await this.transaction(async (sql) => {
      await sql`INSERT INTO analytics_revocations(visit_id) VALUES (${visitId}) ON CONFLICT DO NOTHING`;
      await sql`DELETE FROM analytics_events WHERE visit_id = ${visitId}`;
      await sql`DELETE FROM analytics_checkouts WHERE visit_id = ${visitId}`;
    });
  }
  async flush() {
    // Row locks prevent concurrent requests/workers from sending the same row.
    // No network call occurs on the payment path or under the ingestion lock.
    await this.sql.begin(async (tx) => {
      await tx`SET LOCAL statement_timeout = '5000ms'`;
      const rows = await tx`SELECT * FROM analytics_events
        WHERE delivered_at IS NULL AND retry_at <= now()
          AND created_at > now() - interval '7 days'
        ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED`;
      await Promise.all(
        rows.map(async (row) => {
          const event: StoredEvent = {
            id: row.id,
            visitId: row.visit_id,
            name: row.name,
            page: row.page,
            locale: row.locale,
            step: row.step ?? undefined,
            attribution: row.attribution,
            amountCents: row.amount_cents ?? undefined,
            currency: row.currency ?? undefined,
            createdAt: row.created_at.toISOString(),
          };
          try {
            await this.destination.send(event);
            await tx`UPDATE analytics_events SET delivered_at = now() WHERE id = ${row.id}`;
          } catch {
            await tx`UPDATE analytics_events SET attempts = attempts + 1,
            retry_at = now() + interval '1 minute' * LEAST(60, power(2, LEAST(attempts, 6)))
            WHERE id = ${row.id}`;
            console.error("Umami event delivery delayed; retry queued");
          }
        }),
      );
    });
  }
  async close() {
    await this.sql.end();
  }
}

/** Analytics must never prevent answering, paying or receiving a report. */
export async function analyticsBestEffort(
  work: (() => Promise<unknown>) | undefined,
) {
  try {
    await work?.();
  } catch {
    console.error("Optional analytics unavailable");
  }
}

export async function pruneAnalytics(sql: Sql) {
  await sql`DELETE FROM analytics_events WHERE created_at < now() - interval '7 days'`;
  await sql`DELETE FROM analytics_checkouts WHERE created_at < now() - interval '30 days'`;
  await sql`DELETE FROM analytics_revocations WHERE created_at < now() - interval '30 days'`;
}
