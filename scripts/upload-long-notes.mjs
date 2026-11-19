// Uploads long-form comprehensive edition PDFs (100-250+ pages) from ../long_notes/pdfs to ImageKit & Cloudflare D1
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

const auth = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
const pdfDir = path.resolve("..", "long_notes", "pdfs");
if (!fs.existsSync(pdfDir)) {
  console.log("No long_notes/pdfs directory found.");
  process.exit(0);
}

const filters = process.argv.slice(2);
const files = fs.readdirSync(pdfDir).filter(f => f.endsWith(".pdf") && (!filters.length || filters.some(x => f.includes(x)))).sort();
console.log(`Database: ${usingD1() ? "Cloudflare D1" : "local SQLite"} | Found ${files.length} Long-Form Master PDF(s)`);

async function uploadImage(file, folder) {
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

async function uploadRawPdf(file) {
  const fd = new FormData();
  fd.append("file", new Blob([fs.readFileSync(file)], { type: "application/pdf" }), path.basename(file));
  fd.append("fileName", path.basename(file));
  fd.append("folder", "/resources-portal/long-pdfs");
  fd.append("useUniqueFileName", "false");
  fd.append("isPrivateFile", "false");
  fd.append("overwriteFile", "true");
  const r = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", headers: { Authorization: auth }, body: fd }).catch(() => null);
  return r?.ok;
}

for (const f of files) {
  const slug = f.replace(/\.pdf$/, "");
  const old = await db.first("SELECT * FROM rp_documents WHERE slug = ?", [slug]);
  const version = (old?.version || 0) + 1, folder = `${ikFolder()}/long-docs/${slug}-v${version}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "longpages-"));
  
  console.log(`Rendering pages for ${f}...`);
  const pages = Number(execFileSync("python3", ["scripts/render_pages.py", path.join(pdfDir, f), tmp]).toString().trim());
  const imgs = fs.readdirSync(tmp).sort().map(x => path.join(tmp, x));
  console.log(`Uploading ${imgs.length} page images to ImageKit folder ${folder}...`);

  let next = 0, done = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < imgs.length) {
      await uploadImage(imgs[next++], folder);
      ++done;
      if (done % 20 === 0 || done === imgs.length) process.stdout.write(`  [${done}/${imgs.length}]`);
    }
  }));
  console.log(" ✓ images uploaded");

  console.log(`Uploading raw PDF to ImageKit /resources-portal/long-pdfs/${f}...`);
  await uploadRawPdf(path.join(pdfDir, f));
  console.log(" ✓ PDF uploaded");

  const titleBase = slug.replace(/-/g, " ").replace(/^\d+\s*/, "").toUpperCase();
  const title = `${titleBase} [Master Deep-Dive Edition]`;
  const description = `Comprehensive long-form edition (${pages} pages) with in-depth real-life narrative analogies, line-by-line annotated implementations, inputs/outputs, and algorithmic complexities.`;
  const roles = JSON.stringify(["sde", "fullstack", "ai", "ml", "data", "devops"]);
  const order = 100 + (parseInt(slug.match(/^\d+/)?.[0] || "50", 10));

  if (old) {
    await db.run("UPDATE rp_documents SET title = ?, description = ?, career_roles = ?, ik_folder = ?, pages = ?, version = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?",
      [title, description, roles, folder, pages, version, order, old.id]);
    await ikDeleteFolder(old.ik_folder);
  } else {
    await db.run("INSERT INTO rp_documents (slug, title, description, career_roles, ik_folder, pages, version, sort_order) VALUES (?,?,?,?,?,?,?,?)",
      [slug, title, description, roles, folder, pages, version, order]);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Saved document ${slug} in database (${pages} pages). Indexing text...`);
  await indexText(slug, path.join(pdfDir, f));
  console.log(`✓ Completed ${slug}\n`);
}
