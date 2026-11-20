import fs from "node:fs";
import path from "node:path";

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("="); if (i > 0 && !line.startsWith("#")) process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.IK_PRIVATE_KEY;
if (!privateKey) throw new Error("Missing IMAGEKIT_PRIVATE_KEY in .env.local");

const auth = Buffer.from(privateKey + ":").toString("base64");

async function uploadFile(localPath, folderName, fileName) {
  console.log(`Uploading ${fileName} to ${folderName}...`);
  const fileBuffer = fs.readFileSync(localPath);
  const form = new FormData();
  form.append("file", new Blob([fileBuffer]), fileName);
  form.append("fileName", fileName);
  form.append("folder", folderName);
  form.append("useUniqueFileName", "false");
  form.append("overwriteFile", "true");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: "Basic " + auth },
    body: form
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload failed for ${fileName}: ${res.status} ${errText}`);
  }
  const data = await res.json();
  console.log(`Success: ${fileName} -> ${data.filePath} (${(data.size / 1024 / 1024).toFixed(2)} MB)`);
  return data;
}

const root = path.resolve("..");

// 1. Short PDFs
await uploadFile(
  path.join(root, "all_pdfs_local", "01_quick_revision_notes_pdfs", "40-spring-boot-and-microservices.pdf"),
  "/resources-portal/pdfs",
  "40-spring-boot-and-microservices.pdf"
);
await uploadFile(
  path.join(root, "all_pdfs_local", "01_quick_revision_notes_pdfs", "41-go-programming-and-concurrency.pdf"),
  "/resources-portal/pdfs",
  "41-go-programming-and-concurrency.pdf"
);

// 2. Master PDFs
await uploadFile(
  path.join(root, "all_pdfs_local", "02_long_form_master_editions_pdfs", "40-spring-boot-and-microservices-master.pdf"),
  "/resources-portal/long-pdfs",
  "40-spring-boot-and-microservices-master.pdf"
);
await uploadFile(
  path.join(root, "all_pdfs_local", "02_long_form_master_editions_pdfs", "41-go-programming-and-concurrency-master.pdf"),
  "/resources-portal/long-pdfs",
  "41-go-programming-and-concurrency-master.pdf"
);

console.log("All 4 new Spring Boot and Go PDFs uploaded to ImageKit successfully!");
