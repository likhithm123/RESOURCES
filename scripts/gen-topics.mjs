// Builds src/shared/topics.json (the checklist) from the notebook markdown in ../notes/content.
// Each "## " heading is a section; each "### " heading under it is a checklist item.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dir = existsSync(join(here, "..", "..", "notes", "content"))
  ? join(here, "..", "..", "notes", "content")
  : join(here, "..", "notes", "content");
const out = join(here, "..", "src", "shared", "topics.json");
const slugify = s => s.toLowerCase().replace(/\*\*|`/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

if (!existsSync(dir)) { console.log("notes/content not found - keeping the committed topics.json"); process.exit(0); }
const pm = join(here, "..", "..", "notes", "pagemap.json");
const pagemap = existsSync(pm) ? JSON.parse(readFileSync(pm, "utf8")) : {};
const mpm = existsSync(join(here, "..", "..", "notes", "master_pagemap.json"))
  ? join(here, "..", "..", "notes", "master_pagemap.json")
  : existsSync(join(here, "..", "master_pagemap.json"))
  ? join(here, "..", "master_pagemap.json")
  : null;
const masterPagemap = mpm ? JSON.parse(readFileSync(mpm, "utf8")) : {};
const tufMapPath = join(here, "..", "src", "shared", "tuf_map.json");
const tufMap = existsSync(tufMapPath) ? JSON.parse(readFileSync(tufMapPath, "utf8")) : {};
const notebooks = {};
{
  const files = readdirSync(dir).filter(f => f.endsWith(".md")).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  for (const f of files) {
    const slug = f.replace(/(\.\d+)?\.md$/, "");
    const nb = (notebooks[slug] ||= { slug, sections: [] });
    let section = nb.sections.at(-1);
    let inCode = false;
    for (const line of readFileSync(join(dir, f), "utf8").split("\n")) {
      if (line.startsWith("```")) { inCode = !inCode; continue; }
      if (inCode) continue;
      if (line.startsWith("## ")) {
        const title = line.slice(3).replace(/\*\*/g, "").trim();
        section = { id: `${slug}/${slugify(title)}`, title, items: [], page: pagemap[slug]?.[title] || 1 };
        nb.sections.push(section);
      } else if (line.startsWith("### ") && section) {
        const title = line.slice(4).replace(/\*\*/g, "").trim();
        let id = `${section.id}/${slugify(title)}`;
        while (section.items.some(i => i.id === id)) id += "-x";
        const itShort = pagemap[slug]?.[section.title + " >> " + title] || section.page || 1;
        const tuf = tufMap[id] || tufMap[slugify(title)];
        section.items.push({
          id,
          title,
          page: itShort,
          ...(tuf?.url ? { tufUrl: tuf.url } : {}),
          ...(tuf?.type ? { tufType: tuf.type } : {}),
          ...(tuf?.slug ? { tufSlug: tuf.slug } : {}),
          ...(tuf?.leetcode ? { leetcodeUrl: tuf.leetcode } : {}),
          ...(tuf?.gfg ? { gfgUrl: tuf.gfg } : {}),
          ...(tuf?.youtube ? { youtubeUrl: tuf.youtube } : {}),
          ...(tuf?.duration ? { duration: tuf.duration } : {}),
        });
      }
    }
  }
  // A section without sub-items becomes one checklist item itself.
  for (const nb of Object.values(notebooks))
    for (const s of nb.sections) if (!s.items.length) s.items.push({ id: s.id + "/done", title: s.title, page: s.page });
}
// Deep-dive editions: every "## " topic of long_notes becomes a checklist item that opens the deep-dive PDF at its page.
const longDir = join(here, "..", "..", "long_notes", "content");
if (existsSync(longDir)) {
  const files = readdirSync(longDir).filter(f => f.endsWith(".md")).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  for (const f of files) {
    const masterSlug = f.replace(/(\.\d+)?\.md$/, "");
    const base = masterSlug.replace(/-master$/, "");
    const nb = (notebooks[base] ||= { slug: base, sections: [] });
    let sec = nb.sections.find(x => x.deep);
    if (!sec) { sec = { id: `${base}/deep`, title: "Deep-Dive Edition topics", deep: true, items: [] }; nb.sections.push(sec); }
    let inCode = false;
    for (const line of readFileSync(join(longDir, f), "utf8").split("\n")) {
      if (line.startsWith("```")) { inCode = !inCode; continue; }
      if (inCode || !line.startsWith("## ")) continue;
      const title = line.slice(3).replace(/\*\*/g, "").trim();
      let id = `${base}/deep/${slugify(title)}`;
      while (sec.items.some(i => i.id === id)) id += "-x";
      sec.items.push({ id, title, deep: true, masterPage: masterPagemap[masterSlug]?.[title] || 1 });
    }
    sec.masterPage = sec.items[0]?.masterPage || 1;
  }
}
// Cross links: each item also points at the matching page in the other edition (built by notes/crossmap.py).
const cmPath = join(here, "..", "..", "notes", "crossmap.json");
if (existsSync(cmPath)) {
  const cm = JSON.parse(readFileSync(cmPath, "utf8"));
  for (const nb of Object.values(notebooks)) for (const s of nb.sections) for (const it of s.items) {
    const p = cm[nb.slug]?.[it.id]; if (!p) continue;
    if (it.deep || s.deep) it.page = p; else it.masterPage = p;
  }
}
writeFileSync(out, JSON.stringify(notebooks));
const count = Object.values(notebooks).reduce((n, nb) => n + nb.sections.reduce((m, s) => m + s.items.length, 0), 0);
console.log(`topics.json: ${Object.keys(notebooks).length} notebooks, ${count} checklist items`);
