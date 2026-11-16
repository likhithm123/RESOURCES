// Local API server (the Vite dev server proxies /api to it). Loads .env.local, creates tables if needed.
import fs from "node:fs";
for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#") && !(line.slice(0, i).trim() in process.env)) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const { serve } = await import("@hono/node-server");
const { app } = await import("./app.js");
const { db, usingD1 } = await import("./db.js");
if (process.argv.includes("--migrate")) { await db.migrate(); console.log("schema applied to", usingD1() ? "Cloudflare D1" : "local SQLite"); process.exit(0); }
if (!usingD1()) await db.migrate();
const port = Number(process.env.API_PORT || 8799);
serve({ fetch: app.fetch, port });
console.log(`API on http://localhost:${port} using ${usingD1() ? "Cloudflare D1" : "local SQLite (.data/portal.db)"}`);
