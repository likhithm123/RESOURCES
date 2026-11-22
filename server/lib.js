// Helpers: errors, crypto, validation, rate limiting, audit, email, ImageKit.
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { db } from "./db.js";

const e = process.env;
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const fail = (status, message) => { throw new HttpError(status, message); };

export const randomToken = (n = 32) => crypto.randomBytes(n).toString("base64url");
export const sha256 = s => crypto.createHash("sha256").update(s).digest("hex");
export const hmacHex = (alg, key, msg) => crypto.createHmac(alg, key).update(msg).digest("hex");
export const safeEqual = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
export const secret = () => e.SESSION_SECRET || fail(500, "SESSION_SECRET is not set");

// Passwords: scrypt with a random salt.
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("base64")}$${crypto.scryptSync(pw, salt, 64).toString("base64")}`;
}
export function verifyPassword(pw, stored) {
  const [scheme, salt, hash] = String(stored).split("$");
  if (scheme !== "scrypt") return false;
  return safeEqual(crypto.scryptSync(pw, Buffer.from(salt, "base64"), 64).toString("base64"), hash);
}
export function checkPassword(p) {
  const s = String(p || "");
  if (s.length < 8 || s.length > 128) fail(400, "Password must be 8-128 characters.");
  if (!/[A-Za-z]/.test(s) || !/[0-9]/.test(s)) fail(400, "Password must contain letters and numbers.");
  return s;
}
export const cleanEmail = v => {
  const s = String(v || "").trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/.test(s)) fail(400, "Enter a valid email address.");
  return s;
};
export const str = (v, max) => String(v ?? "").trim().slice(0, max);
export const safeUrl = v => {
  const s = str(v, 1000);
  try { const u = new URL(s); return ["http:", "https:"].includes(u.protocol) ? u.toString() : ""; } catch { return ""; }
};
export const jsonArr = (v, max = 60) => JSON.stringify([...new Set((Array.isArray(v) ? v : []).map(x => str(x, 80)).filter(Boolean))].slice(0, max));
export const parse = (s, d) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
export const adminEmails = () => (e.ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
export const clientIp = c => (c.req.header("x-forwarded-for") || "").split(",")[0].trim() || "local";

export async function rateLimit(bucket, limit, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  await db.run(`INSERT INTO rp_rate (bucket, count, reset_at) VALUES (?1, 1, ?2)
    ON CONFLICT(bucket) DO UPDATE SET count = CASE WHEN reset_at <= ?3 THEN 1 ELSE count + 1 END,
    reset_at = CASE WHEN reset_at <= ?3 THEN ?2 ELSE reset_at END`, [bucket, now + windowSec, now]);
  const row = await db.first("SELECT count, reset_at FROM rp_rate WHERE bucket = ?", [bucket]);
  if (row && row.count > limit) fail(429, `Too many attempts. Try again in ${Math.max(1, Math.ceil((row.reset_at - now) / 60))} minute(s).`);
}
export const audit = (c, action, detail = "") =>
  db.run("INSERT INTO rp_audit (user_id, action, detail, ip) VALUES (?, ?, ?, ?)", [c.get("user")?.id ?? null, action, String(detail).slice(0, 500), clientIp(c)]);

/** Calculates current streak, longest streak, today status, and 7-day rolling week history.
 * Rule: User MUST study / complete at least one topic on a day for that day to count.
 * If not done on a day (e.g. yesterday was missed), streak resets to zero!
 */
export function calculateStreak(dayStrings, refDateStr) {
  const now = new Date();
  const todayStr = refDateStr || now.toISOString().slice(0, 10);
  const today = new Date(todayStr + "T00:00:00Z");

  const uniqueDays = Array.from(new Set(dayStrings || [])).filter(Boolean).sort();
  
  // Build rolling 7-day week view ending today
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    week.push({
      name: weekDays[d.getUTCDay()],
      date: dateStr,
      done: uniqueDays.includes(dateStr),
      isToday: i === 0,
    });
  }

  if (!uniqueDays.length) {
    return {
      current: 0,
      longest: 0,
      todayDone: false,
      status: "broken",
      days: [],
      week,
      message: "Start your streak today! Study 1 topic to reach Day 1."
    };
  }

  const dateObjs = uniqueDays.map(d => new Date(d + "T00:00:00Z"));
  
  // Calculate historical longest streak
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < dateObjs.length; i++) {
    const diffDays = Math.round((dateObjs[i] - dateObjs[i - 1]) / 86400000);
    if (diffDays === 1) {
      cur++;
      if (cur > longest) longest = cur;
    } else if (diffDays > 1) {
      cur = 1;
    }
  }

  const lastActive = dateObjs[dateObjs.length - 1];
  const daysSinceLast = Math.round((today - lastActive) / 86400000);

  const todayDone = daysSinceLast === 0;
  let current = 0;
  let status = "broken";
  let message = "";

  if (todayDone) {
    // User studied today! Calculate consecutive days backward from today
    current = 1;
    for (let i = dateObjs.length - 1; i > 0; i--) {
      const diffDays = Math.round((dateObjs[i] - dateObjs[i - 1]) / 86400000);
      if (diffDays === 1) current++;
      else break;
    }
    status = "active";
    message = `Streak active! You completed study goals for today (${current} day streak).`;
  } else if (daysSinceLast === 1) {
    // User studied yesterday, but has not completed study goals today yet.
    // Streak is active from yesterday, but pending today's study.
    current = 1;
    for (let i = dateObjs.length - 1; i > 0; i--) {
      const diffDays = Math.round((dateObjs[i] - dateObjs[i - 1]) / 86400000);
      if (diffDays === 1) current++;
      else break;
    }
    status = "at_risk";
    message = `Streak at risk! Complete at least 1 topic today to maintain your ${current}-day streak.`;
  } else {
    // Missed yesterday! Streak resets to zero.
    current = 0;
    status = "broken";
    message = "Your streak reset to 0 because yesterday was missed. Study 1 topic today to start a new streak!";
  }

  if (current > longest) longest = current;

  return { current, longest, todayDone, status, days: uniqueDays, week, message };
}

/* ---------------- Email (SMTP) ---------------- */
let transport;
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
export async function sendMail(to, subject, heading, bodyHtml, text) {
  if (!e.SMTP_HOST || !e.SMTP_USER) { console.log(`[mail not configured] to=${to} | ${subject} | ${text}`); return false; }
  transport ||= nodemailer.createTransport({
    host: e.SMTP_HOST, port: Number(e.SMTP_PORT || 465),
    secure: String(e.SMTP_SECURE).toLowerCase() === "true" || e.SMTP_PORT === "465",
    auth: { user: e.SMTP_USER, pass: e.SMTP_PASS },
  });
  const app = esc(e.APP_NAME || "Resources Portal");
  const html = `<div style="background:#f4f5fb;padding:24px;font-family:Segoe UI,Arial,sans-serif;color:#1f2433">
  <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e3e5f0">
  <div style="font-size:13px;color:#5b6274">${app}</div><h2 style="margin:8px 0 14px;font-size:20px;color:#1b3fae">${esc(heading)}</h2>${bodyHtml}
  <p style="font-size:12px;color:#8a90a2;margin-top:24px">If you did not request this, you can ignore this email.</p></div></div>`;
  try { await transport.sendMail({ from: `"${e.APP_NAME || "Resources Portal"}" <${e.SMTP_FROM || e.SMTP_USER}>`, to, subject, text, html }); return true; }
  catch (err) { console.error("mail failed:", err.message); return false; }
}

const PURPOSE = { verify: "verify your email", login: "sign in", reset: "reset your password" };
/** Creates a 6-digit code, stores its hash, emails it. */
export async function issueOtp(email, purpose) {
  await rateLimit(`otp:${purpose}:${email}`, 5, 15 * 60);
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const now = Math.floor(Date.now() / 1000);
  await db.run("UPDATE rp_otps SET used = 1 WHERE email = ? AND purpose = ? AND used = 0", [email, purpose]);
  await db.run("INSERT INTO rp_otps (email, purpose, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    [email, purpose, sha256(`${code}:${email}:${purpose}:${secret()}`), now + 600, now]);
  if (e.DEV_LOG_OTP === "1") console.log(`[DEV OTP] ${purpose} ${email}: ${code}`);
  if (e.DEV_NO_MAIL === "1") return;
  await sendMail(email, `${code} is your code to ${PURPOSE[purpose]}`, `Your code to ${PURPOSE[purpose]}`,
    `<p>Use this code within 10 minutes:</p><p style="font-size:30px;letter-spacing:8px;font-weight:700;color:#161616">${code}</p>`,
    `Your code to ${PURPOSE[purpose]}: ${code} (valid for 10 minutes)`);
}
export async function consumeOtp(email, purpose, code) {
  const now = Math.floor(Date.now() / 1000);
  const row = await db.first("SELECT * FROM rp_otps WHERE email = ? AND purpose = ? AND used = 0 ORDER BY id DESC LIMIT 1", [email, purpose]);
  if (!row || row.expires_at < now) fail(400, "The code has expired. Request a new one.");
  if (row.attempts >= 5) fail(429, "Too many wrong attempts. Request a new code.");
  if (!safeEqual(row.code_hash, sha256(`${String(code || "").trim()}:${email}:${purpose}:${secret()}`))) {
    await db.run("UPDATE rp_otps SET attempts = attempts + 1 WHERE id = ?", [row.id]);
    fail(400, "That code is not correct.");
  }
  await db.run("UPDATE rp_otps SET used = 1 WHERE id = ?", [row.id]);
}

/* ---------------- ImageKit (private page images) ---------------- */
const ikBase = () => (e.IMAGEKIT_URL_ENDPOINT || "").replace(/\/+$/, "");
const ikAuth = () => "Basic " + Buffer.from(e.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
export const ikFolder = () => (e.IMAGEKIT_FOLDER || "/resources-portal").replace(/\/+$/, "");
export const ikConfigured = () => !!(e.IMAGEKIT_PRIVATE_KEY && e.IMAGEKIT_PUBLIC_KEY && e.IMAGEKIT_URL_ENDPOINT);
export const pageName = n => `p-${String(n).padStart(4, "0")}.jpg`;

/** Signature so an admin's browser can upload page images straight to ImageKit. */
export function ikUploadAuth() {
  const token = crypto.randomUUID(), expire = Math.floor(Date.now() / 1000) + 30 * 60;
  return { token, expire, signature: hmacHex("sha1", e.IMAGEKIT_PRIVATE_KEY, token + expire), publicKey: e.IMAGEKIT_PUBLIC_KEY };
}
/** Signed, short-lived URL of a private file (same algorithm as the ImageKit SDKs). */
export function ikSignedUrl(filePath, transform, ttl = 120) {
  const url = new URL(ikBase() + "/" + filePath.replace(/^\/+/, ""));
  if (transform) url.searchParams.set("tr", transform);
  const expire = Math.floor(Date.now() / 1000) + ttl;
  const sig = hmacHex("sha1", e.IMAGEKIT_PRIVATE_KEY, url.toString().replace(ikBase() + "/", "") + expire);
  url.searchParams.append("ik-t", String(expire)); url.searchParams.append("ik-s", sig);
  return url.toString();
}
/** Fetches one page image with the viewer's identity burnt in as a faint diagonal watermark. */
export async function ikPage(folder, page, watermark, width = 1100) {
  const wm = Buffer.from(watermark).toString("base64").replace(/=+$/, "");
  const size = `w-${width},f-webp,q-78`;                                   // WebP sized to the screen: ~4x smaller than JPEG
  const tr = `${size}:l-text,ie-${encodeURIComponent(wm)},fs-${Math.round(width / 46)},co-1B3FAE,al-2,rt-N30,lfo-center,l-end`;
  let res = await fetch(ikSignedUrl(`${folder}/${pageName(page)}`, tr));
  if (!res.ok) res = await fetch(ikSignedUrl(`${folder}/${pageName(page)}`, size));
  if (!res.ok) fail(res.status === 404 ? 404 : 502, "Could not load this page.");
  return Buffer.from(await res.arrayBuffer());
}
export async function ikDeleteFolder(folderPath) {
  const res = await fetch("https://api.imagekit.io/v1/folder", { method: "DELETE", headers: { Authorization: ikAuth(), "Content-Type": "application/json" }, body: JSON.stringify({ folderPath }) });
  if (!res.ok && res.status !== 404) console.error("ImageKit folder delete failed", res.status);
}
