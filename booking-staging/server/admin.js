import { randomUUID } from "node:crypto";
import { adminAuth } from "./admin-auth.js";
export function installAdmin(app, { pool, tokenSecret, adminPasswordHash }) {
  const auth = adminAuth({
    pool,
    secret: tokenSecret,
    passwordDigest: adminPasswordHash,
  });
  app.post("/api/admin/login", auth.login);
  app.use("/api/admin", auth.session);
  app.get("/api/admin/session", (req, res) =>
    res.json({ username: req.admin.actor, csrf: req.admin.csrf }),
  );
  app.post("/api/admin/logout", auth.logout);
  const audit = (client, req, action, target, metadata = {}) =>
    client.query(
      "INSERT INTO admin_audit(id,actor,action,target,metadata) VALUES($1,$2,$3,$4,$5)",
      [randomUUID(), req.admin.actor, action, target, metadata],
    );
  const transaction = async (req, action, target, fn) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT id FROM resources WHERE id='studio-room' FOR UPDATE",
      );
      const result = await fn(client);
      await audit(client, req, action, target);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  };
  app.get("/api/admin/bookings", async (req, res) => {
    const offset = Number(req.query.offset || 0),
      status = req.query.status || "all";
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset > 100000 ||
      !["all", "confirmed", "cancelled"].includes(status)
    )
      return res.status(400).json({ error: "Invalid booking filter." });
    const { rows } = await pool.query(
      "SELECT b.id,b.reference,b.name,b.email,b.note,b.starts_at,b.ends_at,b.status,b.price_cents,b.currency,s.name service_name FROM bookings b JOIN services s ON s.id=b.service_id WHERE ($1='all' OR b.status=$1) ORDER BY b.starts_at DESC LIMIT 51 OFFSET $2",
      [status, offset],
    );
    res.json({
      bookings: rows.slice(0, 50),
      hasMore: rows.length > 50,
      offset,
    });
  });
  app.post("/api/admin/bookings/:id/cancel", async (req, res) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id))
      return res.status(400).json({ error: "Invalid booking identifier." });
    const result = await transaction(
      req,
      "booking.cancel",
      req.params.id,
      (c) =>
        c.query(
          "UPDATE bookings SET status='cancelled',cancelled_at=COALESCE(cancelled_at,now()) WHERE id=$1 RETURNING id",
          [req.params.id],
        ),
    );
    res
      .status(result.rowCount ? 200 : 404)
      .json(result.rowCount ? { ok: true } : { error: "Booking not found." });
  });
  app.get("/api/admin/settings", async (req, res) => {
    const services = await pool.query(
      "SELECT id,name,minutes,price_cents,active FROM services ORDER BY id",
    );
    const hours = await pool.query(
      "SELECT weekday,opens::text,closes::text FROM opening_hours WHERE resource_id='studio-room' ORDER BY weekday",
    );
    res.json({
      services: services.rows,
      hours: hours.rows,
      timezone: "Europe/Skopje",
    });
  });
  app.post("/api/admin/services/:id", async (req, res) => {
    const { minutes, price_cents, active } = req.body || {};
    if (
      !Number.isInteger(minutes) ||
      minutes < 15 ||
      minutes > 240 ||
      !Number.isInteger(price_cents) ||
      price_cents < 0 ||
      price_cents > 1000000 ||
      typeof active !== "boolean"
    )
      return res
        .status(400)
        .json({
          error: "Use 15–240 minutes, a price in cents, and an active setting.",
        });
    const result = await transaction(
      req,
      "service.update",
      req.params.id,
      (c) =>
        c.query(
          "UPDATE services SET minutes=$1,price_cents=$2,active=$3 WHERE id=$4 RETURNING id",
          [minutes, price_cents, active, req.params.id],
        ),
    );
    res
      .status(result.rowCount ? 200 : 404)
      .json(result.rowCount ? { ok: true } : { error: "Service not found." });
  });
  app.post("/api/admin/hours", async (req, res) => {
    const hours = req.body?.hours;
    if (
      !Array.isArray(hours) ||
      hours.length > 7 ||
      new Set(hours.map((h) => h.weekday)).size !== hours.length ||
      hours.some(
        (h) =>
          !Number.isInteger(h.weekday) ||
          h.weekday < 1 ||
          h.weekday > 7 ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.opens) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(h.closes) ||
          h.closes <= h.opens,
      )
    )
      return res
        .status(400)
        .json({
          error:
            "Use unique weekdays 1–7 and closing times after opening times.",
        });
    await transaction(req, "hours.update", "studio-room", async (c) => {
      await c.query(
        "DELETE FROM opening_hours WHERE resource_id='studio-room'",
      );
      for (const h of hours)
        await c.query(
          "INSERT INTO opening_hours VALUES('studio-room',$1,$2,$3)",
          [h.weekday, h.opens, h.closes],
        );
    });
    res.json({ ok: true });
  });
  const eligible =
    "ends_at < now()-interval '90 days' AND email ~ '^[^@]+@(example\\.com|example\\.org|example\\.net|[a-z0-9.-]+\\.test)$'";
  app.get("/api/admin/retention", async (req, res) => {
    const {
      rows: [r],
    } = await pool.query(
      `SELECT count(*)::int count FROM bookings WHERE ${eligible}`,
    );
    res.json({ days: 90, eligible: r.count, automatic: false });
  });
  app.post("/api/admin/retention", async (req, res) => {
    if (req.body?.confirmation !== "DELETE OLD SYNTHETIC BOOKINGS")
      return res
        .status(400)
        .json({ error: "Explicit confirmation is required." });
    const result = await transaction(
      req,
      "retention.apply",
      "synthetic-90-days",
      (c) => c.query(`DELETE FROM bookings WHERE ${eligible}`),
    );
    res.json({ deleted: result.rowCount });
  });
  app.get("/api/admin/operations", async (req, res) => {
    const checks = await pool.query(
      "SELECT kind,status,details,created_at FROM operational_checks ORDER BY created_at DESC LIMIT 30",
    );
    const audit = await pool.query(
      "SELECT actor,action,target,created_at FROM admin_audit ORDER BY created_at DESC LIMIT 30",
    );
    res.json({ checks: checks.rows, audit: audit.rows });
  });
}
