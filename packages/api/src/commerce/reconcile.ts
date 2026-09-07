import { withdrawalReceiptSchema } from "@wtfiwant/shared";
import postgres from "postgres";
import { createCommerceProviders } from "./config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { max: 1 });
try {
  const issues = await sql<
    Array<{
      purchase_id: string;
      session_id: string;
      issue:
        | "missing_analysis"
        | "missing_delivery"
        | "failed_delivery"
        | "stale_pending_delivery";
    }>
  >`
    SELECT
      purchase.id AS purchase_id,
      purchase.session_id,
      CASE
        WHEN analysis.session_id IS NULL THEN 'missing_analysis'
        WHEN delivery.id IS NULL THEN 'missing_delivery'
        WHEN delivery.status = 'pending' THEN 'stale_pending_delivery'
        ELSE 'failed_delivery'
      END AS issue
    FROM report_purchases AS purchase
    LEFT JOIN assessment_analyses AS analysis
      ON analysis.session_id = purchase.session_id
    LEFT JOIN report_deliveries AS delivery
      ON delivery.purchase_id = purchase.id
      AND delivery.delivery_kind = 'full_compass'
    WHERE purchase.status = 'paid'
      AND (
        analysis.session_id IS NULL
        OR delivery.id IS NULL
        OR delivery.status = 'failed'
        OR (
          delivery.status = 'pending'
          AND delivery.updated_at <= now() - interval '5 minutes'
        )
      )
    ORDER BY purchase.paid_at
  `;
  console.log(JSON.stringify({ issueCount: issues.length, issues }, null, 2));
  const pending = await sql<
    Array<{
      request_id: string;
      name: string;
      email: string;
      contract_reference: string;
      locale: string;
      received_at: Date;
    }>
  >`SELECT * FROM withdrawal_requests WHERE confirmation_sent_at IS NULL ORDER BY received_at`;
  console.log(
    JSON.stringify({ pendingWithdrawalConfirmations: pending.length }),
  );
  if (process.argv.includes("--retry-withdrawals")) {
    const { emailProvider } = createCommerceProviders();
    if (!emailProvider) throw new Error("Email delivery is not configured");
    for (const row of pending) {
      const receipt = withdrawalReceiptSchema.parse({
        requestId: row.request_id,
        name: row.name,
        email: row.email,
        contractReference: row.contract_reference,
        locale: row.locale,
        receivedAt: row.received_at.toISOString(),
      });
      await emailProvider.sendWithdrawalConfirmation(receipt);
      await sql`UPDATE withdrawal_requests SET confirmation_sent_at = now() WHERE request_id = ${receipt.requestId}`;
    }
    console.log(
      JSON.stringify({ withdrawalConfirmationsRetried: pending.length }),
    );
  }
} finally {
  await sql.end();
}
