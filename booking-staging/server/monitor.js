import { randomUUID } from "node:crypto";
import { createPool, migrate } from "./db.js";
const pool = createPool();
try {
  await migrate(pool);
  const url = process.env.HEALTH_URL;
  if (!url || !url.startsWith("https://"))
    throw Error("HTTPS health URL is required");
  let status = "failed",
    details = {};
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = await response.json();
    status = response.ok && body.status === "ok" ? "ok" : "failed";
    details = { httpStatus: response.status };
  } catch {
    details = { reason: "health_request_failed" };
  }
  const {
    rows: [prior],
  } = await pool.query(
    "SELECT status FROM operational_checks WHERE kind='health' ORDER BY created_at DESC LIMIT 1",
  );
  await pool.query(
    "INSERT INTO operational_checks(id,kind,status,details) VALUES($1,'health',$2,$3)",
    [randomUUID(), status, details],
  );
  await pool.query(
    "DELETE FROM operational_checks WHERE kind='health' AND created_at < now()-interval '30 days'",
  );
  await pool.query("DELETE FROM admin_sessions WHERE expires_at < now()");
  if (prior?.status !== status)
    console.log(
      JSON.stringify({ event: "health_state_changed", status, ...details }),
    );
  if (status === "failed") process.exitCode = 1;
} finally {
  await pool.end();
}
