import { randomUUID, createHash, createHmac } from "node:crypto";
import { DateTime } from "luxon";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (status, message) => Object.assign(Error(message), { status });
export function installDemoOperations(
  app,
  { pool, now, calendarData, transaction },
) {
  app.get("/api/admin/demo", async (req, res) => {
    const {
      rows: [resource],
    } = await pool.query(
      "SELECT profile,lead_minutes,buffer_before,buffer_after FROM resources WHERE id='studio-room'",
    );
    const blocks = await pool.query(
      "SELECT id,starts_at,ends_at,kind,reason FROM calendar_entries WHERE active AND kind<>'booking' ORDER BY starts_at LIMIT 100",
    );
    const records = await pool.query(
      "SELECT id,kind,booking_id,data,created_at FROM demo_records ORDER BY created_at DESC LIMIT 100",
    );
    const {
      rows: [retention],
    } = await pool.query(
      "SELECT max(created_at) last_review FROM admin_audit WHERE action='retention.apply'",
    );
    res.json({
      resource,
      blocks: blocks.rows,
      records: records.rows,
      retentionReviewOverdue:
        !retention.last_review ||
        Date.now() - new Date(retention.last_review) > 7 * 86400000,
      fictional: true,
    });
  });
  app.post("/api/admin/demo/profile", async (req, res) => {
    if (req.body?.confirmation !== "USE FICTIONAL DEMO RULES")
      throw error(400, "Confirm the fictional profile.");
    await transaction(req, "demo.profile", "studio-room", async (c) => {
      await c.query(
        "UPDATE resources SET profile='simulated',lead_minutes=1440,buffer_before=15,buffer_after=15,lunch_opens='13:00',lunch_closes='14:00' WHERE id='studio-room'",
      );
      await c.query(
        "UPDATE services SET active=false WHERE id<>'demo-relaxation'",
      );
      await c.query(
        "INSERT INTO services(id,name,category,minutes,price_cents,currency,icon,description) VALUES('demo-relaxation','Demo Relaxation','FICTIONAL STUDIO',60,140000,'MKD','◌','Fictional studio-only demonstration. No real appointment or payment.') ON CONFLICT(id) DO UPDATE SET active=true",
      );
      await c.query(
        "DELETE FROM opening_hours WHERE resource_id='studio-room'",
      );
      await c.query(
        "INSERT INTO opening_hours SELECT 'studio-room',d,'10:00'::time,'18:00'::time FROM generate_series(1,5)d",
      );
    });
    res.json({ ok: true, fictional: true, existingBookingsPreserved: true });
  });
  app.post("/api/admin/demo/blocks", async (req, res) => {
    const raw = req.body || {},
      start = DateTime.fromISO(raw.startsAt || "", { setZone: true }),
      end = DateTime.fromISO(raw.endsAt || "", { setZone: true });
    if (
      !start.isValid ||
      !end.isValid ||
      end <= start ||
      end.diff(start, "days").days > 31 ||
      !["closure", "travel", "other"].includes(raw.kind) ||
      typeof raw.reason !== "string" ||
      raw.reason.length > 120
    )
      throw error(
        400,
        "Use a valid block up to 31 days, type and short synthetic reason.",
      );
    const affected = raw.cancelBookingIds || [];
    if (
      !Array.isArray(affected) ||
      affected.length > 100 ||
      affected.some((id) => !UUID.test(id))
    )
      throw error(400, "Invalid affected booking list.");
    const id = randomUUID();
    await transaction(req, "demo.block", id, async (c) => {
      const { rows: overlap } = await c.query(
        "SELECT id FROM calendar_entries WHERE active AND starts_at<$2 AND ends_at>$1 AND kind='booking'",
        [start.toUTC().toISO(), end.toUTC().toISO()],
      );
      if (overlap.some((b) => !affected.includes(b.id)))
        throw error(
          409,
          "Existing appointments overlap. Review affected bookings and explicitly include their IDs for owner cancellation.",
        );
      if (affected.some((i) => !overlap.some((b) => b.id === i)))
        throw error(
          400,
          "Cancellation list must contain only affected appointments.",
        );
      for (const b of overlap) {
        await c.query(
          "UPDATE bookings SET status='cancelled',cancelled_at=COALESCE(cancelled_at,now()) WHERE id=$1",
          [b.id],
        );
        await c.query(
          "INSERT INTO demo_records(id,kind,booking_id,data) VALUES($1,'contact',$2,$3)",
          [
            randomUUID(),
            b.id,
            {
              action: "owner_closure",
              contactPending: true,
              deadlineWorkingHours: 2,
              delivery: "log_only",
            },
          ],
        );
      }
      await c.query(
        "INSERT INTO calendar_entries(id,resource_id,starts_at,ends_at,kind,reason) VALUES($1,'studio-room',$2,$3,$4,$5)",
        [id, start.toUTC().toISO(), end.toUTC().toISO(), raw.kind, raw.reason],
      );
    });
    res.status(201).json({ id, cancelled: affected.length });
  });
  app.post("/api/admin/demo/blocks/:id/release", async (req, res) => {
    if (!UUID.test(req.params.id)) throw error(400, "Invalid block.");
    await transaction(req, "demo.block.release", req.params.id, (c) =>
      c.query(
        "UPDATE calendar_entries SET active=false WHERE id=$1 AND kind<>'booking'",
        [req.params.id],
      ),
    );
    res.json({ ok: true });
  });
  app.post("/api/admin/demo/bookings", async (req, res) => {
    const raw = req.body || {};
    if (
      !UUID.test(raw.requestId || "") ||
      !["phone", "messaging", "web"].includes(raw.channel) ||
      typeof raw.name !== "string" ||
      !raw.name.trim() ||
      raw.name.length > 120 ||
      !/^demo-[a-z0-9-]+@example\.com$/.test(raw.email || "")
    )
      throw error(
        400,
        "Use a UUID request ID, channel, invented name and demo-...@example.com contact.",
      );
    const start = DateTime.fromISO(raw.startsAt || "", { setZone: true });
    if (!start.isValid) throw error(400, "Choose a UTC start.");
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          name: raw.name.trim(),
          email: raw.email,
          channel: raw.channel,
          serviceId: raw.serviceId,
          startsAt: start.toUTC().toISO(),
        }),
      )
      .digest("hex");
    const result = await transaction(
      req,
      "demo.owner_entry",
      raw.requestId,
      async (c) => {
        const {
          rows: [prior],
        } = await c.query(
          "SELECT id,reference,request_hash FROM bookings WHERE idempotency_key=$1",
          [raw.requestId],
        );
        if (prior) {
          if (prior.request_hash !== fingerprint)
            throw error(409, "Request ID already used with different details.");
          return { id: prior.id, reference: prior.reference, replayed: true };
        }
        const data = await calendarData(
          c,
          raw.serviceId,
          start.setZone("Europe/Skopje").toISODate(),
          now(),
        );
        const slot = data.slots.find(
          (s) => DateTime.fromISO(s.startsAt).toMillis() === start.toMillis(),
        );
        if (!slot) throw error(409, "Time unavailable.");
        const id = randomUUID();
        await c.query(
          `INSERT INTO bookings(id,reference,service_id,resource_id,starts_at,ends_at,occupied_from,occupied_until,price_cents,currency,name,email,idempotency_key,request_hash,access_token_hash,channel,contact_route) VALUES($1,$2,$3,'studio-room',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
          [
            id,
            "STG-" + id,
            raw.serviceId,
            slot.startsAt,
            slot.endsAt,
            slot.occupiedFrom,
            slot.occupiedUntil,
            data.service.price_cents,
            data.service.currency,
            raw.name.trim(),
            raw.email,
            raw.requestId,
            fingerprint,
            createHash("sha256").update(randomUUID()).digest("hex"),
            raw.channel,
            raw.channel === "web" ? "email" : raw.channel,
          ],
        );
        await c.query(
          "INSERT INTO demo_records(id,kind,booking_id,data) VALUES($1,'contact',$2,$3)",
          [
            randomUUID(),
            id,
            {
              action: "owner_entry_receipt",
              contactPending: true,
              delivery: "log_only",
            },
          ],
        );
        return { id, reference: "STG-" + id };
      },
    );
    res
      .status(result.replayed ? 200 : 201)
      .json({ ...result, status: "confirmed", delivery: "manual_log_only" });
  });
  app.post("/api/admin/demo/bookings/:id/reschedule", async (req, res) => {
    if (!UUID.test(req.params.id)) throw error(400, "Invalid booking.");
    const start = DateTime.fromISO(req.body?.startsAt || "", { setZone: true });
    if (!start.isValid) throw error(400, "Choose a start.");
    await transaction(req, "demo.reschedule", req.params.id, async (c) => {
      const {
        rows: [b],
      } = await c.query(
        "SELECT * FROM bookings WHERE id=$1 AND status='confirmed' FOR UPDATE",
        [req.params.id],
      );
      if (!b) throw error(404, "Confirmed booking not found.");
      if (new Date(b.starts_at).getTime() === start.toMillis()) return;
      await c.query("UPDATE calendar_entries SET active=false WHERE id=$1", [
        b.id,
      ]);
      const data = await calendarData(
        c,
        b.service_id,
        start.setZone("Europe/Skopje").toISODate(),
        now(),
      );
      const slot = data.slots.find(
        (s) => DateTime.fromISO(s.startsAt).toMillis() === start.toMillis(),
      );
      if (!slot)
        throw error(
          409,
          "Replacement unavailable. Original booking preserved.",
        );
      await c.query(
        "UPDATE bookings SET starts_at=$1,ends_at=$2,occupied_from=$3,occupied_until=$4,late_cancel_requested=false WHERE id=$5",
        [
          slot.startsAt,
          slot.endsAt,
          slot.occupiedFrom,
          slot.occupiedUntil,
          b.id,
        ],
      );
    });
    res.json({ ok: true });
  });
  app.post("/api/admin/demo/bookings/:id/outcome", async (req, res) => {
    const { outcome, paid } = req.body || {};
    if (
      !UUID.test(req.params.id) ||
      !["pending", "attended", "no_show"].includes(outcome) ||
      typeof paid !== "boolean"
    )
      throw error(400, "Invalid outcome.");
    await transaction(req, "demo.outcome", req.params.id, async (c) => {
      const {
        rows: [b],
      } = await c.query("SELECT starts_at,status FROM bookings WHERE id=$1", [
        req.params.id,
      ]);
      if (!b || b.status !== "confirmed")
        throw error(404, "Confirmed booking not found.");
      if (
        outcome === "no_show" &&
        now().toMillis() < new Date(b.starts_at).getTime() + 15 * 60000
      )
        throw error(400, "No-show can be recorded 15 minutes after start.");
      if (
        outcome === "attended" &&
        now().toMillis() < new Date(b.starts_at).getTime()
      )
        throw error(400, "Attendance cannot be recorded before start.");
      if (outcome === "no_show" && paid)
        throw error(400, "Demo no-shows have no fee.");
      await c.query("UPDATE bookings SET outcome=$1,paid=$2 WHERE id=$3", [
        outcome,
        paid,
        req.params.id,
      ]);
    });
    res.json({ ok: true });
  });
  app.post("/api/admin/demo/records", async (req, res) => {
    const raw = req.body || {};
    if (
      !["inquiry", "contact", "reconciliation", "economics", "alert"].includes(
        raw.kind,
      )
    )
      throw error(400, "Choose a record type.");
    const d = raw.data || {};
    if (typeof d !== "object" || Array.isArray(d))
      throw error(400, "Invalid record.");
    const allowed = [
      "channel",
      "minutes",
      "manual",
      "entryError",
      "outcome",
      "paid",
      "action",
      "contactPending",
    ];
    if (
      Object.keys(d).some((k) => !allowed.includes(k)) ||
      JSON.stringify(d).length > 500
    )
      throw error(400, "Only synthetic operational fields are allowed.");
    if (d.channel && !["web", "phone", "messaging"].includes(d.channel))
      throw error(400, "Invalid channel.");
    if (
      d.minutes !== undefined &&
      (!Number.isFinite(d.minutes) || d.minutes < 0 || d.minutes > 1440)
    )
      throw error(400, "Invalid minutes.");
    for (const k of ["manual", "entryError", "paid", "contactPending"])
      if (d[k] !== undefined && typeof d[k] !== "boolean")
        throw error(400, "Invalid flag.");
    if (
      d.outcome &&
      ![
        "pending",
        "attended",
        "cancelled",
        "no_show",
        "attended_unpaid",
      ].includes(d.outcome)
    )
      throw error(400, "Invalid outcome.");
    if (
      d.action &&
      ![
        "receipt",
        "owner_closure",
        "customer_change",
        "reconciled",
        "failure",
        "recovery",
      ].includes(d.action)
    )
      throw error(400, "Invalid action.");
    if (
      raw.kind === "economics" &&
      (!d.channel ||
        d.minutes === undefined ||
        d.manual === undefined ||
        d.entryError === undefined ||
        !d.outcome ||
        d.paid === undefined)
    )
      throw error(400, "Complete all economics fields.");
    if (raw.bookingId && !UUID.test(raw.bookingId))
      throw error(400, "Invalid booking ID.");
    const id = randomUUID();
    await transaction(req, "demo.record", id, (c) =>
      c.query(
        "INSERT INTO demo_records(id,kind,booking_id,data) VALUES($1,$2,$3,$4)",
        [id, raw.kind, raw.bookingId || null, d],
      ),
    );
    res.status(201).json({ id, delivery: "log_only", slotHeld: false });
  });
  app.get("/api/admin/demo/economics.csv", async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id,data,created_at FROM demo_records WHERE kind='economics' ORDER BY created_at",
    );
    const columns = [
      "channel",
      "minutes",
      "manual",
      "entryError",
      "outcome",
      "paid",
    ];
    const csv = [
      "id,created_at," + columns.join(","),
      ...rows.map((r) =>
        [
          r.id,
          new Date(r.created_at).toISOString(),
          ...columns.map((k) => r.data[k] ?? ""),
        ].join(","),
      ),
    ].join("\n");
    res
      .set(
        "Content-Disposition",
        'attachment; filename="synthetic-economics.csv"',
      )
      .type("text/csv")
      .send(csv);
  });
}
