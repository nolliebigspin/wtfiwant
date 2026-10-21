import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import {
  PostgresAnalyticsStore,
  type StoredEvent,
} from "../src/analytics/store";

// Explicit opt-in; never run integration tests against the app's default DB.
const url = process.env.ANALYTICS_TEST_DATABASE_URL;
describe("Umami PostgreSQL delivery boundary", () => {
  test.skipIf(!url)(
    "queues conversions atomically, retries delivery, and serializes concurrent drains",
    async () => {
      if (!url) throw new Error("Explicit test database URL is required");
      const admin = postgres(url, { max: 1 });
      const schema = `analytics_test_${crypto.randomUUID().replaceAll("-", "")}`;
      await admin.unsafe(`CREATE SCHEMA ${schema}`);
      const sql = postgres(url, {
        max: 4,
        connection: { search_path: schema },
      });
      const sent: StoredEvent[] = [];
      let offline = true;
      const store = new PostgresAnalyticsStore(
        sql,
        "independent-test-secret-at-least-32-characters",
        {
          send: async (event) => {
            if (offline) throw new Error("test offline");
            sent.push(event);
          },
        },
      );
      try {
        for (const file of ["0007_analytics.sql", "0008_umami_outbox.sql"])
          await sql.unsafe(
            await readFile(
              new URL(`../migrations/${file}`, import.meta.url),
              "utf8",
            ),
          );
        const context = {
          visitId: crypto.randomUUID(),
          attribution: { source: "meta", campaign: "launch_de" },
        };
        const event = {
          ...context,
          id: crypto.randomUUID(),
          name: "preview_viewed" as const,
          page: "result" as const,
          locale: "de" as const,
        };
        await Promise.all([store.record(event), store.record(event)]);
        await Promise.all([
          store.checkout("cs_private", context, "de"),
          store.checkout("cs_private", context, "de"),
        ]);
        await Promise.all([
          store.purchase("cs_private", 1900, "eur"),
          store.purchase("cs_private", 1900, "eur"),
        ]);
        expect(await sql`SELECT id FROM analytics_events`).toHaveLength(3);
        await store.flush();
        expect(sent).toHaveLength(0);
        expect(
          await sql`SELECT id FROM analytics_events WHERE attempts = 1 AND delivered_at IS NULL AND retry_at > now()`,
        ).toHaveLength(3);
        offline = false;
        await sql`UPDATE analytics_events SET retry_at = now()`;
        await Promise.all([store.flush(), store.flush()]);
        expect(sent).toHaveLength(3);
        expect(sent.filter((event) => event.name === "purchase")).toHaveLength(
          1,
        );
        expect(sent.find((event) => event.name === "purchase")).toMatchObject({
          amountCents: 1900,
          currency: "EUR",
          attribution: context.attribution,
        });
        await store.flush();
        expect(sent).toHaveLength(3);

        // Withdrawal deletes pending events and prevents delayed consented writes.
        await store.forget(context.visitId);
        await store.record({ ...event, id: crypto.randomUUID() });
        await store.checkout("cs_late", context, "de");
        await store.purchase("cs_late", 1900, "eur");
        expect(await sql`SELECT id FROM analytics_events`).toHaveLength(0);
        expect(
          await sql`SELECT checkout_hash FROM analytics_checkouts`,
        ).toHaveLength(0);
      } finally {
        await store.close();
        await admin.unsafe(`DROP SCHEMA ${schema} CASCADE`);
        await admin.end();
      }
    },
  );
});
