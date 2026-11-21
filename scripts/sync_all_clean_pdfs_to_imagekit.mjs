import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const auth = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
const masterDir = path.resolve("..", "all_pdfs_local", "02_long_form_master_editions_pdfs");
const quickDir = path.resolve("..", "all_pdfs_local", "01_quick_revision_notes_pdfs");

const masterFiles = fs.readdirSync(masterDir).filter(f => f.endsWith(".pdf")).sort();
const quickFiles = fs.readdirSync(quickDir).filter(f => f.endsWith(".pdf")).sort();

const allUploads = [
  ...masterFiles.map(f => ({ dir: masterDir, file: f, folder: "/resources-portal/long-pdfs" })),
  ...quickFiles.map(f => ({ dir: quickDir, file: f, folder: "/resources-portal/pdfs" }))
];

console.log(`Starting upload of ${allUploads.length} clean PDFs to ImageKit (${masterFiles.length} Master + ${quickFiles.length} Quick Revision)...`);

async function uploadFile(item, index) {
  const { dir, file, folder } = item;
  const fullPath = path.join(dir, file);
  const sizeMB = (fs.statSync(fullPath).size / (1024 * 1024)).toFixed(2);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const fd = new FormData();
      fd.append("file", new Blob([fs.readFileSync(fullPath)], { type: "application/pdf" }), file);
      fd.append("fileName", file);
      fd.append("folder", folder);
      fd.append("useUniqueFileName", "false");
      fd.append("isPrivateFile", "false");
      fd.append("overwriteFile", "true");

      const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: { Authorization: auth },
        body: fd
      });

      if (res.ok) {
        console.log(`[${index + 1}/${allUploads.length}] OK: ${file} (${sizeMB} MB) -> ${folder}`);
        return true;
      }
      const errText = await res.text().catch(() => "");
      console.warn(`[${index + 1}/${allUploads.length}] Attempt ${attempt} failed for ${file}: status ${res.status} - ${errText.slice(0, 100)}`);
    } catch (err) {
      console.warn(`[${index + 1}/${allUploads.length}] Attempt ${attempt} error for ${file}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`Failed to upload ${file} after 5 attempts`);
}

// Upload with concurrency of 4
const CONCURRENCY = 4;
let currentIndex = 0;

async function worker() {
  while (currentIndex < allUploads.length) {
    const idx = currentIndex++;
    await uploadFile(allUploads[idx], idx);
  }
}

const workers = Array.from({ length: CONCURRENCY }, () => worker());
await Promise.all(workers);

console.log("ALL 82 CLEAN PDFS SUCCESSFULLY UPLOADED TO IMAGEKIT WITH OVERWRITE!");
