import postgres from "postgres";

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
} finally {
  await sql.end();
}
