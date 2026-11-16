/**
 * Database adapter.
 *  - Production / when configured: Cloudflare D1 over its HTTP API.
 *      CF_ACCOUNT_ID + CF_D1_DATABASE_ID and either CF_API_TOKEN (Bearer token with D1 Edit)
 *      or CF_API_EMAIL + CF_API_KEY (global API key).
 *  - Local development without those: a SQLite file (.data/portal.db) via node:sqlite - same SQL dialect.
 */
import fs from "node:fs";
import path from "node:path";

const e = process.env;
export const usingD1 = () => !!(e.CF_ACCOUNT_ID && e.CF_D1_DATABASE_ID && (e.CF_API_TOKEN || (e.CF_API_EMAIL && e.CF_API_KEY)));
const norm = p => (p || []).map(v => (v === undefined ? null : typeof v === "boolean" ? (v ? 1 : 0) : v));

async function d1(sql, params = []) {
  const headers = { "Content-Type": "application/json" };
  if (e.CF_API_TOKEN) headers.Authorization = `Bearer ${e.CF_API_TOKEN}`;
  else { headers["X-Auth-Email"] = e.CF_API_EMAIL; headers["X-Auth-Key"] = e.CF_API_KEY; }
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${e.CF_ACCOUNT_ID}/d1/database/${e.CF_D1_DATABASE_ID}/query`,
    { method: "POST", headers, body: JSON.stringify({ sql, params: norm(params) }) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.errors?.map(x => x.message).join("; ") || `D1 HTTP ${res.status}`);
  return body.result?.[0] || {};
}

let local;
async function sqlite() {
  if (local) return local;
  const { DatabaseSync } = await import("node:sqlite");
  const file = e.LOCAL_DB_FILE || path.resolve(process.cwd(), ".data/portal.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  local = new DatabaseSync(file);
  return local;
}

export const db = {
  async all(sql, params) {
    if (usingD1()) return (await d1(sql, params)).results || [];
    return (await sqlite()).prepare(sql).all(...norm(params)).map(r => ({ ...r }));
  },
  async first(sql, params) { return (await this.all(sql, params))[0] || null; },
  async run(sql, params) {
    if (usingD1()) { const r = await d1(sql, params); return { changes: r.meta?.changes || 0, lastId: r.meta?.last_row_id || null }; }
    const r = (await sqlite()).prepare(sql).run(...norm(params));
    return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  },
  /** Runs every statement of the schema file (idempotent). */
  async migrate() {
    const sql = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf8").replace(/^--.*$/gm, "");
    for (const stmt of sql.split(";").map(s => s.trim()).filter(Boolean)) await this.run(stmt, []);
  },
};
