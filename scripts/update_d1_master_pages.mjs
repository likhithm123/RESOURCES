import fs from "node:fs";
import path from "node:path";
import pypdf from "node:child_process";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const { db } = await import("../server/db.js");

const dir = path.resolve("..", "long_notes", "pdfs");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".pdf"));

for (const f of files) {
  const slug = f.replace(/\.pdf$/, "");
  const fullPath = path.join(dir, f);
  // Get page count via pdfjs or python
  const pagesStr = pypdf.execSync(`python3 -c "import pypdf; print(len(pypdf.PdfReader('${fullPath}').pages))"`).toString().trim();
  const pages = Number(pagesStr);
  const exists = await db.first("SELECT id, pages FROM rp_documents WHERE slug = ?", [slug]);
  if (exists) {
    await db.run("UPDATE rp_documents SET pages = ? WHERE slug = ?", [pages, slug]);
    console.log(`Updated D1: ${slug} -> ${pages} pages`);
  } else {
    const title = slug.replace(/-master$/, "").toUpperCase().replace(/-/g, " ") + " [Master Deep-Dive Edition]";
    await db.run(
      "INSERT INTO rp_documents (slug, title, description, career_roles, ik_folder, pages, version, sort_order, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [slug, title, `Master Deep-Dive Edition (${pages} pages)`, "[]", `/resources-portal/long-docs/${slug}-v1`, pages, 1, 999, 1]
    );
    console.log(`Inserted into D1: ${slug} -> ${pages} pages`);
  }
}
console.log("All D1 page counts updated successfully!");
