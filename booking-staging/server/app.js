import express from "express";
import { installAdmin } from "./admin.js";
import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { DateTime } from "luxon";
import { fileURLToPath } from "node:url";
import {
  candidates,
  dateBounds,
  excludeBusy,
  RULES,
  validDate,
} from "./calendar.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = (value) => createHash("sha256").update(value).digest("hex");
const RESOURCE = "studio-room";
const publicService = (s) => ({
  id: s.id,
  name: s.name,
  category: s.category,
  minutes: s.minutes,
  price: s.price_cents / 100,
  currency: s.currency,
  icon: s.icon,
  description: s.description,
});
const fail = (status, message, code) =>
  Object.assign(new Error(message), { status, code });

async function calendarData(client, serviceId, date, now) {
  const {
    rows: [resource],
  } = await client.query("SELECT * FROM resources WHERE id=$1 AND active", [
    RESOURCE,
  ]);
  if (!resource)
    throw fail(503, "The sample room is unavailable.", "unavailable");
  if (!validDate(date, resource.timezone, now))
    throw fail(400, "Choose a date within the booking window.", "invalid_date");
  const {
    rows: [service],
  } = await client.query("SELECT * FROM services WHERE id=$1 AND active", [
    serviceId,
  ]);
  if (!service)
    throw fail(400, "Choose an available treatment.", "invalid_service");
  const weekday = DateTime.fromISO(date, { zone: resource.timezone }).weekday;
  const {
    rows: [hours],
  } = await client.query(
    "SELECT opens::text, closes::text FROM opening_hours WHERE resource_id=$1 AND weekday=$2",
    [RESOURCE, weekday],
  );
  const slots = candidates(
    date,
    resource.timezone,
    hours,
    service.minutes,
    now,
  );
  const { rows: busy } = await client.query(
    "SELECT starts_at,ends_at FROM bookings WHERE resource_id=$1 AND status='confirmed' AND starts_at < $3::timestamptz AND ends_at > $2::timestamptz",
    [
      RESOURCE,
      DateTime.fromISO(date, { zone: resource.timezone })
        .startOf("day")
        .toUTC()
        .toISO(),
      DateTime.fromISO(date, { zone: resource.timezone })
        .plus({ days: 1 })
        .startOf("day")
        .toUTC()
        .toISO(),
    ],
  );
  return { resource, service, slots: excludeBusy(slots, busy) };
}

export function createApp({
  pool,
  tokenSecret,
  adminPasswordHash,
  now = () => DateTime.utc(),
  rateLimit = 180,
} = {}) {
  if (!tokenSecret || tokenSecret.length < 32)
    throw new Error("BOOKING_TOKEN_SECRET must be at least 32 characters");
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    });
    next();
  });
  const counts = new Map();
  const cleanup = setInterval(() => {
    for (const [key, value] of counts)
      if (value.until < Date.now()) counts.delete(key);
  }, 60000);
  cleanup.unref();
  app.locals.stopRateLimiter = () => clearInterval(cleanup);
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const key = req.ip,
      time = Date.now();
    const state = counts.get(key);
    if (!state || state.until < time)
      counts.set(key, { count: 1, until: time + 60000 });
    else if (++state.count > rateLimit) {
      res.set("Retry-After", "60");
      return res.status(429).json({
        error: "Too many requests. Please wait a minute.",
        code: "rate_limit",
      });
    }
    // Staging is same-origin. Browser writes from another site are refused.
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
      req.get("origin")
    ) {
      let origin;
      try {
        origin = new URL(req.get("origin"));
      } catch {
        return res.status(403).json({ error: "Invalid origin." });
      }
      if (origin.host !== req.get("host"))
        return res
          .status(403)
          .json({ error: "Cross-site requests are not allowed." });
    }
    next();
  });
  app.use(express.json({ limit: "8kb", strict: true }));
  installAdmin(app, { pool, tokenSecret, adminPasswordHash });
  app.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", mode: "staging" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.get("/api/services", async (req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM services WHERE active ORDER BY minutes DESC",
    );
    const {
      rows: [resource],
    } = await pool.query("SELECT * FROM resources WHERE id=$1 AND active", [
      RESOURCE,
    ]);
    if (!resource) throw fail(503, "The sample room is unavailable.");
    res.json({
      services: rows.map(publicService),
      business: {
        timezone: resource.timezone,
        ...dateBounds(resource.timezone, now()),
        ...RULES,
        syntheticOnly: true,
      },
    });
  });
  app.get("/api/slots", async (req, res) => {
    if (
      typeof req.query.serviceId !== "string" ||
      typeof req.query.date !== "string"
    )
      throw fail(400, "Treatment and date are required.");
    const data = await calendarData(
      pool,
      req.query.serviceId,
      req.query.date,
      now(),
    );
    res.json({
      date: req.query.date,
      timezone: data.resource.timezone,
      slots: data.slots,
    });
  });
  const tokenFor = (row) =>
    createHmac("sha256", tokenSecret)
      .update(`${row.id}:${row.idempotency_key}`)
      .digest("hex");
  const responseFor = (row) => ({
    id: row.id,
    reference: row.reference,
    status: row.status,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    name: row.name,
    price: row.price_cents / 100,
    currency: row.currency,
    service: publicService({
      ...row,
      id: row.service_id,
      name: row.service_name,
      minutes: (new Date(row.ends_at) - new Date(row.starts_at)) / 60000,
    }),
    timezone: row.timezone,
  });
  const lookup = async (client, id) => {
    const {
      rows: [row],
    } = await client.query(
      `SELECT b.*,s.name AS service_name,s.category,s.minutes,s.icon,s.description,r.timezone
      FROM bookings b JOIN services s ON s.id=b.service_id JOIN resources r ON r.id=b.resource_id WHERE b.id=$1`,
      [id],
    );
    return row;
  };
  app.post("/api/bookings", async (req, res) => {
    const raw = req.body;
    if (!raw || Array.isArray(raw))
      throw fail(400, "Booking details are required.");
    const key = req.get("idempotency-key");
    if (!key || !UUID.test(key))
      throw fail(400, "A valid request identifier is required.", "invalid_key");
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const email =
      typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
    const note = typeof raw.note === "string" ? raw.note.trim() : "";
    if (!name || name.length > 120)
      throw fail(400, "Enter a name of 1–120 characters.", "invalid_name");
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw fail(400, "Enter a valid email address.", "invalid_email");
    if (
      !/^[^\s@]+@(example\.com|example\.org|example\.net|[a-z0-9.-]+\.test)$/.test(
        email,
      )
    )
      throw fail(
        400,
        "Staging accepts only example.com/org/net or .test email addresses. Use invented details.",
        "synthetic_email",
      );
    if (note.length > 1000)
      throw fail(400, "Keep the note within 1000 characters.", "invalid_note");
    if (
      typeof raw.serviceId !== "string" ||
      typeof raw.startsAt !== "string" ||
      !/Z$/.test(raw.startsAt)
    )
      throw fail(400, "Choose a valid treatment and UTC start time.");
    const start = DateTime.fromISO(raw.startsAt, { setZone: true });
    if (!start.isValid) throw fail(400, "Choose a valid start time.");
    const payload = JSON.stringify({
      name,
      email,
      note,
      serviceId: raw.serviceId,
      startsAt: start.toUTC().toISO(),
    });
    const requestHash = hash(payload),
      client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM resources WHERE id=$1 FOR UPDATE", [
        RESOURCE,
      ]);
      const {
        rows: [prior],
      } = await client.query(
        "SELECT * FROM bookings WHERE idempotency_key=$1",
        [key],
      );
      if (prior) {
        if (prior.request_hash !== requestHash)
          throw fail(
            409,
            "This request identifier was used for different details.",
            "idempotency_mismatch",
          );
        const row = await lookup(client, prior.id);
        await client.query("COMMIT");
        return res.json({
          booking: responseFor(row),
          accessToken: tokenFor(row),
          replayed: true,
        });
      }
      const {
        rows: [resource],
      } = await client.query("SELECT timezone FROM resources WHERE id=$1", [
        RESOURCE,
      ]);
      if (!resource) throw fail(503, "The sample room is unavailable.");
      const data = await calendarData(
        client,
        raw.serviceId,
        start.setZone(resource.timezone).toISODate(),
        now(),
      );
      const slot = data.slots.find(
        (s) => DateTime.fromISO(s.startsAt).toMillis() === start.toMillis(),
      );
      if (!slot)
        throw fail(
          409,
          "That time is no longer available. Choose another time.",
          "slot_unavailable",
        );
      const id = randomUUID(),
        token = tokenFor({ id, idempotency_key: key });
      await client.query(
        `INSERT INTO bookings(id,reference,service_id,resource_id,starts_at,ends_at,price_cents,currency,name,email,note,idempotency_key,request_hash,access_token_hash)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          id,
          `STG-${id}`,
          raw.serviceId,
          RESOURCE,
          slot.startsAt,
          slot.endsAt,
          data.service.price_cents,
          data.service.currency,
          name,
          email,
          note,
          key,
          requestHash,
          hash(token),
        ],
      );
      const row = await lookup(client, id);
      await client.query("COMMIT");
      res.status(201).json({ booking: responseFor(row), accessToken: token });
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23P01")
        throw fail(
          409,
          "That time is no longer available. Choose another time.",
          "slot_unavailable",
        );
      throw error;
    } finally {
      client.release();
    }
  });
  const authorizedBooking = async (req) => {
    if (!UUID.test(req.params.id)) throw fail(404, "Booking not found.");
    const row = await lookup(pool, req.params.id),
      token = req.get("authorization")?.replace(/^Bearer /, "");
    if (!row || !token || token.length > 256)
      throw fail(404, "Booking not found.");
    const provided = Buffer.from(hash(token)),
      expected = Buffer.from(row.access_token_hash);
    if (!timingSafeEqual(provided, expected))
      throw fail(404, "Booking not found.");
    return row;
  };
  app.get("/api/bookings/:id", async (req, res) =>
    res.json({ booking: responseFor(await authorizedBooking(req)) }),
  );
  app.post("/api/bookings/:id/cancel", async (req, res) => {
    const row = await authorizedBooking(req);
    await pool.query(
      "UPDATE bookings SET status='cancelled',cancelled_at=COALESCE(cancelled_at,now()) WHERE id=$1",
      [row.id],
    );
    res.json({ booking: responseFor({ ...row, status: "cancelled" }) });
  });
  // Serve only the bundled public assets, never server files or environment variables.
  app.get("/HANDOFF.md", (req, res) =>
    res
      .type("text/plain")
      .sendFile(fileURLToPath(new URL("../README.md", import.meta.url))),
  );
  app.use(
    express.static(fileURLToPath(new URL("../dist/", import.meta.url)), {
      etag: true,
      maxAge: 0,
    }),
  );
  app.use((req, res) => res.status(404).json({ error: "Not found." }));
  app.use((error, req, res, next) => {
    const status =
      error.status || (error.type === "entity.parse.failed" ? 400 : 500);
    // Do not log request bodies, database URLs, tokens or raw database errors.
    if (status >= 500)
      console.error("Request failed", {
        path: req.path,
        code: error.code || "internal",
      });
    res.status(status).json({
      error:
        status >= 500
          ? "The booking service is temporarily unavailable. Please retry."
          : error.message,
      code: status >= 500 ? "unavailable" : error.code || "invalid_request",
    });
  });
  return app;
}
