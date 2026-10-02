import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { createPool, migrate } from "../server/db.js";
import { createApp } from "../server/app.js";
import { passwordHash } from "../server/admin-auth.js";

test("real PostgreSQL booking API: persistence, concurrency, retries, protection and cleanup", async (t) => {
  const pool = createPool();
  await migrate(pool);
  const app = createApp({
    pool,
    tokenSecret: process.env.BOOKING_TOKEN_SECRET,
    adminPasswordHash: await passwordHash("ci-only-admin-password"),
    rateLimit: 10000,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.on("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`,
    created = [];
  const call = async (path, options = {}) => {
    const r = await fetch(base + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    return { status: r.status, body: await r.json(), headers: r.headers };
  };
  const post = (payload, key = randomUUID()) =>
    call("/api/bookings", {
      method: "POST",
      headers: { "Idempotency-Key": key },
      body: JSON.stringify(payload),
    });
  const remember = (result) => {
    if (
      result.body.booking &&
      !created.some((x) => x.id === result.body.booking.id)
    )
      created.push({
        id: result.body.booking.id,
        token: result.body.accessToken,
      });
    return result;
  };
  try {
    const services = await call("/api/services");
    assert.equal(services.status, 200);
    assert.equal(services.body.services.length, 3);
    assert.equal(services.headers.get("cache-control"), "no-store");
    let available, date;
    for (let i = 15; i < 30; i++) {
      date = DateTime.fromISO(services.body.business.today)
        .plus({ days: i })
        .toISODate();
      available = (await call(`/api/slots?serviceId=reset&date=${date}`)).body
        .slots;
      if (available?.length > 10) break;
    }
    assert.ok(available?.length > 10);
    const payload = {
      serviceId: "reset",
      startsAt: available[0].startsAt,
      name: "API Test",
      email: "api@example.com",
      note: "Invented integration test",
    };
    let first,
      key = randomUUID();
    await t.test(
      "simultaneous identical retries produce one booking and stable access token",
      async () => {
        const results = await Promise.all([
          post(payload, key),
          post(payload, key),
        ]);
        results.forEach(remember);
        assert.deepEqual(results.map((r) => r.status).sort(), [200, 201]);
        assert.equal(results[0].body.booking.id, results[1].body.booking.id);
        assert.equal(results[0].body.accessToken, results[1].body.accessToken);
        first = results[0];
        const count = await pool.query(
          "SELECT count(*)::int AS n FROM bookings WHERE idempotency_key=$1",
          [key],
        );
        assert.equal(count.rows[0].n, 1);
      },
    );
    await t.test("key reuse with changed payload rejected", async () =>
      assert.equal(
        (await post({ ...payload, name: "Changed" }, key)).status,
        409,
      ),
    );
    await t.test(
      "booking survives new application instance; unauthorized lookup denied",
      async () => {
        assert.equal(
          (await call(`/api/bookings/${first.body.booking.id}`)).status,
          404,
        );
        assert.equal(
          (
            await call(`/api/bookings/${first.body.booking.id}`, {
              headers: { Authorization: "Bearer invalid" },
            })
          ).status,
          404,
        );
        const second = createApp({
          pool,
          tokenSecret: process.env.BOOKING_TOKEN_SECRET,
        });
        const listener = second.listen(0, "127.0.0.1");
        await new Promise((r) => listener.on("listening", r));
        try {
          const r = await fetch(
            `http://127.0.0.1:${listener.address().port}/api/bookings/${first.body.booking.id}`,
            { headers: { Authorization: `Bearer ${first.body.accessToken}` } },
          );
          assert.equal(r.status, 200);
          assert.equal(
            (await r.json()).booking.reference,
            first.body.booking.reference,
          );
        } finally {
          second.locals.stopRateLimiter();
          await new Promise((r) => listener.close(r));
        }
      },
    );
    await t.test("separate overlapping requests cannot both book", async () => {
      const requests = [
        { ...payload, startsAt: available[8].startsAt },
        { ...payload, serviceId: "glow", startsAt: available[9].startsAt },
      ];
      const results = await Promise.all(requests.map((p) => post(p)));
      results.forEach(remember);
      assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
    });
    await t.test(
      "database exclusion constraint also protects direct inserts",
      async () => {
        const id = randomUUID();
        await assert.rejects(
          pool.query(
            `INSERT INTO bookings(id,reference,service_id,resource_id,starts_at,ends_at,occupied_from,occupied_until,price_cents,currency,name,email,idempotency_key,request_hash,access_token_hash)
        SELECT $1::uuid,$1::text,service_id,resource_id,starts_at,ends_at,occupied_from,occupied_until,price_cents,currency,name,email,$2,'test','test' FROM bookings WHERE id=$3`,
            [id, randomUUID(), first.body.booking.id],
          ),
          { code: "23P01" },
        );
      },
    );
    await t.test(
      "server rejects invalid dates, past/off-grid times, data, real email and external browser origin",
      async () => {
        assert.equal(
          (await call("/api/slots?serviceId=reset&date=2026-02-30")).status,
          400,
        );
        assert.equal(
          (await call("/api/slots?serviceId=missing&date=" + date)).status,
          400,
        );
        for (const changed of [
          { name: "" },
          { email: "invalid" },
          { email: "person@gmail.com" },
          { note: "x".repeat(1001) },
          { startsAt: "2000-01-01T09:00:00Z" },
        ])
          assert.ok((await post({ ...payload, ...changed })).status >= 400);
        const offGrid = DateTime.fromISO(available[16].startsAt)
          .plus({ minutes: 1 })
          .toUTC()
          .toISO();
        assert.equal(
          (await post({ ...payload, startsAt: offGrid })).status,
          409,
        );
        assert.equal(
          (
            await call("/api/bookings", {
              method: "POST",
              headers: { Origin: "https://other.example" },
              body: "{}",
            })
          ).status,
          403,
        );
      },
    );
    await t.test(
      "cancellation is authorized, repeatable and releases capacity",
      async () => {
        const id = first.body.booking.id;
        assert.equal(
          (
            await call(`/api/bookings/${id}/cancel`, {
              method: "POST",
              body: "{}",
            })
          ).status,
          404,
        );
        for (let i = 0; i < 2; i++) {
          const r = await call(`/api/bookings/${id}/cancel`, {
            method: "POST",
            headers: { Authorization: `Bearer ${first.body.accessToken}` },
            body: "{}",
          });
          assert.equal(r.status, 200);
          assert.equal(r.body.booking.status, "cancelled");
        }
        const slots = (await call(`/api/slots?serviceId=reset&date=${date}`))
          .body.slots;
        assert.ok(slots.some((s) => s.startsAt === available[0].startsAt));
        const replay = await post(payload, key);
        assert.equal(replay.status, 200);
        assert.equal(replay.body.booking.status, "cancelled");
      },
    );
    await t.test(
      "administration requires a session and CSRF, validates edits and logs actions",
      async () => {
        assert.equal((await call("/api/admin/bookings")).status, 401);
        const login = await call("/api/admin/login", {
          method: "POST",
          body: JSON.stringify({
            username: "owner",
            password: "ci-only-admin-password",
          }),
        });
        assert.equal(login.status, 200);
        const cookie = login.headers.get("set-cookie").split(";")[0];
        const headers = { Cookie: cookie, "X-CSRF-Token": login.body.csrf };
        assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
        assert.match(login.headers.get("set-cookie"), /SameSite=Strict/i);
        assert.equal(
          (await call("/api/admin/bookings", { headers })).status,
          200,
        );
        assert.equal(
          (
            await call("/api/admin/hours", {
              method: "POST",
              headers: { Cookie: cookie },
              body: "{}",
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await call("/api/admin/hours", {
              method: "POST",
              headers,
              body: JSON.stringify({
                hours: [{ weekday: 1, opens: "18:00", closes: "09:00" }],
              }),
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await call("/api/admin/retention", {
              method: "POST",
              headers,
              body: "{}",
            })
          ).status,
          400,
        );
        const settings = await call("/api/admin/settings", { headers });
        const service = settings.body.services[0];
        assert.equal(
          (
            await call("/api/admin/services/" + service.id, {
              method: "POST",
              headers,
              body: JSON.stringify(service),
            })
          ).status,
          200,
        );
        const ops = await call("/api/admin/operations", { headers });
        assert.ok(ops.body.audit.some((a) => a.action === "service.update"));
        assert.equal(
          (
            await call("/api/admin/logout", {
              method: "POST",
              headers,
              body: "{}",
            })
          ).status,
          200,
        );
        assert.equal(
          (await call("/api/admin/session", { headers })).status,
          401,
        );
        for (let i = 0; i < 6; i++) {
          const r = await call("/api/admin/login", {
            method: "POST",
            body: JSON.stringify({ username: "owner", password: "wrong" }),
          });
          assert.equal(r.status, i === 5 ? 429 : 401);
        }
      },
    );
    await t.test("rate limiter rejects repeated requests", async () => {
      const limited = createApp({
        pool,
        tokenSecret: process.env.BOOKING_TOKEN_SECRET,
        rateLimit: 2,
      });
      const listener = limited.listen(0, "127.0.0.1");
      await new Promise((r) => listener.on("listening", r));
      try {
        for (let i = 0; i < 3; i++) {
          const r = await fetch(
            `http://127.0.0.1:${listener.address().port}/api/services`,
          );
          assert.equal(r.status, i === 2 ? 429 : 200);
        }
      } finally {
        limited.locals.stopRateLimiter();
        await new Promise((r) => listener.close(r));
      }
    });
  } finally {
    // Only IDs created by this test are removed; other staged bookings are untouched.
    for (const record of created)
      await pool.query("DELETE FROM bookings WHERE id=$1", [record.id]);
    app.locals.stopRateLimiter();
    await new Promise((r) => server.close(r));
    await pool.end();
  }
});
test("fictional demo scenarios, occupied resources, roles, retention and logs", async () => {
  const pool = createPool();
  await migrate(pool);
  let clock = DateTime.fromISO("2026-10-01T00:00:00Z");
  const resource = (
      await pool.query("SELECT * FROM resources WHERE id='studio-room'")
    ).rows[0],
    oldHours = (
      await pool.query(
        "SELECT * FROM opening_hours WHERE resource_id='studio-room'",
      )
    ).rows,
    oldServices = (await pool.query("SELECT id,active FROM services")).rows;
  const app = createApp({
    pool,
    tokenSecret: process.env.BOOKING_TOKEN_SECRET,
    adminPasswordHash: await passwordHash("demo-owner"),
    supportPasswordHash: await passwordHash("demo-support"),
    now: () => clock,
    rateLimit: 10000,
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie, csrf;
  const ids = [],
    blocks = [];
  const call = async (path, body, headers = {}) => {
    const r = await fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie, "X-CSRF-Token": csrf } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return {
      status: r.status,
      body: r.headers.get("content-type")?.includes("json")
        ? await r.json()
        : await r.text(),
      headers: r.headers,
    };
  };
  try {
    const login = await call("/api/admin/login", {
      username: "owner",
      password: "demo-owner",
    });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie").split(";")[0];
    csrf = login.body.csrf;
    assert.equal(
      (
        await call("/api/admin/demo/profile", {
          confirmation: "USE FICTIONAL DEMO RULES",
        })
      ).status,
      200,
    );
    const catalog = await call("/api/services");
    assert.equal(catalog.body.services.length, 1);
    assert.equal(catalog.body.services[0].currency, "MKD");
    assert.equal(catalog.body.services[0].price, 1400);
    const slots = (
      await call("/api/slots?serviceId=demo-relaxation&date=2026-10-05")
    ).body.slots;
    assert.equal(slots[0].label, "10:15");
    assert.equal(slots.at(-1).label, "16:45");
    assert.ok(!slots.some((s) => s.label === "12:00"));
    const payload = {
      serviceId: "demo-relaxation",
      startsAt: slots[0].startsAt,
      name: "Demo Guest",
      email: "demo-guest@example.com",
    };
    const key = randomUUID();
    const booking = await call("/api/bookings", payload, {
      "Idempotency-Key": key,
    });
    assert.equal(booking.status, 201);
    ids.push(booking.body.booking.id);
    const auth = { Authorization: "Bearer " + booking.body.accessToken };
    const replay = await call("/api/bookings", payload, {
      "Idempotency-Key": key,
    });
    assert.equal(replay.body.booking.id, ids[0]);
    const competing = await call("/api/admin/demo/bookings", {
      ...payload,
      channel: "phone",
      requestId: randomUUID(),
    });
    assert.equal(competing.status, 409);
    const block = await call("/api/admin/demo/blocks", {
      kind: "travel",
      startsAt: slots[0].occupiedFrom,
      endsAt: slots[0].occupiedUntil,
      reason: "Demo travel",
    });
    assert.equal(block.status, 409);
    const closure = await call("/api/admin/demo/blocks", {
      kind: "closure",
      startsAt: slots[0].occupiedFrom,
      endsAt: slots[0].occupiedUntil,
      reason: "Demo closure",
      cancelBookingIds: ids,
    });
    assert.equal(closure.status, 201);
    blocks.push(closure.body.id);
    assert.equal(
      (await call("/api/bookings/" + ids[0], null, auth)).body.booking.status,
      "cancelled",
    );
    const owner = await call("/api/admin/demo/bookings", {
      ...payload,
      startsAt: slots.at(-1).startsAt,
      channel: "messaging",
      requestId: randomUUID(),
    });
    assert.equal(owner.status, 201);
    ids.push(owner.body.id);
    assert.equal(
      (
        await call(
          "/api/admin/demo/bookings/" + owner.body.id + "/reschedule",
          { startsAt: slots[0].startsAt },
        )
      ).status,
      409,
    );
    const saved = (
      await pool.query("SELECT starts_at FROM bookings WHERE id=$1", [
        owner.body.id,
      ])
    ).rows[0];
    assert.equal(
      new Date(saved.starts_at).toISOString(),
      slots.at(-1).startsAt,
    );
    const moved = slots.find((s) => s.label === "14:15");
    assert.equal(
      (
        await call(
          "/api/admin/demo/bookings/" + owner.body.id + "/reschedule",
          { startsAt: moved.startsAt },
        )
      ).status,
      200,
    );
    const next = (
      await call("/api/slots?serviceId=demo-relaxation&date=2026-10-06")
    ).body.slots[0];
    const second = await call(
      "/api/bookings",
      { ...payload, startsAt: next.startsAt },
      { "Idempotency-Key": randomUUID() },
    );
    assert.equal(second.status, 201);
    ids.push(second.body.booking.id);
    clock = DateTime.fromISO(next.startsAt).minus({ minutes: 1439 });
    const late = await call(
      "/api/bookings/" + ids.at(-1) + "/cancel",
      {},
      { Authorization: "Bearer " + second.body.accessToken },
    );
    assert.equal(late.status, 202);
    assert.equal(late.body.booking.status, "confirmed");
    clock = DateTime.fromISO(next.startsAt).minus({ minutes: 1440 });
    assert.equal(
      (
        await call(
          "/api/bookings/" + ids.at(-1) + "/cancel",
          {},
          { Authorization: "Bearer " + second.body.accessToken },
        )
      ).body.booking.status,
      "cancelled",
    );
    clock = DateTime.fromISO(moved.startsAt).plus({ minutes: 14 });
    assert.equal(
      (
        await call("/api/admin/demo/bookings/" + owner.body.id + "/outcome", {
          outcome: "no_show",
          paid: false,
        })
      ).status,
      400,
    );
    clock = clock.plus({ minutes: 1 });
    assert.equal(
      (
        await call("/api/admin/demo/bookings/" + owner.body.id + "/outcome", {
          outcome: "no_show",
          paid: false,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await pool.query("SELECT active FROM calendar_entries WHERE id=$1", [
          owner.body.id,
        ])
      ).rows[0].active,
      true,
    );
    const record = await call("/api/admin/demo/records", {
      kind: "economics",
      data: {
        channel: "web",
        minutes: 2,
        manual: false,
        entryError: false,
        outcome: "attended",
        paid: true,
      },
    });
    assert.equal(record.status, 201);
    assert.match(
      (await call("/api/admin/demo/economics.csv")).body,
      /web,2,false,false,attended,true/,
    );
    assert.equal((await call("/api/admin/retention")).body.days, 30);
    await call("/api/admin/logout", {});
    cookie = null;
    const support = await call("/api/admin/login", {
      username: "support",
      password: "demo-support",
    });
    cookie = support.headers.get("set-cookie").split(";")[0];
    csrf = support.body.csrf;
    assert.equal(support.body.role, "viewer");
    assert.equal((await call("/api/admin/operations")).status, 200);
    assert.equal((await call("/api/admin/bookings")).status, 403);
    assert.equal(
      (
        await call("/api/admin/demo/profile", {
          confirmation: "USE FICTIONAL DEMO RULES",
        })
      ).status,
      403,
    );
    await call("/api/admin/logout", {});
  } finally {
    for (const id of ids)
      await pool.query("DELETE FROM bookings WHERE id=$1", [id]);
    for (const id of blocks)
      await pool.query("DELETE FROM calendar_entries WHERE id=$1", [id]);
    await pool.query("DELETE FROM demo_records");
    await pool.query(
      "UPDATE resources SET profile=$1,lead_minutes=$2,buffer_before=$3,buffer_after=$4,lunch_opens=$5,lunch_closes=$6 WHERE id='studio-room'",
      [
        resource.profile,
        resource.lead_minutes,
        resource.buffer_before,
        resource.buffer_after,
        resource.lunch_opens,
        resource.lunch_closes,
      ],
    );
    await pool.query(
      "DELETE FROM opening_hours WHERE resource_id='studio-room'",
    );
    for (const h of oldHours)
      await pool.query("INSERT INTO opening_hours VALUES($1,$2,$3,$4)", [
        h.resource_id,
        h.weekday,
        h.opens,
        h.closes,
      ]);
    await pool.query(
      "UPDATE services SET active=false WHERE id='demo-relaxation'",
    );
    for (const s of oldServices)
      await pool.query("UPDATE services SET active=$1 WHERE id=$2", [
        s.active,
        s.id,
      ]);
    app.locals.stopRateLimiter();
    await new Promise((r) => server.close(r));
    await pool.end();
  }
});
