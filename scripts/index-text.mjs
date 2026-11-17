// Saves the searchable text (words + positions) of each published notebook PDF into rp_doc_pages.
// Usage: node scripts/index-text.mjs [filter...]   (filter = part of the PDF file name)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#") && !(line.slice(0, i).trim() in process.env)) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const { db } = await import("../server/db.js");
await db.migrate();
export async function indexText(slug, pdfPath) {
  const doc = await db.first("SELECT id FROM rp_documents WHERE slug = ?", [slug]);
  if (!doc) return console.log(`${slug}: not published yet, skipped`);
  const pages = JSON.parse(execFileSync("python3", ["scripts/page_words.py", pdfPath], { maxBuffer: 1 << 28 }).toString());
  await db.run("DELETE FROM rp_doc_pages WHERE doc_id = ?", [doc.id]);
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < pages.length) {
      const n = next++;
      await db.run("INSERT OR REPLACE INTO rp_doc_pages (doc_id, page, text, boxes) VALUES (?, ?, ?, ?)", [doc.id, n + 1, pages[n].text, JSON.stringify(pages[n].boxes)]);
    }
  }));
  console.log(`${slug}: ${pages.length} pages indexed for search`);
}
if (process.argv[1].endsWith("index-text.mjs")) {
  const dir = path.resolve("..", "pdfs"), filters = process.argv.slice(2);
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".pdf") && (!filters.length || filters.some(x => f.includes(x)))).sort())
    await indexText(f.replace(/\.pdf$/, ""), path.join(dir, f));
}
