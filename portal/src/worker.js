// UPSC Zero-to-IAS portal API: progress sync (D1), resource library + admin CMS (D1 + ImageKit).
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const err = (msg, status = 400) => json({ error: msg }, status);
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const rand = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const now = () => Date.now();
const IDLE_MS = 20 * 60 * 1000; // server-side idle limit (the page signs out after 15 min of no activity)
const IK_HOST = 'https://ik.imagekit.io/';

// ImageKit private files are only reachable through a signed, short-lived URL.
async function signedIk(env, fileUrl) {
  const base = env.IMAGEKIT_URL.replace(/\/$/, '') + '/', clean = fileUrl.split('?')[0];
  const exp = Math.floor(now() / 1000) + 120;
  const key = await crypto.subtle.importKey('raw', enc.encode(env.IMAGEKIT_PRIVATE_KEY), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const sig = hex(await crypto.subtle.sign('HMAC', key, enc.encode(clean.replace(base, '') + exp)));
  return `${clean}?ik-t=${exp}&ik-s=${sig}`;
}
const isHosted = r => r.file_id && r.url.startsWith(IK_HOST);

async function pbkdf2(pass, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100000 }, key, 256));
}
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
function safeEq(a, b) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
const bearer = req => (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

async function userOf(req, env) {
  const t = bearer(req); if (!t) return null;
  const row = await env.DB.prepare('SELECT u.id, u.username, s.last_seen FROM upsc_sessions s JOIN upsc_users u ON u.id = s.user_id WHERE s.token = ?').bind(t).first();
  if (!row) return null;
  if (now() - row.last_seen > IDLE_MS) { await env.DB.prepare('DELETE FROM upsc_sessions WHERE token = ?').bind(t).run(); return null; } // idle sessions die on the server too
  if (now() - row.last_seen > 60000) await env.DB.prepare('UPDATE upsc_sessions SET last_seen = ? WHERE token = ?').bind(now(), t).run();
  return row;
}
async function adminToken(env, exp) { return exp + '.' + await hmac(env.ADMIN_PASSWORD, 'admin:' + exp); }
async function isAdmin(req, env) {
  if (!env.ADMIN_PASSWORD) return false;
  const [exp, sig] = bearer(req).split('.');
  if (!exp || !sig || Number(exp) < now()) return false;
  return safeEq(await adminToken(env, exp), exp + '.' + sig);
}
const ikAuth = env => 'Basic ' + btoa(env.IMAGEKIT_PRIVATE_KEY + ':');

async function api(req, env, url) {
  const p = url.pathname.replace(/^\/api/, ''), m = req.method;
  const body = async () => { try { return await req.json(); } catch { return {}; } };

  // ---------- accounts ----------
  if (p === '/auth' && m === 'POST') {
    const b = await body();
    const username = String(b.username || '').trim().toLowerCase(), password = String(b.password || '');
    if (!/^[a-z0-9_.-]{3,30}$/.test(username)) return err('Username: 3-30 letters, digits, _ . -');
    if (password.length < 6) return err('Password must be at least 6 characters');
    let u = await env.DB.prepare('SELECT * FROM upsc_users WHERE username = ?').bind(username).first();
    if (!u) {
      const closed = await env.DB.prepare("SELECT value FROM upsc_settings WHERE key = 'signup'").first();
      if (b.create && closed && closed.value === 'closed') return err('New registrations are closed. Ask the admin for an account.', 403);
      if (!b.create) return err('No such account. Tick "create new account" to register.', 404);
      const salt = rand(16);
      await env.DB.prepare('INSERT INTO upsc_users (username, salt, pass_hash, created_at) VALUES (?,?,?,?)').bind(username, salt, await pbkdf2(password, salt), now()).run();
      u = await env.DB.prepare('SELECT * FROM upsc_users WHERE username = ?').bind(username).first();
    } else if (!safeEq(await pbkdf2(password, u.salt), u.pass_hash)) return err('Wrong password', 401);
    const token = rand(32);
    await env.DB.prepare('INSERT INTO upsc_sessions (token, user_id, created_at, last_seen) VALUES (?,?,?,?)').bind(token, u.id, now(), now()).run();
    return json({ token, username });
  }
  if (p === '/logout' && m === 'POST') { await env.DB.prepare('DELETE FROM upsc_sessions WHERE token = ?').bind(bearer(req)).run(); return json({ ok: true }); }

  // ---------- progress sync (last write wins per topic) ----------
  if (p === '/progress') {
    const u = await userOf(req, env); if (!u) return err('Sign in to sync', 401);
    if (m === 'POST') {
      const items = ((await body()).items || []).slice(0, 2000).filter(i => typeof i.id === 'string' && i.id.length < 100);
      const st = env.DB.prepare('INSERT INTO upsc_progress (user_id, topic_id, status, updated_at) VALUES (?1,?2,?3,?4) ON CONFLICT(user_id, topic_id) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at WHERE excluded.updated_at > upsc_progress.updated_at');
      for (let i = 0; i < items.length; i += 50) await env.DB.batch(items.slice(i, i + 50).map(x => st.bind(u.id, x.id, Number(x.s) & 7, Math.min(Number(x.t) || 0, now() + 60000))));
    }
    const { results } = await env.DB.prepare('SELECT topic_id AS id, status AS s, updated_at AS t FROM upsc_progress WHERE user_id = ?').bind(u.id).all();
    return json({ username: u.username, items: results });
  }

  // ---------- library (signed-in users only; hosted files never expose their storage URL) ----------
  if (p === '/resources' && m === 'GET') {
    const admin = await isAdmin(req, env);
    if (!admin && !(await userOf(req, env))) return err('Sign in to continue', 401);
    const { results } = await env.DB.prepare('SELECT id, slug, title, category, kind, url, file_id, description, sort, created_at FROM upsc_resources ORDER BY sort, id').all();
    const { results: set } = await env.DB.prepare('SELECT key, value FROM upsc_settings').all();
    const cfg = Object.fromEntries(set.map(r => [r.key, r.value]));
    return json({ resources: results.map(r => { const hosted = isHosted(r); const { file_id, ...o } = r; return { ...o, protected: !!hosted, url: hosted && !admin ? null : r.url }; }), notice: cfg.notice || '', signup: cfg.signup || 'open' });
  }
  // Streams a protected file to a signed-in user. The bytes are XOR-scrambled with a per-session key, so a copy
  // saved from the Network tab is not a readable PDF; the viewer unscrambles it in memory and paints it on canvas.
  const fm = p.match(/^\/file\/(\d+)$/);
  if (fm && m === 'GET') {
    const u = await userOf(req, env); if (!u) return err('Sign in to continue', 401);
    const r = await env.DB.prepare('SELECT * FROM upsc_resources WHERE id = ?').bind(fm[1]).first();
    if (!r || !isHosted(r)) return err('Not found', 404);
    const up = await fetch(await signedIk(env, r.url));
    if (!up.ok) return err('File store error ' + up.status, 502);
    const data = new Uint8Array(await up.arrayBuffer());
    const key = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(bearer(req) + ':' + r.id)));
    for (let i = 0; i < data.length; i++) data[i] ^= key[i & 31];
    return new Response(data, { headers: { 'content-type': 'application/octet-stream', 'cache-control': 'no-store, private', 'x-content-type-options': 'nosniff', 'x-title': encodeURIComponent(r.title) } });
  }

  // ---------- admin CMS ----------
  if (p === '/admin/login' && m === 'POST') {
    const pw = String((await body()).password || '');
    if (!env.ADMIN_PASSWORD || !safeEq(await hmac('cmp', pw), await hmac('cmp', env.ADMIN_PASSWORD))) return err('Wrong admin password', 401);
    return json({ token: await adminToken(env, String(now() + 12 * 3600 * 1000)) });
  }
  if (p.startsWith('/admin/')) {
    if (!(await isAdmin(req, env))) return err('Admin sign-in required', 401);
    if (p === '/admin/stats') {
      const users = await env.DB.prepare('SELECT COUNT(*) AS n FROM upsc_users').first();
      const { results } = await env.DB.prepare('SELECT u.username, COUNT(p.topic_id) AS topics, MAX(p.updated_at) AS last FROM upsc_users u LEFT JOIN upsc_progress p ON p.user_id = u.id AND p.status > 0 GROUP BY u.id ORDER BY last DESC LIMIT 100').all();
      return json({ users: users.n, learners: results });
    }
    if (p === '/admin/notice' && m === 'POST') {
      const nb = await req.clone().json().catch(() => ({}));
      if (nb.signup) await env.DB.prepare("INSERT INTO upsc_settings (key, value) VALUES ('signup', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1").bind(nb.signup === 'closed' ? 'closed' : 'open').run();
      await env.DB.prepare("INSERT INTO upsc_settings (key, value) VALUES ('notice', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1").bind(String((await body()).notice || '').slice(0, 600)).run();
      return json({ ok: true });
    }
    // upload a file to ImageKit; returns its public URL
    if (p === '/admin/upload' && m === 'POST') {
      if (!env.IMAGEKIT_PRIVATE_KEY) return err('IMAGEKIT_PRIVATE_KEY secret is not set', 500);
      const form = await req.formData(); const file = form.get('file');
      if (!file || typeof file === 'string') return err('file missing');
      const out = new FormData();
      out.append('file', file, file.name);
      out.append('fileName', String(form.get('fileName') || file.name));
      out.append('folder', (env.IMAGEKIT_FOLDER || '/upsc') + '/' + String(form.get('folder') || 'library').replace(/[^a-z0-9/_-]/gi, ''));
      out.append('useUniqueFileName', form.get('overwrite') ? 'false' : 'true');
      if (form.get('overwrite')) out.append('overwriteFile', 'true');
      out.append('isPrivateFile', 'true'); // never publicly reachable; served only through /api/file
      const r = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { authorization: ikAuth(env) }, body: out });
      const d = await r.json();
      if (!r.ok) return err('ImageKit: ' + (d.message || r.status), 502);
      return json({ url: d.url, fileId: d.fileId, name: d.name, size: d.size });
    }
    if (p === '/admin/resources' && m === 'POST') {
      const b = await body();
      if (!b.title || !/^https?:\/\//.test(b.url || '')) return err('title and a valid url are required');
      const vals = [String(b.title).slice(0, 200), String(b.category || 'general').slice(0, 60), String(b.kind || 'pdf').slice(0, 20), String(b.url), b.file_id || null, String(b.description || '').slice(0, 1000), Number(b.sort) || 100];
      if (b.id) await env.DB.prepare('UPDATE upsc_resources SET title=?, category=?, kind=?, url=?, file_id=COALESCE(?, file_id), description=?, sort=? WHERE id=?').bind(...vals, b.id).run();
      else if (b.slug) await env.DB.prepare('INSERT INTO upsc_resources (title, category, kind, url, file_id, description, sort, slug, created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET title=excluded.title, category=excluded.category, kind=excluded.kind, url=excluded.url, file_id=excluded.file_id, description=excluded.description, sort=excluded.sort').bind(...vals, String(b.slug), now()).run();
      else await env.DB.prepare('INSERT INTO upsc_resources (title, category, kind, url, file_id, description, sort, created_at) VALUES (?,?,?,?,?,?,?,?)').bind(...vals, now()).run();
      return json({ ok: true });
    }
    const del = p.match(/^\/admin\/resources\/(\d+)$/);
    if (del && m === 'DELETE') {
      const row = await env.DB.prepare('SELECT file_id FROM upsc_resources WHERE id = ?').bind(del[1]).first();
      if (!row) return err('not found', 404);
      if (row.file_id && url.searchParams.get('file') === '1' && env.IMAGEKIT_PRIVATE_KEY)
        await fetch('https://api.imagekit.io/v1/files/' + row.file_id, { method: 'DELETE', headers: { authorization: ikAuth(env) } });
      await env.DB.prepare('DELETE FROM upsc_resources WHERE id = ?').bind(del[1]).run();
      return json({ ok: true });
    }
  }
  return err('Not found', 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) {
      try { return await api(req, env, url); }
      catch (e) { return err(/no such table/.test(e.message) ? 'Database not initialised: run "pnpm db:init"' : 'Server error: ' + e.message, 500); }
    }
    return env.ASSETS.fetch(req);
  }
};
