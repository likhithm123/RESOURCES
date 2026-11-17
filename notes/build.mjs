// Builds handwritten-notebook PDFs from content/*.md using headless Chrome.
// usage: node build.mjs [filter...]     (filter = substring of the file name)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const outDir = join(here, '..', 'pdfs');
const tmpDir = join(here, '.build');
mkdirSync(outDir, { recursive: true }); mkdirSync(tmpDir, { recursive: true });

const b64 = f => readFileSync(join(here, 'node_modules/@fontsource/kalam/files', f)).toString('base64');
const fonts = `
@font-face{font-family:Kalam;font-weight:400;src:url(data:font/woff2;base64,${b64('kalam-latin-400-normal.woff2')}) format('woff2');}
@font-face{font-family:Kalam;font-weight:700;src:url(data:font/woff2;base64,${b64('kalam-latin-700-normal.woff2')}) format('woff2');}`;
const css = readFileSync(join(here, 'style.css'), 'utf8');
const rough = readFileSync(join(here, 'node_modules/roughjs/bundled/rough.js'), 'utf8');
const render = readFileSync(join(here, 'render.js'), 'utf8');
const date = process.env.NOTE_DATE || '16/11/26';

// A topic may be split over several files: 11-dsa.md, 11-dsa.2.md ... are concatenated.
const all = readdirSync(join(here, 'content')).filter(f => f.endsWith('.md')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const groups = new Map();
for (const f of all) { const key = f.replace(/(\.\d+)?\.md$/, ''); (groups.get(key) || groups.set(key, []).get(key)).push(f); }
const filters = process.argv.slice(2);
const jobs = [...groups.entries()].filter(([k]) => !filters.length || filters.some(x => k.includes(x)));

function buildOne([key, files]) {
  return new Promise(res => {
    const src = files.map(f => readFileSync(join(here, 'content', f), 'utf8')).join('\n');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>loading</title><style>${fonts}${css}</style></head><body>
<script type="text/plain" id="src">${src.replace(/<\/script/gi, '<\\/script')}</script><div id="doc"></div>
<script>window.NOTE_DATE=${JSON.stringify(date)};</script><script>${rough}</script><script>${render}</script></body></html>`;
    const hp = join(tmpDir, key + '.html'); writeFileSync(hp, html);
    const pdf = join(outDir, key + '.pdf');
    const prof = join(os.tmpdir(), 'hwnotes-' + process.pid + '-' + key);
    const t0 = Date.now();
    execFile(CHROME, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--user-data-dir=' + prof, '--virtual-time-budget=120000', '--run-all-compositor-stages-before-draw', '--print-to-pdf=' + pdf, 'file://' + hp],
      { timeout: 600000, maxBuffer: 1 << 26 }, (err, so, se) => {
        try { rmSync(prof, { recursive: true, force: true }); } catch {}
        const ok = !err && existsSync(pdf);
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${key}.pdf  ${((Date.now() - t0) / 1000).toFixed(1)}s ${ok ? '' : (err && err.message || se).slice(0, 300)}`);
        res(ok);
      });
  });
}

const N = Number(process.env.JOBS || 4); let i = 0, fail = 0;
await Promise.all(Array.from({ length: N }, async () => { while (i < jobs.length) { const j = jobs[i++]; if (!(await buildOne(j))) fail++; } }));
console.log(`done: ${jobs.length - fail}/${jobs.length} PDFs in ${outDir}`);
process.exit(fail ? 1 : 0);
