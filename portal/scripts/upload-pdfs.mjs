// Uploads ../pdfs/*.pdf to ImageKit (/upsc/notes) and registers each as a "notebook" resource through the portal's admin API.
// usage: SITE=https://<your-worker>.workers.dev node scripts/upload-pdfs.mjs [filter]   (reads secrets from .dev.vars)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const vars = Object.fromEntries(readFileSync(join(here, '..', '.dev.vars'), 'utf8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const SITE = (process.env.SITE || 'http://localhost:8787').replace(/\/$/, '');
const topics = JSON.parse(readFileSync(join(here, '..', 'public', 'topics.json'), 'utf8'));
const dir = join(here, '..', '..', 'pdfs');
const post = async (path, body, token) => { const r = await fetch(SITE + '/api' + path, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(path + ': ' + d.error); return d; };
const { token } = await post('/admin/login', { password: vars.ADMIN_PASSWORD });
for (const f of readdirSync(dir).filter(f => f.endsWith('.pdf') && (!process.argv[2] || f.includes(process.argv[2]))).sort()) {
  const key = f.replace(/\.pdf$/, ''), book = topics.find(b => b.key === key);
  const fd = new FormData();
  fd.append('file', new Blob([readFileSync(join(dir, f))], { type: 'application/pdf' }), f);
  fd.append('fileName', f); fd.append('folder', '/upsc/notes'); fd.append('useUniqueFileName', 'false'); fd.append('overwriteFile', 'true'); fd.append('isPrivateFile', 'true');
  const r = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(vars.IMAGEKIT_PRIVATE_KEY + ':').toString('base64') }, body: fd });
  const d = await r.json(); if (!r.ok) { console.log('FAIL', f, d.message); continue; }
  await post('/admin/resources', { slug: key, title: book ? book.title : key, category: 'notebook', kind: 'pdf', url: d.url, file_id: d.fileId, description: book ? book.intro : '', sort: Number(key.slice(0, 2)) }, token);
  console.log('ok  ', f, '->', d.url);
}
