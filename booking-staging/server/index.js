import { createPool, migrate } from "./db.js";
import { createApp } from "./app.js";
const pool = createPool();
pool.on("error", () => console.error("Database connection interrupted"));
await migrate(pool);
const app = createApp({
  pool,
  tokenSecret: process.env.BOOKING_TOKEN_SECRET,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
  supportPasswordHash: process.env.SUPPORT_PASSWORD_HASH,
});
const server = app.listen(
  Number(process.env.PORT || 4174),
  process.env.HOST || "127.0.0.1",
  () => console.log("Kindred staging server ready"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    app.locals.stopRateLimiter();
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
