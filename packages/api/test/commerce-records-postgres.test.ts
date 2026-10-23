import { expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import {
  createDigitalPurchaseAgreement,
  JOURNEY_VERSION,
} from "@wtfiwant/shared";
import postgres from "postgres";
import { PostgresAIJobStore } from "../src/journey/postgres";
import { PostgresAssessmentRepository } from "../src/repositories/postgres";

const url = process.env.PAID_JOURNEY_TEST_DATABASE_URL;
test.skipIf(!url)(
  "PostgreSQL legal migration, durable mail leases and refund ordering preserve privacy and entitlements",
  async () => {
    if (!url) throw Error("Isolated test database required");
    const admin = postgres(url, { max: 1 });
    const schema = `commerce_test_${crypto.randomUUID().replaceAll("-", "")}`;
    await admin.unsafe(`CREATE SCHEMA ${schema}`);
    const sql = postgres(url, { max: 6, connection: { search_path: schema } });
    try {
      const directory = new URL("../migrations/", import.meta.url);
      const migrations = (await readdir(directory))
        .filter((name) => name.endsWith(".sql"))
        .sort();
      for (const file of migrations.filter((name) => name < "0011"))
        await sql.unsafe(await readFile(new URL(file, directory), "utf8"));
      const repository = new PostgresAssessmentRepository(sql);
      const old = await repository.createSession();
      const agreement = createDigitalPurchaseAgreement("de");
      delete agreement.confirmationBeforeAI;
      await repository.saveCheckout(
        old.session.id,
        { id: "cs_test_legacy", url: "https://stripe.test/legacy" },
        agreement,
      );
      await sql`UPDATE report_purchases SET status = 'paid', stripe_payment_intent_id = 'pi_legacy', recipient_email = 'legacy@example.com',
      amount_total = 1900, currency = 'eur', paid_at = now(), consent_recorded_at = now() WHERE session_id = ${old.session.id}`;
      for (const file of migrations.filter((name) => name >= "0011"))
        await sql.unsafe(await readFile(new URL(file, directory), "utf8"));
      expect(
        (await repository.commerce.getPurchase("cs_test_legacy"))?.agreement
          ?.locale,
      ).toBe("de");
      expect(await repository.commerce.claimNotification()).toBeNull(); // No historical customer spam.

      const record = await repository.createSession();
      await repository.saveAnswer(
        record.session.id,
        "life.chosen",
        "FICTIONAL_PRIVATE_ANSWER",
      );
      await repository.saveCheckout(
        record.session.id,
        { id: "cs_test_current", url: "https://stripe.test/current" },
        createDigitalPurchaseAgreement("de"),
      );
      const payment = {
        checkoutSessionId: "cs_test_current",
        paymentIntentId: "pi_current",
        recipientEmail: "current@example.com",
        amountTotal: 1900,
        currency: "eur",
        consentRecordedAt: new Date().toISOString(),
      };
      const purchase = await repository.markPurchasePaid(payment);
      if (!purchase) throw Error("Missing purchase");
      const original = await repository.commerce.getPurchase(
        payment.checkoutSessionId,
      );
      expect(JSON.stringify(original)).not.toContain(
        "FICTIONAL_PRIVATE_ANSWER",
      );
      expect(JSON.stringify(original)).not.toContain(record.session.id);
      const jobs = new PostgresAIJobStore(sql);
      await jobs.enqueue(record.session.id, "plan", "de", {
        answers: {},
        model: "unused",
        version: JOURNEY_VERSION,
      });
      expect(await jobs.claim()).toBeNull();
      const claimed = (
        await Promise.all([
          repository.commerce.claimNotification(),
          repository.commerce.claimNotification(),
        ])
      ).filter((job) => job !== null);
      expect(claimed).toHaveLength(1);
      const stale = claimed[0];
      if (!stale) throw Error("Missing confirmation");
      await sql`UPDATE commerce_notifications SET lease_until = now() - interval '1 second' WHERE id = ${stale.id}`;
      const current = await repository.commerce.claimNotification();
      if (!current) throw Error("Missing reclaimed mail");
      expect(
        await repository.commerce.completeNotification(stale, "stale"),
      ).toBe(false);
      expect(
        await repository.commerce.completeNotification(
          current,
          "message_confirmed",
        ),
      ).toBe(true);
      expect((await jobs.claim())?.attempts).toBe(1);
      expect(await repository.commerce.claimNotification()).toBeNull();

      await repository.commerce.recordAdjustment({
        id: "evt_partial",
        type: "charge.refunded",
        paymentIntentId: "pi_current",
        amount: 1900,
        amountRefunded: 500,
        currency: "eur",
      });
      expect(
        (await repository.getSession(record.session.id))?.entitlements,
      ).toContain("full_analysis");
      await Promise.all([
        repository.markPurchasePaid(payment),
        repository.commerce.recordAdjustment({
          id: "evt_full",
          type: "charge.refunded",
          paymentIntentId: "pi_current",
          amount: 1900,
          amountRefunded: 1900,
          currency: "eur",
        }),
      ]);
      await repository.markPurchasePaid(payment);
      expect(
        (await repository.getSession(record.session.id))?.entitlements,
      ).toEqual(["assessment"]);
      await repository.deleteSession(record.session.id);
      expect(await repository.getSession(record.session.id)).toBeNull();
      expect(
        await repository.commerce.getPurchase(payment.checkoutSessionId),
      ).toEqual(original);
      expect(
        (
          await sql`SELECT * FROM payment_adjustments WHERE purchase_id = ${purchase.id}`
        ).length,
      ).toBe(2);

      await repository.commerce.recordAdjustment({
        id: "evt_early_refund",
        type: "charge.refunded",
        paymentIntentId: "pi_early",
        amount: 1900,
        amountRefunded: 1900,
        currency: "eur",
      });
      const early = await repository.createSession();
      await repository.saveCheckout(
        early.session.id,
        { id: "cs_test_early", url: "https://stripe.test/early" },
        createDigitalPurchaseAgreement("de"),
      );
      expect(
        (
          await repository.markPurchasePaid({
            ...payment,
            checkoutSessionId: "cs_test_early",
            paymentIntentId: "pi_early",
          })
        )?.status,
      ).toBe("refunded");
      expect(
        (await sql`SELECT * FROM unmatched_payment_adjustments`).length,
      ).toBe(0);

      const withdrawal = await repository.saveWithdrawal({
        requestId: crypto.randomUUID(),
        name: "Example",
        email: "customer@example.com",
        contractReference: "Full Compass",
        locale: "de",
      });
      const mail = await repository.commerce.claimNotification(
        withdrawal.requestId,
      );
      if (!mail) throw Error("Withdrawal was not queued atomically");
      expect(
        await repository.commerce.completeNotification(
          mail,
          "message_withdrawal",
        ),
      ).toBe(true);
      expect(await repository.saveWithdrawal(withdrawal)).toEqual(withdrawal);
      expect(
        await repository.commerce.claimNotification(withdrawal.requestId, true),
      ).toBeNull();

      await repository.commerce.recordAdjustment({
        id: "evt_unrelated",
        type: "charge.dispute.created",
        paymentIntentId: "pi_other_product",
        amount: 19,
        currency: "eur",
        status: "needs_response",
      });
      await sql`UPDATE unmatched_payment_adjustments SET received_at = now() - interval '8 days'`;
      await repository.commerce.pruneUnmatchedAdjustments();
      expect(
        (await sql`SELECT * FROM unmatched_payment_adjustments`).length,
      ).toBe(0);
      expect((await sql`SELECT * FROM payment_adjustments`).length).toBe(3);
    } finally {
      await sql.end();
      await admin.unsafe(`DROP SCHEMA ${schema} CASCADE`);
      await admin.end();
    }
  },
);
