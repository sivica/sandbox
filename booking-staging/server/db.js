import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
  });
}

export async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializes migration startup across overlapping Railway replicas.
    await client.query("SELECT pg_advisory_xact_lock(837214)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
    for (const file of (await readdir(dir))
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      const applied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name=$1",
        [file],
      );
      if (applied.rowCount) continue;
      await client.query(await readFile(`${dir}/${file}`, "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        file,
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
