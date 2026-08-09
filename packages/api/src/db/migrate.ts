import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const migrationsDir = fileURLToPath(
  new URL("../../migrations", import.meta.url),
);
const versions = (await readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

const sql = postgres(databaseUrl, { max: 1 });

await sql`
  CREATE TABLE IF NOT EXISTS app_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
const applied = new Set(
  (
    await sql<Array<{ version: string }>>`SELECT version FROM app_migrations`
  ).map((row) => row.version),
);

const pending = versions.filter(
  (file) => !applied.has(file.replace(/\.sql$/, "")),
);
for (const file of pending) {
  const version = file.replace(/\.sql$/, "");
  const statements = await Bun.file(`${migrationsDir}/${file}`).text();
  await sql.begin(async (transaction) => {
    await transaction.unsafe(statements);
    await transaction`INSERT INTO app_migrations (version) VALUES (${version})`;
  });
  console.log(`Applied migration ${file}`);
}
await sql.end();

if (pending.length === 0) console.log("Database is up to date");
