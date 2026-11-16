// Tracker: ticks are stored locally as {topicId: {s: bitmask, t: timestamp}} and merged with D1 (last write wins).
const $ = s => document.querySelector(s);
const LS = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let books = [], prog = LS.get('upsc.progress', {}), token = LS.get('upsc.token', null), user = LS.get('upsc.user', null);
let dirty = new Set(LS.get('upsc.dirty', [])), pdfs = {}, timer;
const BITS = [[1, 'Read'], [2, 'Practised'], [4, 'Revised']];
const st = id => (prog[id] ? prog[id].s : 0);
const bits = n => (n & 1) + ((n >> 1) & 1) + ((n >> 2) & 1);

const IDLE_MS = 15 * 60 * 1000; // sign out after 15 minutes without activity
const touch = () => LS.set('upsc.last', Date.now());
function signOutLocal(why) {
  token = null; LS.set('upsc.token', null); prog = {}; dirty = new Set(); pdfs = {};
  ['upsc.progress', 'upsc.dirty'].forEach(k => { try { localStorage.removeItem(k); } catch {} });
  gate(); if (why) { const m = $('#authMsg'); m.className = 'msg bad'; m.textContent = why; }
}
function gate() { // nothing is shown without signing in
  const inn = !!token; document.body.classList.toggle('locked', !inn);
  ['track', 'library', 'check'].forEach(id => $('#' + id).hidden = true);
  $('#account').hidden = false; $('#tabs').hidden = !inn; showAccount();
  if (inn) { $('#account').hidden = true; $('#track').hidden = false; document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === 'track')); }
  else setSync('', 'Sign in required');
}
['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (token && Date.now() - LS.get('upsc.last', 0) > 5000) touch(); }, { passive: true }));
setInterval(() => { if (token && Date.now() - LS.get('upsc.last', 0) > IDLE_MS) { api('/logout', { method: 'POST' }).catch(() => {}); signOutLocal('Signed out after 15 minutes of inactivity.'); } }, 20000);

function setSync(state, text) { $('#dot').className = 'dot ' + state; $('#syncText').textContent = text; }
function save() { LS.set('upsc.progress', prog); LS.set('upsc.dirty', [...dirty]); }

async function api(path, opts = {}) {
  const r = await fetch('/api' + path, { ...opts, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'Request failed'), { status: r.status });
  return d;
}

async function sync() {
  if (!token) return;
  setSync('busy', 'Syncing...');
  try {
    const sending = [...dirty];
    const d = await api('/progress', sending.length ? { method: 'POST', body: { items: sending.map(id => ({ id, s: prog[id].s, t: prog[id].t })) } } : {});
    sending.forEach(id => dirty.delete(id));
    for (const it of d.items) if (!prog[it.id] || it.t > prog[it.id].t) prog[it.id] = { s: it.s, t: it.t };
    save(); render();
    setSync('ok', 'Synced as ' + d.username);
  } catch (e) {
    if (e.status === 401) signOutLocal('Session expired - sign in again.');
    else setSync('bad', 'Offline - will retry');
  }
}
function queueSync() { clearTimeout(timer); timer = setTimeout(sync, 900); }

function toggle(id, bit) {
  prog[id] = { s: st(id) ^ bit, t: Date.now() };
  dirty.add(id); markDay(); save(); render(); queueSync();
}
function markDay() { const d = LS.get('upsc.days', []); const today = new Date().toISOString().slice(0, 10); if (!d.includes(today)) { d.push(today); LS.set('upsc.days', d.slice(-400)); } }
function streak() {
  const d = new Set(LS.get('upsc.days', [])); let n = 0; const x = new Date();
  if (!d.has(x.toISOString().slice(0, 10))) x.setDate(x.getDate() - 1);
  while (d.has(x.toISOString().slice(0, 10))) { n++; x.setDate(x.getDate() - 1); }
  return n;
}

const open = new Set(LS.get('upsc.open', []));
function render() {
  const q = $('#q').value.trim().toLowerCase();
  let total = 0, got = [0, 0, 0], full = 0;
  const html = books.map(b => {
    const c = [0, 0, 0]; let done = 0;
    b.topics.forEach(t => { const s = st(t.id); BITS.forEach(([bit], i) => { if (s & bit) c[i]++; }); if (s === 7) done++; });
    total += b.topics.length; full += done; c.forEach((v, i) => got[i] += v);
    const n = b.topics.length || 1, pct = Math.round((c[0] + c[1] + c[2]) / (3 * n) * 100);
    const shown = b.topics.filter(t => !q || (t.title + ' ' + t.subs.join(' ') + ' ' + b.title).toLowerCase().includes(q));
    if (q && !shown.length) return '';
    const pdf = pdfs[b.key];
    return `<details class="card book" data-key="${b.key}" ${open.has(b.key) || q ? 'open' : ''}>
      <summary><span class="no">${b.no}</span><span class="bt">${esc(b.title)}<small>${done}/${b.topics.length} topics complete</small></span><span class="pct">${pct}%</span>
      <span class="meter"><i class="a" style="width:${c[0] / n * 33.34}%"></i><i class="b" style="width:${c[1] / n * 33.33}%"></i><i class="c" style="width:${c[2] / n * 33.33}%"></i></span></summary>
      <div class="inner"><p class="intro">${esc(b.intro)}</p>
      <div class="tools">${pdf ? `<a class="btn primary" href="${esc(pdf)}" target="_blank">Read the handwritten notebook</a>` : '<span class="intro">Notebook not uploaded yet.</span>'}</div>
      ${shown.map(t => { const s = st(t.id); return `<div class="topic ${s === 7 ? 'done' : ''}"><div class="t"><span>${esc(t.title)}</span>${t.subs.length ? `<small>${esc(t.subs.join(' · '))}</small>` : ''}</div>
        <div class="chk">${BITS.map(([bit, lab]) => `<button data-id="${t.id}" data-b="${bit}" class="${s & bit ? 'on' : ''}" aria-pressed="${!!(s & bit)}">${lab}</button>`).join('')}</div></div>`; }).join('')}
      </div></details>`;
  }).join('');
  $('#books').innerHTML = html || '<p class="intro">No topic matches your search.</p>';
  const T = total || 1;
  $('#stats').innerHTML = [
    [Math.round((got[0] + got[1] + got[2]) / (3 * T) * 100) + '%', 'Overall progress'],
    [`${full}/${total}`, 'Topics complete'], [got[0], 'Read'], [got[1], 'Practised'], [got[2], 'Revised'], [streak() + ' d', 'Study streak']
  ].map(([v, l]) => `<div class="card stat"><b>${v}</b><span>${l}</span></div>`).join('');
}

const CHECK = ['Explain Indian history from prehistoric times to modern India', 'Explain major world-history developments', 'Understand Indian art and culture', 'Explain physical geography', 'Explain Indian and world geography', 'Solve map-based questions', 'Explain the entire Indian Constitution', 'Understand Parliament and the judiciary', 'Explain Centre-State relations', 'Understand constitutional and statutory institutions', 'Explain how the Indian economy works', 'Understand the Union Budget and Economic Survey', 'Explain agriculture and food security', 'Understand environmental conservation', 'Explain climate change and biodiversity', 'Understand important science and technology developments', "Analyse India's international relations", 'Understand internal security challenges', 'Explain disaster management', 'Understand Indian society', 'Analyse governance and public policies', 'Understand district administration', 'Demonstrate ethical reasoning', 'Solve administrative case studies', 'Write a structured essay', 'Write analytical Mains answers', 'Solve Prelims MCQs accurately', 'Clear the CSAT qualifying paper', 'Complete both optional-subject papers', 'Qualify the language papers', 'Analyse previous-year questions', 'Complete full-length mock examinations', 'Discuss current national and international issues', 'Demonstrate balanced judgement', 'Communicate clearly and confidently'];
function renderCheck() {
  $('#check35').innerHTML = CHECK.map((c, i) => `<li><label class="row" style="color:inherit;font-size:14px"><input type="checkbox" data-id="check-${i + 1}" ${st('check-' + (i + 1)) ? 'checked' : ''}>${i + 1}. ${esc(c)}</label></li>`).join('');
}

async function loadLibrary() {
  try {
    const d = await api('/resources');
    if (d.notice) { $('#notice').hidden = false; $('#notice').textContent = d.notice; }
    const link = r => r.protected ? '/viewer.html?id=' + r.id : r.url;
    pdfs = {}; d.resources.forEach(r => { if (r.category === 'notebook' && r.slug) pdfs[r.slug] = link(r); });
    $('#resList').innerHTML = d.resources.length ? d.resources.map(r => `<div class="res"><div><b>${esc(r.title)}</b><span class="tag">${esc(r.kind)}</span><span class="tag">${esc(r.category)}</span>${r.description ? `<div class="intro" style="margin:2px 0 0">${esc(r.description)}</div>` : ''}</div><a class="btn" href="${esc(link(r))}" target="_blank" rel="noopener">${r.protected ? 'View' : 'Open'}</a></div>`).join('') : '<p class="intro">Nothing uploaded yet. The admin can add PDFs and links from the Admin CMS.</p>';
    render();
  } catch (e) { $('#resList').innerHTML = `<p class="intro">Library unavailable: ${esc(e.message)}</p>`; }
}

function showAccount() { $('#signedIn').hidden = !token; $('#signedOut').hidden = !!token; $('#who').textContent = user || ''; }

document.addEventListener('click', e => {
  const b = e.target.closest('.chk button'); if (b) return toggle(b.dataset.id, Number(b.dataset.b));
  const t = e.target.closest('#tabs button');
  if (t && token) { document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === t)); ['track', 'library', 'check', 'account'].forEach(id => $('#' + id).hidden = id !== t.dataset.tab); }
});
document.addEventListener('toggle', e => { const d = e.target.closest && e.target.closest('.book'); if (!d || $('#q').value) return; d.open ? open.add(d.dataset.key) : open.delete(d.dataset.key); LS.set('upsc.open', [...open]); }, true);
$('#check35').addEventListener('change', e => { const id = e.target.dataset.id; prog[id] = { s: e.target.checked ? 7 : 0, t: Date.now() }; dirty.add(id); save(); queueSync(); });
$('#q').addEventListener('input', render);
$('#authForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = new FormData(e.target), msg = $('#authMsg'); msg.className = 'msg'; msg.textContent = 'Signing in...';
  try {
    const d = await api('/auth', { method: 'POST', body: { username: f.get('username'), password: f.get('password'), create: !!f.get('create') } });
    token = d.token; user = d.username; LS.set('upsc.token', token); LS.set('upsc.user', user);
    touch(); msg.textContent = ''; e.target.reset(); gate(); loadLibrary(); sync();
  } catch (er) { msg.className = 'msg bad'; msg.textContent = er.message; }
});
$('#logout').onclick = async () => { try { await sync(); await api('/logout', { method: 'POST' }); } catch {} signOutLocal(''); };
$('#syncNow').onclick = sync;
$('#export').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(prog)], { type: 'application/json' })); a.download = 'upsc-progress.json'; a.click(); };
$('#import').onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.json'; i.onchange = async () => { try { const d = JSON.parse(await i.files[0].text()); for (const [id, v] of Object.entries(d)) if (v && typeof v.s === 'number' && (!prog[id] || v.t > prog[id].t)) { prog[id] = { s: v.s & 7, t: v.t }; dirty.add(id); } save(); render(); renderCheck(); queueSync(); } catch { alert('Not a valid progress file'); } }; i.click(); };
$('#reset').onclick = () => { if (!confirm('Clear every tick on this device' + (token ? ' and in your cloud account' : '') + '? This cannot be undone.')) return; const t = Date.now(); Object.keys(prog).forEach(id => { prog[id] = { s: 0, t }; dirty.add(id); }); save(); render(); renderCheck(); queueSync(); };
window.addEventListener('focus', () => token && sync());
setInterval(() => token && document.visibilityState === 'visible' && sync(), 60000);

books = await fetch('/topics.json').then(r => r.json()).catch(() => []);
if (token && Date.now() - LS.get('upsc.last', 0) > IDLE_MS) signOutLocal('Signed out after 15 minutes of inactivity.');
gate(); render(); renderCheck(); if (token) { loadLibrary(); sync(); }
