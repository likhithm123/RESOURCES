// Resources portal API (Hono). Runs as one Vercel function and locally with @hono/node-server.
import crypto from "node:crypto";
import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { db } from "./db.js";
import { analyzeJD } from "./jd_engine.js";
import {
  HttpError, fail, randomToken, sha256, hmacHex, safeEqual, secret, hashPassword, verifyPassword, checkPassword,
  cleanEmail, str, safeUrl, jsonArr, parse, adminEmails, clientIp, rateLimit, audit, issueOtp, consumeOtp,
  ikConfigured, ikFolder, ikUploadAuth, ikPage, ikDeleteFolder, sendMail, calculateStreak,
} from "./lib.js";

const COOKIE = "rp_session";
const SESSION_DAYS = 7;
const prod = () => process.env.NODE_ENV === "production" || !!process.env.VERCEL;
export const app = new Hono().basePath("/api");

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Something went wrong. Please try again." }, 500);
});

// Security headers + CSRF guard (state-changing requests must be same-origin JSON with a custom header).
app.use("*", async (c, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    if (c.req.header("x-requested-with") !== "portal") fail(403, "Bad request origin.");
    const origin = c.req.header("origin");
    if (prod() && origin && new URL(origin).host !== (c.req.header("x-forwarded-host") || c.req.header("host"))) fail(403, "Bad request origin.");
  }
  await next();
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
});

// Session loader.
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/view/")) { c.set("user", null); return next(); }    // verified by the view token instead
  const token = getCookie(c, COOKIE);
  let user = null;
  if (token) {
    user = await db.first(
      `SELECT u.id, u.name, u.email, u.role, u.status, u.career_roles, u.plan FROM rp_sessions s JOIN rp_users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`, [sha256(token), Math.floor(Date.now() / 1000)]);
    if (user && user.status !== "active") user = null;
  }
  c.set("user", user);
  await next();
});
const auth = c => c.get("user") || fail(401, "Please sign in.");
const admin = c => { const u = auth(c); if (u.role !== "admin") fail(403, "Admins only."); return u; };
const body = async c => (await c.req.json().catch(() => ({}))) || {};
const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, career_roles: parse(u.career_roles, []), plan: parse(u.plan, []) });

async function startSession(c, userId) {
  const token = randomToken();
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  await db.run("INSERT INTO rp_sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", [sha256(token), userId, exp]);
  await db.run("UPDATE rp_users SET last_login_at = datetime('now') WHERE id = ?", [userId]);
  await db.run("DELETE FROM rp_sessions WHERE expires_at < ?", [Math.floor(Date.now() / 1000)]);
  await db.run("INSERT INTO rp_audit (user_id, action, detail, ip) VALUES (?, ?, ?, ?)", [userId, "auth.login", "User signed in", clientIp(c)]);
  setCookie(c, COOKIE, token, { httpOnly: true, secure: prod(), sameSite: "Strict", path: "/", maxAge: SESSION_DAYS * 86400 });
}

/* ---------------- Auth ---------------- */
// Step 1 of sign-up: create (or refresh) an unverified account and email a code.
app.post("/auth/signup", async c => {
  const b = await body(c);
  const email = cleanEmail(b.email), name = str(b.name, 80), password = checkPassword(b.password);
  if (name.length < 2) fail(400, "Enter your name.");
  const phone = str(b.phone, 15);
  if (!phone) fail(400, "Enter your contact number.");
  await rateLimit(`signup:${clientIp(c)}`, 10, 3600);
  const existing = await db.first("SELECT id, status FROM rp_users WHERE email = ?", [email]);
  if (existing && existing.status !== "unverified") fail(409, "An account with this email already exists. Please sign in.");
  const ALL_ROLES = ["sde", "fullstack", "ai", "ml", "data", "devops", "security", "salesforce"];
  const roles = jsonArr(b.career_roles !== undefined ? b.career_roles : ALL_ROLES, 12);
  if (existing) await db.run("UPDATE rp_users SET name = ?, pass_hash = ?, career_roles = ?, phone = ? WHERE id = ?", [name, hashPassword(password), roles, phone, existing.id]);
  else await db.run("INSERT INTO rp_users (name, email, pass_hash, career_roles, phone) VALUES (?, ?, ?, ?, ?)", [name, email, hashPassword(password), roles, phone]);
  await issueOtp(email, "verify");
  return c.json({ ok: true, otp: true });
});
// Step 2: prove the email with the code. The account becomes active (no admin approval needed).
app.post("/auth/verify", async c => {
  const b = await body(c); const email = cleanEmail(b.email);
  await rateLimit(`verify:${email}`, 10, 900);
  const u = await db.first("SELECT * FROM rp_users WHERE email = ?", [email]);
  if (!u) fail(400, "Sign up first.");
  await consumeOtp(email, "verify", b.code);
  const role = adminEmails().includes(email) ? "admin" : u.role;
  await db.run("UPDATE rp_users SET status = 'active', role = ? WHERE id = ?", [role, u.id]);
  await startSession(c, u.id);
  return c.json({ ok: true, user: pub({ ...u, role }) });
});
// Sign-in with email + password. Unverified accounts are sent a verification code first.
app.post("/auth/login", async c => {
  const b = await body(c); const email = cleanEmail(b.email);
  await rateLimit(`login:${email}`, 8, 900); await rateLimit(`login-ip:${clientIp(c)}`, 40, 900);
  const u = await db.first("SELECT * FROM rp_users WHERE email = ?", [email]);
  if (!u || !verifyPassword(String(b.password || ""), u.pass_hash)) fail(401, "Email or password is incorrect.");
  if (u.status === "blocked") fail(403, "This account has been blocked. Contact the admin.");
  if (u.status === "unverified") { await issueOtp(email, "verify"); return c.json({ ok: true, otp: true, purpose: "verify" }); }
  if (adminEmails().includes(email) && u.role !== "admin") { await db.run("UPDATE rp_users SET role = 'admin' WHERE id = ?", [u.id]); u.role = "admin"; }
  await startSession(c, u.id);                        // password is enough; codes are only for sign-up and reset
  return c.json({ ok: true, user: pub(u) });
});
app.post("/auth/login/verify", async c => {
  const b = await body(c); const email = cleanEmail(b.email);
  await rateLimit(`loginv:${email}`, 10, 900);
  const u = await db.first("SELECT * FROM rp_users WHERE email = ? AND status = 'active'", [email]);
  if (!u) fail(400, "Sign in again.");
  await consumeOtp(email, "login", b.code);
  if (adminEmails().includes(email) && u.role !== "admin") { await db.run("UPDATE rp_users SET role = 'admin' WHERE id = ?", [u.id]); u.role = "admin"; }
  await startSession(c, u.id);
  return c.json({ ok: true, user: pub(u) });
});
app.post("/auth/logout", async c => {
  const token = getCookie(c, COOKIE);
  if (token) {
    const s = await db.first("SELECT user_id FROM rp_sessions WHERE token_hash = ?", [sha256(token)]);
    if (s?.user_id) {
      await db.run("INSERT INTO rp_audit (user_id, action, detail, ip) VALUES (?, ?, ?, ?)", [s.user_id, "auth.logout", "User signed out", clientIp(c)]);
    }
    await db.run("DELETE FROM rp_sessions WHERE token_hash = ?", [sha256(token)]);
  }
  deleteCookie(c, COOKIE, { path: "/" });
  return c.json({ ok: true });
});
app.post("/auth/resend", async c => {
  const b = await body(c);
  const email = cleanEmail(b.email);
  const purpose = b.purpose === "reset" ? "reset" : "verify";
  await rateLimit(`resend:${email}`, 6, 300);
  const u = await db.first("SELECT id, status FROM rp_users WHERE email = ? AND status != 'blocked'", [email]);
  if (!u) fail(404, "Account not found. Please sign up.");
  await issueOtp(email, purpose);
  return c.json({ ok: true });
});
app.post("/auth/forgot", async c => {
  const email = cleanEmail((await body(c)).email);
  await rateLimit(`forgot-ip:${clientIp(c)}`, 10, 3600);
  const u = await db.first("SELECT id FROM rp_users WHERE email = ? AND status != 'blocked'", [email]);
  if (u) await issueOtp(email, "reset");
  return c.json({ ok: true });                       // same answer whether or not the account exists
});
app.post("/auth/reset", async c => {
  const b = await body(c); const email = cleanEmail(b.email), password = checkPassword(b.password);
  await rateLimit(`reset:${email}`, 10, 900);
  const u = await db.first("SELECT id FROM rp_users WHERE email = ?", [email]);
  if (!u) fail(400, "The code has expired. Request a new one.");
  await consumeOtp(email, "reset", b.code);
  await db.run("UPDATE rp_users SET pass_hash = ?, status = CASE WHEN status = 'unverified' THEN 'active' ELSE status END WHERE id = ?", [hashPassword(password), u.id]);
  await db.run("DELETE FROM rp_sessions WHERE user_id = ?", [u.id]);
  return c.json({ ok: true });
});

app.get("/me", c => c.json({ user: c.get("user") ? pub(c.get("user")) : null }));
app.put("/me", async c => {
  const u = auth(c), b = await body(c);
  const name = str(b.name ?? u.name, 80); if (name.length < 2) fail(400, "Enter your name.");
  await db.run("UPDATE rp_users SET name = ?, career_roles = ?, plan = ? WHERE id = ?",
    [name, jsonArr(b.career_roles ?? parse(u.career_roles, []), 12), jsonArr(b.plan ?? parse(u.plan, []), 80), u.id]);
  return c.json({ ok: true });
});

/* ---------------- Progress (track sheet & daily study streaks) ---------------- */
app.get("/progress", async c => {
  const u = auth(c);
  const today = new Date().toISOString().slice(0, 10);

  // Fetch actual study progress records (curriculum items and JD checklists)
  const [doneRows, checklistRows] = await Promise.all([
    db.all("SELECT item_id, updated_at FROM rp_progress WHERE user_id = ?", [u.id]),
    db.all("SELECT substr(updated_at, 1, 10) as day FROM rp_job_checklists WHERE user_id = ?", [u.id])
  ]);

  const progressDays = doneRows.map(r => r.updated_at ? r.updated_at.slice(0, 10) : "").filter(Boolean);
  const checklistDays = checklistRows.map(r => r.day).filter(Boolean);

  // ONLY actual study days count toward the streak. Visits, logins, or manual overrides cannot inflate it.
  const allStudyDays = Array.from(new Set([...progressDays, ...checklistDays]));
  const streak = calculateStreak(allStudyDays, today);
  const topicsDoneToday = doneRows.filter(r => r.updated_at && r.updated_at.slice(0, 10) === today).length;

  return c.json({
    done: doneRows.map(r => r.item_id),
    streak,
    today_done: streak.todayDone,
    topics_done_today: topicsDoneToday
  });
});

app.post("/progress", async c => {
  const u = auth(c), b = await body(c);
  const items = (Array.isArray(b.items) ? b.items : [b.item_id]).map(x => str(x, 220)).filter(Boolean).slice(0, 400);
  for (const id of items) {
    if (b.done) {
      await db.run(
        "INSERT INTO rp_progress (user_id, item_id, updated_at) VALUES (?, ?, datetime('now')) " +
        "ON CONFLICT(user_id, item_id) DO UPDATE SET updated_at = datetime('now')",
        [u.id, id]
      );
      await db.run(
        "INSERT INTO rp_audit (user_id, action, detail, ip, created_at) VALUES (?, 'study.progress', ?, ?, datetime('now'))",
        [u.id, `Completed ${id}`, clientIp(c)]
      );
    } else {
      await db.run("DELETE FROM rp_progress WHERE user_id = ? AND item_id = ?", [u.id, id]);
    }
  }

  // Recalculate streak immediately after progress update
  const today = new Date().toISOString().slice(0, 10);
  const [doneRows, checklistRows] = await Promise.all([
    db.all("SELECT item_id, updated_at FROM rp_progress WHERE user_id = ?", [u.id]),
    db.all("SELECT substr(updated_at, 1, 10) as day FROM rp_job_checklists WHERE user_id = ?", [u.id])
  ]);
  const progressDays = doneRows.map(r => r.updated_at ? r.updated_at.slice(0, 10) : "").filter(Boolean);
  const checklistDays = checklistRows.map(r => r.day).filter(Boolean);
  const allStudyDays = Array.from(new Set([...progressDays, ...checklistDays]));
  const streak = calculateStreak(allStudyDays, today);

  return c.json({ ok: true, streak });
});

/* ---------------- Documents and the protected viewer ---------------- */
const docView = d => ({ id: d.id, slug: d.slug, title: d.title, description: d.description, career_roles: parse(d.career_roles, []), pages: d.pages, sort_order: d.sort_order, published: !!d.published, updated_at: d.updated_at });
app.get("/docs", async c => {
  auth(c);
  return c.json({ docs: (await db.all("SELECT * FROM rp_documents WHERE published = 1 ORDER BY sort_order, slug")).map(docView) });
});
const signView = payload => { const p = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${p}.${hmacHex("sha256", secret(), "view:" + p)}`; };
const viewKey = token => crypto.createHmac("sha256", secret()).update("key:" + token).digest();   // 32 bytes
// Opens a document: returns a 2-hour view token bound to this user plus the key that decrypts its pages.
// STRICT: Only authenticated users can open documents and access files.
app.post("/docs/:slug/open", async c => {
  const u = auth(c);
  const d = await db.first("SELECT * FROM rp_documents WHERE slug = ? AND (published = 1 OR ? = 'admin')", [c.req.param("slug"), u.role]);
  if (!d) fail(404, "Document not found.");
  const cookieToken = getCookie(c, COOKIE);
  if (!cookieToken) fail(401, "Please sign in to access files.");
  const cookieSig = sha256(cookieToken).slice(0, 16);
  const token = signView({ u: u.id, e: u.email, slug: d.slug, d: d.id, f: d.ik_folder, n: d.pages, s: cookieSig, x: Math.floor(Date.now() / 1000) + 7200 });
  await audit(c, "doc.open", d.slug);
  const searchable = !!(await db.first("SELECT 1 AS y FROM rp_doc_pages WHERE doc_id = ? LIMIT 1", [d.id]));
  return c.json({ token, key: viewKey(token).toString("base64"), pages: d.pages, title: d.title, slug: d.slug, searchable, email: u.email });
});

// Stream compressed vector PDF as opaque binary stream for client-side protected rendering
// STRICT: Only authenticated users with matching session cookie can stream document binaries.
app.get("/view-pdf/:token", async c => {
  const token = c.req.param("token");
  const [p, sig] = (token || "").split(".");
  if (!p || !sig || !safeEqual(sig, hmacHex("sha256", secret(), "view:" + p))) fail(403, "Invalid view token.");
  const v = parse(Buffer.from(p, "base64url").toString(), {});
  if (!v.u || v.u <= 0) fail(401, "Please sign in to access files.");
  if (v.x < Math.floor(Date.now() / 1000)) fail(403, "This view has expired. Reopen the document.");
  const cookieToken = getCookie(c, COOKIE);
  if (!cookieToken) fail(401, "Please sign in to access files.");
  const cookieSig = sha256(cookieToken).slice(0, 16);
  if (v.s !== cookieSig) fail(401, "Session mismatch. Please sign in.");

  const isMaster = v.slug.endsWith("-master") || v.slug.endsWith("-long");
  const folder = isMaster ? "long-pdfs" : "pdfs";
  const ikUrl = `https://ik.imagekit.io/likhi/resources-portal/${folder}/${v.slug}.pdf`;

  const res = await fetch(ikUrl);
  if (!res.ok) fail(res.status, "Document could not be retrieved.");

  return new Response(res.body, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, no-store, no-cache, must-revalidate",
      "Content-Disposition": "inline; filename=\"secured-view.bin\"",
      "X-Content-Type-Options": "nosniff"
    }
  });
});
// Pages as AES-256-GCM ciphertext. GET /view/<token>/<first>-<last>?w=<width>  (max 4 pages per call).
// Response = for each page: 4-byte big-endian length + (iv | ciphertext | tag). The original PDF is never stored or served.
// No database work per request: the signed token carries the user, document folder and page count, and is bound to the session cookie.
const pageLimiter = new Map();                                 // per-instance throttle: pages per user per 10 minutes
app.get("/view/:token/:range", async c => {
  const token = c.req.param("token"); const [p, sig] = token.split(".");
  if (!p || !sig || !safeEqual(sig, hmacHex("sha256", secret(), "view:" + p))) fail(403, "Invalid view.");
  const v = parse(Buffer.from(p, "base64url").toString(), {});
  if (!v.u || v.u <= 0 || v.x < Math.floor(Date.now() / 1000)) fail(403, "This view has expired. Reopen the document.");
  const cookieToken = getCookie(c, COOKIE);
  if (!cookieToken) fail(401, "Please sign in to access files.");
  if (v.s !== sha256(cookieToken).slice(0, 16)) fail(401, "Please sign in again.");
  const dest = c.req.header("sec-fetch-dest"); if (dest && dest !== "empty") fail(403, "Not allowed.");
  const [a1, b1] = c.req.param("range").split("-").map(Number); const first = a1, last = b1 || a1;
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last < first || last > v.n || last - first > 3) fail(400, "Bad page range.");
  const now = Date.now(), rec = pageLimiter.get(v.u) || { n: 0, reset: now + 600_000 };
  if (rec.reset < now) { rec.n = 0; rec.reset = now + 600_000; }
  rec.n += last - first + 1; pageLimiter.set(v.u, rec);
  if (rec.n > 2500) fail(429, "Too many pages requested. Please wait a few minutes.");
  const width = [700, 900, 1100, 1300].find(x => x >= Number(c.req.query("w") || 1100)) || 1300;
  const wm = `${v.e}  ${new Date().toISOString().slice(0, 10)}`;
  const imgs = await Promise.all(Array.from({ length: last - first + 1 }, (_, i) => ikPage(v.f, first + i, wm, width)));
  const key = viewKey(token);
  const parts = imgs.flatMap(img => {
    const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const body = Buffer.concat([iv, cipher.update(img), cipher.final(), cipher.getAuthTag()]);
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length); return [len, body];
  });
  return new Response(Buffer.concat(parts), { headers: { "Content-Type": "application/octet-stream", "Cache-Control": "no-store, private", "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff" } });
});

// Search inside a document: returns page numbers, a short snippet and highlight boxes (0-1000 page coordinates).
// The full text is never sent to the browser.
app.get("/docs/:slug/search", async c => {
  const u = auth(c);
  await rateLimit(`search:${u.id}`, 120, 300);
  const q = str(c.req.query("q"), 60).toLowerCase();
  if (q.length < 1) return c.json({ results: [] });
  const d = await db.first("SELECT id FROM rp_documents WHERE slug = ? AND (published = 1 OR ? = 'admin')", [c.req.param("slug"), u.role]);
  if (!d) fail(404, "Document not found.");
  const like = "%" + q.replace(/[\\%_]/g, ch => "\\" + ch) + "%";
  const rows = await db.all("SELECT page, text, boxes FROM rp_doc_pages WHERE doc_id = ? AND lower(text) LIKE ? ESCAPE '\\' ORDER BY page LIMIT 60", [d.id, like]);
  const results = rows.map(r => {
    const text = r.text, low = text.toLowerCase(), boxes = parse(r.boxes, []);
    const starts = []; for (let i = 0; i < text.length; i++) if (text[i] === " " || i === 0) starts.push(i === 0 ? 0 : i + 1);
    const wordAt = pos => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (starts[m] <= pos) lo = m; else hi = m - 1; } return lo; };
    const rects = []; let first = -1, count = 0;
    for (let i = low.indexOf(q); i !== -1 && count < 40; i = low.indexOf(q, i + Math.max(1, q.length)), count++) {
      if (first < 0) first = i;
      for (let w = wordAt(i); w <= wordAt(i + q.length - 1); w++) if (boxes[w]) rects.push(boxes[w]);
    }
    const snippet = (first > 30 ? "..." : "") + text.slice(Math.max(0, first - 30), first + q.length + 50) + "...";
    return { page: r.page, count, snippet, rects };
  });
  return c.json({ results });
});

/* ---------------- Resources / projects (links) ---------------- */
const linkView = l => ({ ...l, career_roles: parse(l.career_roles, []), published: !!l.published });
app.get("/links", async c => {
  auth(c);
  return c.json({ links: (await db.all("SELECT * FROM rp_links WHERE published = 1 ORDER BY kind, sort_order, id")).map(linkView) });
});

/* ---------------- Connect (interview questions shared by members, shown after admin review) ---------------- */
const postView = (r, full) => ({
  id: r.id, kind: r.kind, title: r.title, body: r.body, company: r.company, career_role: r.career_role, year: r.year, difficulty: r.difficulty,
  links: parse(r.links, []), author: r.anonymous ? "Anonymous" : (r.user_name || "Member"), created_at: r.created_at, status: r.status,
  ...(full ? { admin_note: r.admin_note, user_email: r.user_email } : {}),
});
const POSTS = "SELECT p.*, u.name AS user_name, u.email AS user_email FROM rp_connect_posts p LEFT JOIN rp_users u ON u.id = p.user_id";
app.get("/connect", async c => { auth(c); return c.json({ posts: (await db.all(`${POSTS} WHERE p.status = 'approved' ORDER BY p.id DESC LIMIT 300`)).map(r => postView(r)) }); });
app.get("/connect/mine", async c => { const u = auth(c); return c.json({ posts: (await db.all(`${POSTS} WHERE p.user_id = ? ORDER BY p.id DESC`, [u.id])).map(r => postView(r)) }); });
function cleanPost(b) {
  const title = str(b.title, 300); if (title.length < 8) fail(400, "Write the question or topic (at least 8 characters).");
  const year = b.year ? Math.round(Number(b.year)) : null;
  if (year !== null && !(year >= 2000 && year <= new Date().getFullYear() + 1)) fail(400, "Enter a valid year.");
  return [["interview", "topic", "experience"].includes(b.kind) ? b.kind : "interview", title, str(b.body, 8000), str(b.company, 80), str(b.career_role, 60), year,
    ["easy", "medium", "hard"].includes(b.difficulty) ? b.difficulty : "", JSON.stringify((Array.isArray(b.links) ? b.links : []).map(safeUrl).filter(Boolean).slice(0, 6)), b.anonymous ? 1 : 0];
}
app.post("/connect", async c => {
  const u = auth(c); await rateLimit(`connect:${u.id}`, 5, 7 * 86400);
  const status = u.role === "admin" ? "approved" : "pending";
  await db.run("INSERT INTO rp_connect_posts (kind, title, body, company, career_role, year, difficulty, links, anonymous, user_id, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [...cleanPost(await body(c)), u.id, status]);
  return c.json({ ok: true, status });
});

/* ---------------- Admin CMS ---------------- */
app.get("/admin/stats", async c => {
  admin(c);
  const one = async sql => (await db.first(sql))?.n || 0;
  return c.json({
    users: await one("SELECT COUNT(*) n FROM rp_users WHERE status = 'active'"), unverified: await one("SELECT COUNT(*) n FROM rp_users WHERE status = 'unverified'"),
    docs: await one("SELECT COUNT(*) n FROM rp_documents"), links: await one("SELECT COUNT(*) n FROM rp_links"),
    pending_posts: await one("SELECT COUNT(*) n FROM rp_connect_posts WHERE status = 'pending'"),
    top: await db.all("SELECT u.name, u.email, COUNT(p.item_id) AS done FROM rp_users u LEFT JOIN rp_progress p ON p.user_id = u.id WHERE u.status = 'active' GROUP BY u.id ORDER BY done DESC LIMIT 20"),
    imagekit: ikConfigured(),
  });
});
app.get("/admin/users", async c => {
  admin(c);
  const users = await db.all("SELECT id, name, email, role, status, career_roles, phone, created_at, last_login_at FROM rp_users ORDER BY id DESC LIMIT 1000");
  const [progressRows, auditRows, checklistRows] = await Promise.all([
    db.all("SELECT user_id, substr(updated_at, 1, 10) as day FROM rp_progress"),
    db.all("SELECT user_id, substr(created_at, 1, 10) as day FROM rp_audit WHERE action IN ('study.progress', 'study.session', 'study.checklist')"),
    db.all("SELECT user_id, substr(updated_at, 1, 10) as day FROM rp_job_checklists")
  ]);
  const userDays = new Map();
  for (const r of [...progressRows, ...auditRows, ...checklistRows]) {
    if (!r.day || !r.user_id) continue;
    if (!userDays.has(r.user_id)) userDays.set(r.user_id, []);
    userDays.get(r.user_id).push(r.day);
  }
  const usersWithStreaks = users.map(u => {
    const days = userDays.get(u.id) || [];
    return {
      ...u,
      streak: calculateStreak(days)
    };
  });
  return c.json({ users: usersWithStreaks });
});
app.get("/admin/users/:id/detail", async c => {
  admin(c);
  const id = Number(c.req.param("id"));
  const u = await db.first("SELECT id, name, email, role, status, career_roles, plan, phone, created_at, last_login_at FROM rp_users WHERE id = ?", [id]);
  if (!u) fail(404, "User not found.");
  await ensureJdTable();
  const [progress, auditRows, checklists] = await Promise.all([
    db.all("SELECT item_id, updated_at FROM rp_progress WHERE user_id = ?", [id]),
    db.all("SELECT substr(created_at, 1, 10) as day FROM rp_audit WHERE user_id = ? AND action IN ('study.progress', 'study.session', 'study.checklist')", [id]),
    db.all("SELECT * FROM rp_job_checklists WHERE user_id = ? ORDER BY updated_at DESC", [id])
  ]);
  const progressDays = progress.map(r => r.updated_at ? r.updated_at.slice(0, 10) : "").filter(Boolean);
  const studyAuditDays = auditRows.map(r => r.day).filter(Boolean);
  const checklistDays = checklists.map(cl => cl.updated_at ? cl.updated_at.slice(0, 10) : "").filter(Boolean);
  const streak = calculateStreak([...progressDays, ...studyAuditDays, ...checklistDays]);
  const logins = await db.all("SELECT id, action, detail, ip, created_at FROM rp_audit WHERE user_id = ? AND action IN ('auth.login', 'auth.logout') ORDER BY id DESC LIMIT 30", [id]);
  return c.json({
    user: { ...u, career_roles: parse(u.career_roles, []), plan: parse(u.plan, []) },
    progress: progress.map(r => r.item_id),
    streak,
    logins,
    checklists: checklists.map(cl => ({
      ...cl,
      skills: parse(cl.skills_json, []),
      items: parse(cl.checklist_json, [])
    }))
  });
});
app.post("/admin/users/:id", async c => {
  const me = admin(c), b = await body(c), id = Number(c.req.param("id"));
  if (id === me.id) fail(400, "You cannot change your own account here.");
  if (b.action === "delete") { await db.run("DELETE FROM rp_sessions WHERE user_id = ?", [id]); await db.run("DELETE FROM rp_progress WHERE user_id = ?", [id]); await db.run("DELETE FROM rp_users WHERE id = ?", [id]); }
  else if (b.action === "block") { await db.run("UPDATE rp_users SET status = 'blocked' WHERE id = ?", [id]); await db.run("DELETE FROM rp_sessions WHERE user_id = ?", [id]); }
  else if (b.action === "unblock") await db.run("UPDATE rp_users SET status = 'active' WHERE id = ?", [id]);
  else if (b.action === "role" && ["student", "admin"].includes(b.role)) await db.run("UPDATE rp_users SET role = ? WHERE id = ?", [b.role, id]);
  else fail(400, "Unknown action.");
  await audit(c, `user.${b.action}`, String(id));
  return c.json({ ok: true });
});

app.get("/admin/docs", async c => { admin(c); return c.json({ docs: (await db.all("SELECT * FROM rp_documents ORDER BY sort_order, slug")).map(docView) }); });
// Each page image needs its own one-time upload signature.
app.get("/admin/ik-auth", c => { admin(c); if (!ikConfigured()) fail(503, "ImageKit is not configured."); return c.json(ikUploadAuth()); });
app.post("/admin/docs/prepare", async c => {
  admin(c); const slug = str((await body(c)).slug, 80).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
  if (slug.length < 3) fail(400, "Give the document a short name (slug).");
  const old = await db.first("SELECT version FROM rp_documents WHERE slug = ?", [slug]);
  const version = (old?.version || 0) + 1;
  return c.json({ slug, version, folder: `${ikFolder()}/docs/${slug}-v${version}` });
});
// Searchable text of a document, sent by the admin's browser in chunks of up to 10 pages.
app.post("/admin/docs/:slug/text", async c => {
  admin(c); const b = await body(c);
  const d = await db.first("SELECT id, pages FROM rp_documents WHERE slug = ?", [c.req.param("slug")]); if (!d) fail(404, "Not found.");
  if (b.reset) await db.run("DELETE FROM rp_doc_pages WHERE doc_id = ?", [d.id]);
  for (const p of (Array.isArray(b.pages) ? b.pages : []).slice(0, 10)) {
    const page = Number(p.page); if (!Number.isInteger(page) || page < 1 || page > d.pages) continue;
    const boxes = (Array.isArray(p.boxes) ? p.boxes : []).slice(0, 5000).map(r => (Array.isArray(r) ? r.slice(0, 4).map(v => Math.max(0, Math.min(1000, Math.round(Number(v) || 0)))) : [0, 0, 0, 0]));
    await db.run("INSERT OR REPLACE INTO rp_doc_pages (doc_id, page, text, boxes) VALUES (?, ?, ?, ?)", [d.id, page, str(p.text, 40000), JSON.stringify(boxes)]);
  }
  return c.json({ ok: true });
});
app.post("/admin/docs", async c => {
  admin(c); const b = await body(c);
  const slug = str(b.slug, 80), title = str(b.title, 160), pages = Math.round(Number(b.pages)), folder = str(b.folder, 300), version = Math.round(Number(b.version)) || 1;
  if (!slug || !title || !(pages > 0) || !folder.startsWith(ikFolder() + "/docs/")) fail(400, "Missing document details.");
  const old = await db.first("SELECT * FROM rp_documents WHERE slug = ?", [slug]);
  if (old) {
    await db.run("UPDATE rp_documents SET title = ?, description = ?, career_roles = ?, ik_folder = ?, pages = ?, version = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?",
      [title, str(b.description, 500), jsonArr(b.career_roles, 12), folder, pages, version, Number(b.sort_order) || 0, old.id]);
    if (old.ik_folder !== folder) await ikDeleteFolder(old.ik_folder);
  } else {
    await db.run("INSERT INTO rp_documents (slug, title, description, career_roles, ik_folder, pages, version, sort_order) VALUES (?,?,?,?,?,?,?,?)",
      [slug, title, str(b.description, 500), jsonArr(b.career_roles, 12), folder, pages, version, Number(b.sort_order) || 0]);
  }
  await audit(c, "doc.save", slug);
  return c.json({ ok: true });
});
app.put("/admin/docs/:id", async c => {
  admin(c); const b = await body(c), id = Number(c.req.param("id"));
  const d = await db.first("SELECT * FROM rp_documents WHERE id = ?", [id]); if (!d) fail(404, "Not found.");
  await db.run("UPDATE rp_documents SET title = ?, description = ?, career_roles = ?, sort_order = ?, published = ?, updated_at = datetime('now') WHERE id = ?",
    [str(b.title ?? d.title, 160), str(b.description ?? d.description, 500), jsonArr(b.career_roles ?? parse(d.career_roles, []), 12), Number(b.sort_order ?? d.sort_order) || 0, (b.published ?? d.published) ? 1 : 0, id]);
  return c.json({ ok: true });
});
app.delete("/admin/docs/:id", async c => {
  admin(c); const d = await db.first("SELECT * FROM rp_documents WHERE id = ?", [Number(c.req.param("id"))]); if (!d) fail(404, "Not found.");
  await db.run("DELETE FROM rp_documents WHERE id = ?", [d.id]); await db.run("DELETE FROM rp_doc_pages WHERE doc_id = ?", [d.id]); await ikDeleteFolder(d.ik_folder); await audit(c, "doc.delete", d.slug);
  return c.json({ ok: true });
});

app.get("/admin/links", async c => { admin(c); return c.json({ links: (await db.all("SELECT * FROM rp_links ORDER BY kind, sort_order, id")).map(linkView) }); });
const cleanLink = b => {
  const title = str(b.title, 160); if (title.length < 2) fail(400, "Enter a title.");
  const url = b.url ? safeUrl(b.url) : ""; if (b.url && !url) fail(400, "Enter a valid http(s) link.");
  return [b.kind === "project" ? "project" : "resource", title, str(b.description, 2000), url, str(b.category, 60), jsonArr(b.career_roles, 12), Number(b.sort_order) || 0, b.published === false ? 0 : 1];
};
app.post("/admin/links", async c => { admin(c); await db.run("INSERT INTO rp_links (kind, title, description, url, category, career_roles, sort_order, published) VALUES (?,?,?,?,?,?,?,?)", cleanLink(await body(c))); return c.json({ ok: true }); });
app.put("/admin/links/:id", async c => { admin(c); await db.run("UPDATE rp_links SET kind = ?, title = ?, description = ?, url = ?, category = ?, career_roles = ?, sort_order = ?, published = ? WHERE id = ?", [...cleanLink(await body(c)), Number(c.req.param("id"))]); return c.json({ ok: true }); });
app.delete("/admin/links/:id", async c => { admin(c); await db.run("DELETE FROM rp_links WHERE id = ?", [Number(c.req.param("id"))]); return c.json({ ok: true }); });

app.get("/admin/connect", async c => { admin(c); return c.json({ posts: (await db.all(`${POSTS} ORDER BY CASE p.status WHEN 'pending' THEN 0 ELSE 1 END, p.id DESC LIMIT 500`)).map(r => postView(r, true)) }); });
app.post("/admin/connect/:id", async c => {
  admin(c); const b = await body(c), id = Number(c.req.param("id"));
  if (b.action === "delete") await db.run("DELETE FROM rp_connect_posts WHERE id = ?", [id]);
  else if (["approved", "rejected", "pending"].includes(b.status)) {
    await db.run("UPDATE rp_connect_posts SET status = ?, admin_note = ?, reviewed_at = datetime('now') WHERE id = ?", [b.status, str(b.note, 300), id]);
    const p = await db.first(`${POSTS} WHERE p.id = ?`, [id]);
    if (p?.user_email && b.status !== "pending") await sendMail(p.user_email, `Your Connect post was ${b.status}`, `Your post was ${b.status}`, `<p>"${p.title.replace(/[<>&]/g, "")}"</p>`, `Your Connect post "${p.title}" was ${b.status}.`);
  } else fail(400, "Unknown action.");
  return c.json({ ok: true });
});
app.get("/admin/audit", async c => {
  admin(c);
  return c.json({
    rows: await db.all(`
      SELECT a.*, u.name AS user_name, u.email
      FROM rp_audit a
      LEFT JOIN rp_users u ON u.id = a.user_id
      ORDER BY a.id DESC
      LIMIT 300
    `)
  });
});

app.get("/admin/jd-checklists", async c => {
  admin(c);
  await ensureJdTable();
  const rows = await db.all(`
    SELECT j.*, u.name AS user_name, u.email AS user_email
    FROM rp_job_checklists j
    LEFT JOIN rp_users u ON u.id = j.user_id
    ORDER BY j.updated_at DESC
    LIMIT 300
  `);
  return c.json({
    checklists: rows.map(r => ({
      ...r,
      skills: parse(r.skills_json, []),
      items: parse(r.checklist_json, [])
    }))
  });
});

app.delete("/admin/jd-checklists/:id", async c => {
  admin(c);
  await ensureJdTable();
  const id = Number(c.req.param("id"));
  await db.run("DELETE FROM rp_job_checklists WHERE id = ?", [id]);
  return c.json({ ok: true });
});

/* ---------------- Team members (public list + admin CMS) ---------------- */
app.get("/team", async c => {
  return c.json({ members: await db.all("SELECT id, name, role_title, photo_url, linkedin, github FROM rp_team_members ORDER BY sort_order, id") });
});
app.get("/admin/team", async c => { admin(c); return c.json({ members: await db.all("SELECT * FROM rp_team_members ORDER BY sort_order, id") }); });
app.post("/admin/team", async c => {
  admin(c); const b = await body(c);
  const name = str(b.name, 80); if (name.length < 2) fail(400, "Enter a name.");
  await db.run("INSERT INTO rp_team_members (name, role_title, photo_url, linkedin, github, sort_order) VALUES (?,?,?,?,?,?)",
    [name, str(b.role_title, 80), safeUrl(b.photo_url) || str(b.photo_url, 500), safeUrl(b.linkedin), safeUrl(b.github), Number(b.sort_order) || 0]);
  return c.json({ ok: true });
});
app.put("/admin/team/:id", async c => {
  admin(c); const b = await body(c), id = Number(c.req.param("id"));
  const name = str(b.name, 80); if (name.length < 2) fail(400, "Enter a name.");
  await db.run("UPDATE rp_team_members SET name = ?, role_title = ?, photo_url = ?, linkedin = ?, github = ?, sort_order = ? WHERE id = ?",
    [name, str(b.role_title, 80), safeUrl(b.photo_url) || str(b.photo_url, 500), safeUrl(b.linkedin), safeUrl(b.github), Number(b.sort_order) || 0, id]);
  return c.json({ ok: true });
});
app.delete("/admin/team/:id", async c => {
  admin(c); await db.run("DELETE FROM rp_team_members WHERE id = ?", [Number(c.req.param("id"))]);
  return c.json({ ok: true });
});

/* ---------------- Site Settings & Legal (Public & Admin CMS) ---------------- */
app.get("/settings", async c => {
  const rows = await db.all("SELECT key, value FROM rp_site_settings");
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return c.json({ settings });
});

app.get("/admin/settings", async c => {
  admin(c);
  const rows = await db.all("SELECT key, value, updated_at FROM rp_site_settings");
  return c.json({ settings: Object.fromEntries(rows.map(r => [r.key, r.value])) });
});

app.put("/admin/settings", async c => {
  admin(c); const b = await body(c);
  if (b.disclaimer !== undefined) await db.run("INSERT OR REPLACE INTO rp_site_settings (key, value, updated_at) VALUES ('disclaimer', ?, datetime('now'))", [str(b.disclaimer, 5000)]);
  if (b.terms !== undefined) await db.run("INSERT OR REPLACE INTO rp_site_settings (key, value, updated_at) VALUES ('terms', ?, datetime('now'))", [str(b.terms, 20000)]);
  if (b.privacy !== undefined) await db.run("INSERT OR REPLACE INTO rp_site_settings (key, value, updated_at) VALUES ('privacy', ?, datetime('now'))", [str(b.privacy, 20000)]);
  return c.json({ ok: true });
});

/* ---------------- Certifications (Public List & Admin CMS) ---------------- */
app.get("/certifications", async c => {
  auth(c);
  const rows = await db.all("SELECT id, title, provider, tier, cost, role, url, resources_url, description, sort_order FROM rp_certifications WHERE published = 1 ORDER BY sort_order, id");
  return c.json({ certifications: rows });
});

app.get("/admin/certifications", async c => {
  admin(c);
  const rows = await db.all("SELECT * FROM rp_certifications ORDER BY sort_order, id");
  return c.json({ certifications: rows });
});

app.post("/admin/certifications", async c => {
  admin(c); const b = await body(c);
  const title = str(b.title, 120); if (!title) fail(400, "Enter certification title.");
  const provider = str(b.provider, 100); if (!provider) fail(400, "Enter provider name.");
  await db.run(
    "INSERT INTO rp_certifications (title, provider, tier, cost, role, url, resources_url, description, sort_order, published) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [title, provider, str(b.tier, 20) || "free", str(b.cost, 50) || "Free", str(b.role, 30) || "sde", safeUrl(b.url), safeUrl(b.resources_url), str(b.description, 1000), Number(b.sort_order) || 0, b.published === false ? 0 : 1]
  );
  return c.json({ ok: true });
});

app.put("/admin/certifications/:id", async c => {
  admin(c); const b = await body(c), id = Number(c.req.param("id"));
  const title = str(b.title, 120); if (!title) fail(400, "Enter certification title.");
  await db.run(
    "UPDATE rp_certifications SET title = ?, provider = ?, tier = ?, cost = ?, role = ?, url = ?, resources_url = ?, description = ?, sort_order = ?, published = ? WHERE id = ?",
    [title, str(b.provider, 100), str(b.tier, 20) || "free", str(b.cost, 50) || "Free", str(b.role, 30) || "sde", safeUrl(b.url), safeUrl(b.resources_url), str(b.description, 1000), Number(b.sort_order) || 0, b.published === 0 || b.published === false ? 0 : 1, id]
  );
  return c.json({ ok: true });
});

app.delete("/admin/certifications/:id", async c => {
  admin(c); await db.run("DELETE FROM rp_certifications WHERE id = ?", [Number(c.req.param("id"))]);
  return c.json({ ok: true });
});

/* ---------------- User Suggestions & Feedback (Triggers Admin Email) ---------------- */
app.post("/feedback", async c => {
  const u = c.get("user");
  const b = await body(c);
  const name = str(b.name || u?.name, 80);
  const email = cleanEmail(b.email || u?.email);
  const category = str(b.category, 50) || "suggestion";
  const message = str(b.message, 3000);
  if (message.length < 5) fail(400, "Please enter a message (at least 5 characters).");

  await rateLimit(`feedback:${email}`, 5, 3600); // max 5 per hour
  const res = await db.run(
    "INSERT INTO rp_feedback (user_id, name, email, category, message) VALUES (?, ?, ?, ?, ?)",
    [u?.id || null, name, email, category, message]
  );

  // Trigger notification email to admins
  const admins = adminEmails();
  if (admins.length) {
    const subject = `[Feedback - ${category.toUpperCase()}] from ${name}`;
    const emailBody = `
      <p><b>From:</b> ${name} (${email})</p>
      <p><b>Category:</b> ${category}</p>
      <p><b>Message:</b></p>
      <div style="background:#f4f5f7;padding:12px;border-radius:6px;white-space:pre-wrap;font-family:monospace;">${message}</div>
      <p style="margin-top:16px"><a href="${process.env.APP_ORIGIN || 'https://resourcescse.vercel.app'}/admin/feedback">View in Admin Dashboard &rarr;</a></p>
    `;
    for (const adm of admins) {
      await sendMail(adm, subject, `New ${category} from ${name}`, emailBody).catch(e => console.error("Admin feedback email failed:", e.message));
    }
  }

  return c.json({ ok: true, id: res.lastId });
});

app.get("/admin/feedback", async c => {
  admin(c);
  const rows = await db.all("SELECT f.*, u.career_roles FROM rp_feedback f LEFT JOIN rp_users u ON u.id = f.user_id ORDER BY CASE f.status WHEN 'new' THEN 0 ELSE 1 END, f.id DESC LIMIT 300");
  return c.json({ feedback: rows });
});

app.put("/admin/feedback/:id", async c => {
  admin(c); const b = await body(c), id = Number(c.req.param("id"));
  await db.run("UPDATE rp_feedback SET status = ?, admin_reply = ? WHERE id = ?", [str(b.status, 20) || "resolved", str(b.admin_reply, 2000), id]);
  return c.json({ ok: true });
});

app.delete("/admin/feedback/:id", async c => {
  admin(c); await db.run("DELETE FROM rp_feedback WHERE id = ?", [Number(c.req.param("id"))]);
  return c.json({ ok: true });
});

/* ---------------- Job Description Analyzer & Study Checklists ---------------- */
app.post("/jd/parse-file", async c => {
  auth(c);
  const formData = await c.req.parseBody();
  const file = formData["file"];
  if (!file) fail(400, "No file uploaded.");
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = (file.name || "").toLowerCase();

  let extractedText = "";

  try {
    if (fileName.endsWith(".pdf")) {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer), isEvalSupported: false }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        pages.push(textContent.items.map(it => it.str || "").join(" "));
      }
      extractedText = pages.join("\n\n");
    } else if (fileName.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ buffer });
      extractedText = res.value;
    } else if (/\.(png|jpe?g|webp|bmp)$/i.test(fileName)) {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const ret = await worker.recognize(buffer);
      await worker.terminate();
      extractedText = ret.data.text;
    } else {
      extractedText = buffer.toString("utf8");
    }
  } catch (err) {
    fail(500, "File parsing failed: " + (err.message || String(err)));
  }

  if (!extractedText.trim()) {
    fail(400, "No readable text could be extracted from this file.");
  }

  return c.json({ ok: true, text: extractedText.trim() });
});

// Auto-ensure rp_job_checklists table exists on initialization
let jdTableChecked = false;
async function ensureJdTable() {
  if (jdTableChecked) return;
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS rp_job_checklists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        raw_text TEXT NOT NULL,
        role_detected TEXT NOT NULL,
        match_score INTEGER NOT NULL DEFAULT 0,
        skills_json TEXT NOT NULL DEFAULT '[]',
        checklist_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    jdTableChecked = true;
  } catch (e) {
    console.error("Failed to ensure rp_job_checklists table:", e);
  }
}

app.post("/jd/analyze", async c => {
  auth(c);
  const b = await body(c);
  const analysis = analyzeJD(b.text || "", b.company || "");
  return c.json({ ok: true, ...analysis });
});

app.get("/jd", async c => {
  const u = auth(c);
  await ensureJdTable();
  const rows = await db.all("SELECT * FROM rp_job_checklists WHERE user_id = ? ORDER BY updated_at DESC", [u.id]);
  return c.json({
    checklists: rows.map(r => ({
      ...r,
      skills: parse(r.skills_json, []),
      items: parse(r.checklist_json, [])
    }))
  });
});

app.post("/jd", async c => {
  const u = auth(c);
  await ensureJdTable();
  const b = await body(c);
  const title = str(b.title, 200) || "Target Job Checklist";
  const company = str(b.company, 100) || "";
  const rawText = str(b.raw_text, 65535) || "";
  const roleDetected = str(b.role_detected, 100) || "Software Engineer";
  const matchScore = Number(b.match_score) || 0;
  const skillsJson = JSON.stringify(Array.isArray(b.skills) ? b.skills : []);
  const checklistJson = JSON.stringify(Array.isArray(b.items) ? b.items : []);

  const res = await db.run(
    "INSERT INTO rp_job_checklists (user_id, title, company, raw_text, role_detected, match_score, skills_json, checklist_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [u.id, title, company, rawText, roleDetected, matchScore, skillsJson, checklistJson]
  );
  return c.json({ ok: true, id: res.lastId });
});

app.put("/jd/:id", async c => {
  const u = auth(c);
  await ensureJdTable();
  const id = Number(c.req.param("id"));
  const b = await body(c);
  const row = await db.first("SELECT * FROM rp_job_checklists WHERE id = ? AND user_id = ?", [id, u.id]);
  if (!row) fail(404, "Checklist not found.");

  const title = b.title !== undefined ? str(b.title, 200) : row.title;
  const company = b.company !== undefined ? str(b.company, 100) : row.company;
  const checklistJson = b.items !== undefined ? JSON.stringify(Array.isArray(b.items) ? b.items : []) : row.checklist_json;

  await db.run(
    "UPDATE rp_job_checklists SET title = ?, company = ?, checklist_json = ?, updated_at = datetime('now') WHERE id = ?",
    [title, company, checklistJson, id]
  );
  return c.json({ ok: true });
});

app.delete("/jd/:id", async c => {
  const u = auth(c);
  await ensureJdTable();
  const id = Number(c.req.param("id"));
  await db.run("DELETE FROM rp_job_checklists WHERE id = ? AND user_id = ?", [id, u.id]);
  return c.json({ ok: true });
});

app.all("*", c => c.json({ error: "Not found." }, 404));
