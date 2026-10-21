import postgres from "postgres";
import { pruneAnalytics } from "./store";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const sql = postgres(url, { max: 1 });
try {
  await pruneAnalytics(sql);
  console.log("Analytics retention cleanup complete");
} finally {
  await sql.end();
}
