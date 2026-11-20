import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const auth = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
const dir = path.resolve("..", "long_notes", "pdfs");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".pdf")).sort();
console.log(`Uploading ${files.length} raw Master PDFs to ImageKit /resources-portal/long-pdfs...`);

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const fullPath = path.join(dir, file);
  const fd = new FormData();
  fd.append("file", new Blob([fs.readFileSync(fullPath)], { type: "application/pdf" }), file);
  fd.append("fileName", file);
  fd.append("folder", "/resources-portal/long-pdfs");
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
        console.log(`[${i+1}/${files.length}] Uploaded ${file} (${(fs.statSync(fullPath).size/(1024*1024)).toFixed(2)} MB)`);
        break;
      }
      console.warn(`Attempt ${attempt} failed: ${res.status}`);
    } catch (e) {
      console.warn(`Attempt ${attempt} error:`, e.message);
    }
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
}
console.log("All raw master PDFs uploaded successfully!");
