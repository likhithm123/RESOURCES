// Generates public/topics.json from ../notes/content so the tracker always matches the notebooks.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', '..', 'notes', 'content');
const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const slug = s => s.toLowerCase().replace(/\*\*|`/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const books = new Map();
for (const f of files) {
  const key = f.replace(/(\.\d+)?\.md$/, '');
  const b = books.get(key) || books.set(key, { key, no: Number(key.slice(0, 2)), title: '', intro: '', topics: [] }).get(key);
  let cur = null;
  for (const ln of readFileSync(join(dir, f), 'utf8').split('\n')) {
    let m;
    if ((m = ln.match(/^# (.*)/))) { if (!b.title) b.title = m[1].replace(/\*\*/g, ''); }
    else if ((m = ln.match(/^## (.*)/))) {
      const title = m[1].replace(/\*\*|`/g, ''); let id = key.slice(0, 2) + '-' + slug(title), n = 2;
      while (b.topics.some(t => t.id === id)) id = key.slice(0, 2) + '-' + slug(title) + '-' + n++;
      cur = { id, title, subs: [] }; b.topics.push(cur);
    } else if ((m = ln.match(/^### (.*)/)) && cur) cur.subs.push(m[1].replace(/\*\*|`/g, ''));
    else if (!b.intro && b.title && ln.trim() && !/^[#|@>-]/.test(ln)) b.intro = ln.replace(/\*\*|`/g, '').slice(0, 260);
  }
}
const out = [...books.values()];
writeFileSync(join(here, '..', 'public', 'topics.json'), JSON.stringify(out));
console.log(`topics.json: ${out.length} notebooks, ${out.reduce((s, b) => s + b.topics.length, 0)} topics`);
