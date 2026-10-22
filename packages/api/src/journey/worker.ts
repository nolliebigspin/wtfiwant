import postgres from "postgres";
import { createAIProvider } from "../ai/config";
import { createCommerceProviders } from "../commerce/config";
import { PostgresAssessmentRepository } from "../repositories/postgres";
import { PostgresAIJobStore } from "./postgres";
import { deliverReadyReports, processAIJob } from "./process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const sql = postgres(databaseUrl, { max: 2 });
const dependencies = {
  repository: new PostgresAssessmentRepository(sql),
  jobs: new PostgresAIJobStore(sql),
  aiProvider: createAIProvider(),
  ...createCommerceProviders(),
};
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
try {
  do {
    try {
      const processed = await processAIJob(dependencies);
      await deliverReadyReports(dependencies);
      if (!processed && !process.argv.includes("--once")) await Bun.sleep(2000);
    } catch {
      console.error("Paid report worker temporarily unavailable");
      if (!process.argv.includes("--once")) await Bun.sleep(5000);
    }
  } while (!stopping && !process.argv.includes("--once"));
} finally {
  await sql.end();
}
