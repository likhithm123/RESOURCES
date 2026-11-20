// Publishes notebooks: renders each PDF in ../pdfs to page images, uploads them to ImageKit as PRIVATE files
// and saves the document row. The PDF itself is never uploaded.
// Usage: node scripts/upload-pdfs.mjs [filter...]      (filter = part of the file name; no filter = all)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#") && !(line.slice(0, i).trim() in process.env)) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const { db, usingD1 } = await import("../server/db.js");
const { ikFolder, ikDeleteFolder } = await import("../server/lib.js");
const { indexText } = await import("./index-text.mjs");
const { NOTEBOOKS } = await import("../src/shared/catalog.ts").catch(async () => {
  // plain node cannot import .ts on old versions: read the slugs with a regex instead
  const src = fs.readFileSync("src/shared/catalog.ts", "utf8");
  const ALL = ["sde", "fullstack", "ai", "ml", "data", "devops", "security", "salesforce"];
  return { NOTEBOOKS: [...src.matchAll(/slug: "([^"]+)", title: "([^"]+)", roles: (ALL|\[[^\]]*\])/g)].map(m => ({ slug: m[1], title: m[2], roles: m[3] === "ALL" ? ALL : JSON.parse(m[3]) })) };
});
const auth = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
const pdfDir = path.resolve("..", "all_pdfs_local", "01_quick_revision_notes_pdfs");
const filters = process.argv.slice(2);
const files = fs.readdirSync(pdfDir).filter(f => f.endsWith(".pdf") && (!filters.length || filters.some(x => f.includes(x)))).sort();
await db.migrate();
console.log(`database: ${usingD1() ? "Cloudflare D1" : "local SQLite"} | ${files.length} PDF(s)`);

async function upload(file, folder) {
  for (let attempt = 1; ; attempt++) {
    const fd = new FormData();
    fd.append("file", new Blob([fs.readFileSync(file)], { type: "image/jpeg" }), path.basename(file));
    fd.append("fileName", path.basename(file)); fd.append("folder", folder);
    fd.append("useUniqueFileName", "false"); fd.append("isPrivateFile", "true"); fd.append("overwriteFile", "true");
    const r = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", headers: { Authorization: auth }, body: fd }).catch(() => null);
    if (r?.ok) return;
    if (attempt >= 4) throw new Error(`upload failed for ${file}: ${r?.status} ${await r?.text().catch(() => "")}`);
    await new Promise(res => setTimeout(res, 1500 * attempt));
  }
}

for (const f of files) {
  const slug = f.replace(/\.pdf$/, "");
  const nb = NOTEBOOKS.find(n => n.slug === slug);
  const old = await db.first("SELECT * FROM rp_documents WHERE slug = ?", [slug]);
  const version = (old?.version || 0) + 1, folder = `${ikFolder()}/docs/${slug}-v${version}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pages-"));
  const pages = Number(execFileSync("python3", ["scripts/render_pages.py", path.join(pdfDir, f), tmp]).toString().trim());
  const imgs = fs.readdirSync(tmp).sort().map(x => path.join(tmp, x));
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (next < imgs.length) { await upload(imgs[next++], folder); ++done; } }));
  const title = nb?.title || slug, roles = JSON.stringify(nb?.roles || []), order = nb ? NOTEBOOKS.indexOf(nb) + 1 : 99;
  if (old) {
    await db.run("UPDATE rp_documents SET title = ?, career_roles = ?, ik_folder = ?, pages = ?, version = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?", [title, roles, folder, pages, version, order, old.id]);
    await ikDeleteFolder(old.ik_folder);
  } else await db.run("INSERT INTO rp_documents (slug, title, career_roles, ik_folder, pages, version, sort_order) VALUES (?,?,?,?,?,?,?)", [slug, title, roles, folder, pages, version, order]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(" ✓");
  await indexText(slug, path.join(pdfDir, f));
}
