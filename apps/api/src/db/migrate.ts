import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { max: 1 });
const migration = await Bun.file(
  new URL("../../migrations/0001_initial.sql", import.meta.url),
).text();

await sql`
  CREATE TABLE IF NOT EXISTS app_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
const applied = await sql<Array<{ version: string }>>`
  SELECT version FROM app_migrations WHERE version = '0001_initial'
`;
if (applied.length === 0) {
  await sql.begin(async (transaction) => {
    await transaction.unsafe(migration);
    await transaction`INSERT INTO app_migrations (version) VALUES ('0001_initial')`;
  });
}
await sql.end();

console.log(
  applied.length === 0
    ? "Applied migration 0001_initial.sql"
    : "Database is up to date",
);
