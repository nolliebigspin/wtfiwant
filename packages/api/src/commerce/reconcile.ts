import postgres from "postgres";
import { PostgresAssessmentRepository } from "../repositories/postgres";
import { createCommerceProviders } from "./config";
import { deliverCommerceNotifications } from "./notifications";

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
  console.log(JSON.stringify({ reportIssueCount: issues.length }));
  const counts =
    await sql`SELECT kind, status, count(*)::int AS count FROM commerce_notifications GROUP BY kind, status ORDER BY kind, status`;
  const [withdrawals] =
    await sql`SELECT count(*)::int AS count FROM withdrawal_requests WHERE confirmation_sent_at IS NULL`;
  const [unmatched] =
    await sql`SELECT count(*)::int AS count FROM unmatched_payment_adjustments`;
  const [disputes] =
    await sql`SELECT count(*)::int AS count FROM payment_adjustments WHERE event_type = 'charge.dispute.created'`;
  console.log(
    JSON.stringify({
      notifications: counts,
      pendingWithdrawalConfirmations: withdrawals.count,
      unmatchedPaymentEvents: unmatched.count,
      recordedDisputes: disputes.count,
    }),
  );
  if (
    process.argv.includes("--retry-notifications") ||
    process.argv.includes("--retry-withdrawals")
  ) {
    const { emailProvider } = createCommerceProviders();
    if (!emailProvider) throw new Error("Email delivery is not configured");
    await deliverCommerceNotifications(
      new PostgresAssessmentRepository(sql).commerce,
      emailProvider,
    );
    console.log(JSON.stringify({ dueNotificationsProcessed: true }));
  }
} finally {
  await sql.end();
}
