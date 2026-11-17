// View-only reader: the file arrives scrambled, is unscrambled in memory and painted page by page on canvas.
import * as pdfjs from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';
const LS = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const IDLE_MS = 15 * 60 * 1000, state = document.getElementById('state'), pages = document.getElementById('pages');
const token = LS('upsc.token'), user = LS('upsc.user') || '', id = new URLSearchParams(location.search).get('id');
const leave = () => location.replace('/');
const touch = () => { try { localStorage.setItem('upsc.last', Date.now()); } catch {} };
if (!token || !/^\d+$/.test(id || '') || Date.now() - (LS('upsc.last') || 0) > IDLE_MS) leave();
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, touch, { passive: true }));
setInterval(() => { if (!LS('upsc.token') || Date.now() - (LS('upsc.last') || 0) > IDLE_MS) leave(); }, 15000);
addEventListener('contextmenu', e => e.preventDefault());
addEventListener('dragstart', e => e.preventDefault());
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) e.preventDefault(); });

try {
  const r = await fetch('/api/file/' + id, { headers: { authorization: 'Bearer ' + token } });
  if (r.status === 401) leave();
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Could not open the notebook');
  const title = decodeURIComponent(r.headers.get('x-title') || 'Notebook');
  document.title = title; document.getElementById('title').firstChild.textContent = title;
  const data = new Uint8Array(await r.arrayBuffer());
  const key = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token + ':' + id)));
  for (let i = 0; i < data.length; i++) data[i] ^= key[i & 31];
  const pdf = await pdfjs.getDocument({ data }).promise;
  document.getElementById('sub').textContent = `View only · ${pdf.numPages} pages · ${user}`;
  state.remove();
  const scale = Math.min(2, (window.devicePixelRatio || 1) * 1.3);
  const io = new IntersectionObserver(es => es.forEach(async e => {
    if (!e.isIntersecting || e.target.dataset.done) return; e.target.dataset.done = 1;
    const page = await pdf.getPage(Number(e.target.dataset.n)), vp = page.getViewport({ scale });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; e.target.appendChild(c);
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  }), { rootMargin: '900px' });
  for (let n = 1; n <= pdf.numPages; n++) { const d = document.createElement('div'); d.className = 'pg'; d.dataset.n = n; d.dataset.wm = user; d.style.aspectRatio = '794 / 1110'; pages.appendChild(d); io.observe(d); }
} catch (e) { state.textContent = e.message; }
