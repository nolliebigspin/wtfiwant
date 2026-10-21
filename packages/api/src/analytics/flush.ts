import postgres from "postgres";
import { createAnalytics } from "./config";
import { pruneAnalytics } from "./store";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const { analytics } = createAnalytics(url);
if (!analytics) throw new Error("Umami analytics is not configured");
const sql = postgres(url, { max: 1 });
try {
  await pruneAnalytics(sql);
  // Bounded catch-up: at most 100 queued events per scheduled invocation.
  for (let batch = 0; batch < 10; batch++) await analytics.flush();
  console.log("Umami outbox processed");
} finally {
  await analytics.close();
  await sql.end();
}
