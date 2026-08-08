import { createAIProvider } from "./ai/config";
import { createApp } from "./app";
import { PostgresAssessmentRepository } from "./repositories/postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const port = Number(process.env.API_PORT ?? 4000);
const app = createApp({
  repository: PostgresAssessmentRepository.connect(databaseUrl),
  aiProvider: createAIProvider(),
  webOrigin: process.env.WEB_ORIGIN,
});

Bun.serve({ port, fetch: app.fetch });
console.log(`API listening on http://localhost:${port}`);
