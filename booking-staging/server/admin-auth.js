import {
  randomBytes,
  createHash,
  createHmac,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const derive = promisify(scrypt);
const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function passwordHash(
  password,
  salt = randomBytes(16).toString("hex"),
) {
  const value = await derive(password, salt, 64);
  return `scrypt:${salt}:${value.toString("hex")}`;
}
export async function verifyPassword(password, encoded) {
  if (
    typeof password !== "string" ||
    password.length > 128 ||
    !/^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/.test(encoded || "")
  )
    return false;
  const [, salt, digest] = encoded.split(":");
  const actual = await derive(password, salt, 64),
    expected = Buffer.from(digest, "hex");
  return timingSafeEqual(actual, expected);
}
function cookie(req) {
  const value = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("kindred_admin="))
    ?.slice("kindred_admin=".length);
  return value && /^[0-9a-f]{64}$/.test(value) ? value : null;
}
export function adminAuth({
  pool,
  secret,
  passwordDigest,
  username = "owner",
  clock = () => Date.now(),
}) {
  const attempts = new Map(),
    tokenCsrf = (token) =>
      createHmac("sha256", secret).update(`csrf:${token}`).digest("hex");
  const cookieOptions = (req) => ({
    httpOnly: true,
    secure: req.secure || process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/admin",
    maxAge: 8 * 60 * 60 * 1000,
  });
  async function session(req, res, next) {
    const token = cookie(req);
    if (!token)
      return res.status(401).json({ error: "Sign in to administration." });
    const {
      rows: [record],
    } = await pool.query(
      "SELECT actor FROM admin_sessions WHERE token_hash=$1 AND expires_at > now()",
      [hash(token)],
    );
    if (!record)
      return res
        .status(401)
        .json({ error: "Your session expired. Sign in again." });
    req.admin = { actor: record.actor, token, csrf: tokenCsrf(token) };
    if (!["GET", "HEAD"].includes(req.method)) {
      const provided = req.get("x-csrf-token") || "";
      if (
        !/^[0-9a-f]{64}$/.test(provided) ||
        !timingSafeEqual(Buffer.from(provided), Buffer.from(req.admin.csrf))
      )
        return res
          .status(403)
          .json({ error: "Reload administration before making changes." });
    }
    next();
  }
  async function login(req, res) {
    if (!passwordDigest)
      return res
        .status(503)
        .json({ error: "Administration is not configured." });
    const time = clock(),
      ip = req.ip,
      prior = attempts.get(ip);
    if (prior && prior.until > time && prior.count >= 5) {
      res.set("Retry-After", String(Math.ceil((prior.until - time) / 1000)));
      return res
        .status(429)
        .json({ error: "Too many sign-in attempts. Wait 15 minutes." });
    }
    const validUser = req.body?.username === username;
    const valid = await verifyPassword(req.body?.password, passwordDigest);
    if (!validUser || !valid) {
      const state =
        prior && prior.until > time
          ? prior
          : { count: 0, until: time + 15 * 60 * 1000 };
      state.count++;
      attempts.set(ip, state);
      for (const [key, state] of attempts)
        if (state.until < time) attempts.delete(key);
      return res
        .status(401)
        .json({ error: "The username or password is incorrect." });
    }
    attempts.delete(ip);
    const token = randomBytes(32).toString("hex");
    await pool.query(
      "INSERT INTO admin_sessions(token_hash,actor,expires_at) VALUES($1,$2,now()+interval '8 hours')",
      [hash(token), username],
    );
    res.cookie("kindred_admin", token, cookieOptions(req));
    res.json({ username, csrf: tokenCsrf(token) });
  }
  async function logout(req, res) {
    await pool.query("DELETE FROM admin_sessions WHERE token_hash=$1", [
      hash(req.admin.token),
    ]);
    res.clearCookie("kindred_admin", {
      ...cookieOptions(req),
      maxAge: undefined,
    });
    res.json({ ok: true });
  }
  return { session, login, logout };
}
