import pg from "pg";
import { randomUUID, createHash } from "node:crypto";
const source = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const restored = new pg.Pool({
  connectionString: process.env.RESTORE_DATABASE_URL,
});
const digest = (r) =>
  createHash("sha256").update(JSON.stringify(r)).digest("hex");
try {
  const fields =
    "id,reference,service_id,resource_id,starts_at,ends_at,price_cents,currency,name,email,note,idempotency_key,request_hash,access_token_hash,created_at";
  const snapshot = await restored.query(
    `SELECT ${fields} FROM bookings ORDER BY id`,
  );
  const ids = snapshot.rows.map((r) => r.id);
  const live = await source.query(
    `SELECT ${fields} FROM bookings WHERE id=ANY($1::uuid[]) ORDER BY id`,
    [ids],
  );
  if (!ids.length || digest(snapshot.rows) !== digest(live.rows))
    throw Error("Restored immutable booking records mismatch or empty");
  const constraints = await restored.query(
    "SELECT conname FROM pg_constraint WHERE conrelid='bookings'::regclass",
  );
  if (!constraints.rows.some((r) => r.conname === "bookings_no_overlap"))
    throw Error("Missing overlap constraint");
  const services = await restored.query(
    "SELECT count(*)::int count FROM services",
  );
  if (services.rows[0].count !== 3) throw Error("Missing services");
  const details = {
    restoredBookings: ids.length,
    immutableBookingDigest: digest(snapshot.rows),
    services: services.rows[0].count,
    overlapConstraint: true,
    separateDatabase: true,
  };
  await source.query(
    "INSERT INTO operational_checks(id,kind,status,details) VALUES($1,'restore-drill','ok',$2)",
    [randomUUID(), details],
  );
  console.log(JSON.stringify({ status: "ok", ...details }));
} catch (error) {
  console.error("Restore verification failed", error.message);
  process.exitCode = 1;
} finally {
  await source.end();
  await restored.end();
}
