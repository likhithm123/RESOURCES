import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const auth = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
const masterDir = path.resolve("..", "all_pdfs_local", "02_long_form_master_editions_pdfs");
const quickDir = path.resolve("..", "all_pdfs_local", "01_quick_revision_notes_pdfs");

const uploads = [
  { dir: masterDir, file: "19-ai-engineer-llms-master.pdf", folder: "/resources-portal/long-pdfs" },
  { dir: quickDir, file: "19-ai-engineer-llms.pdf", folder: "/resources-portal/pdfs" }
];

console.log(`Uploading ${uploads.length} updated PDFs to ImageKit...`);

for (let i = 0; i < uploads.length; i++) {
  const { dir, file, folder } = uploads[i];
  const fullPath = path.join(dir, file);
  const fd = new FormData();
  fd.append("file", new Blob([fs.readFileSync(fullPath)], { type: "application/pdf" }), file);
  fd.append("fileName", file);
  fd.append("folder", folder);
  fd.append("useUniqueFileName", "false");
  fd.append("isPrivateFile", "false");
  fd.append("overwriteFile", "true");

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        headers: { Authorization: auth },
        body: fd
      });
      if (res.ok) {
        console.log(`[${i+1}/${uploads.length}] Successfully uploaded ${file} to ${folder} (${(fs.statSync(fullPath).size/(1024*1024)).toFixed(2)} MB)`);
        break;
      }
      console.warn(`Attempt ${attempt} failed: ${res.status}`);
    } catch (e) {
      console.warn(`Attempt ${attempt} error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
}
console.log("Upload completed!");
