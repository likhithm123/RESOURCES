const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let token = sessionStorage.getItem('upsc.admin') || '', rows = [];

async function api(path, opts = {}) {
  const isForm = opts.body instanceof FormData;
  const r = await fetch('/api' + path, { method: opts.method || 'GET', headers: { ...(isForm ? {} : { 'content-type': 'application/json' }), authorization: 'Bearer ' + token }, body: isForm ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && path !== '/admin/login') { signOut(); }
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
function signOut() { token = ''; sessionStorage.removeItem('upsc.admin'); show(); }
function show() { $('#login').hidden = !!token; $('#cms').hidden = !token; $('#out').hidden = !token; if (token) load(); }
const msg = (el, text, cls = '') => { el.className = 'msg ' + cls; el.textContent = text; };

async function load() {
  try {
    const [lib, stats] = await Promise.all([api('/resources'), api('/admin/stats')]);
    rows = lib.resources; $('#noticeForm').notice.value = lib.notice; $('#noticeForm').signup.value = lib.signup;
    $('#stats').innerHTML = [[stats.users, 'Accounts'], [rows.length, 'Resources'], [rows.filter(r => r.category === 'notebook').length, 'Notebook PDFs']].map(([v, l]) => `<div class="card stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('#resTable').innerHTML = '<tr><th>Title</th><th>Category</th><th>Type</th><th>Sort</th><th></th></tr>' + (rows.map(r => `<tr><td>${r.protected ? esc(r.title) + ' <span class="tag">protected</span>' : `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>`}${r.slug ? `<div class="intro" style="margin:0">${esc(r.slug)}</div>` : ''}</td><td>${esc(r.category)}</td><td>${esc(r.kind)}</td><td>${r.sort}</td><td style="white-space:nowrap"><button class="btn" data-edit="${r.id}">Edit</button> <button class="btn danger" data-del="${r.id}">Delete</button></td></tr>`).join('') || '<tr><td colspan="5">No resources yet.</td></tr>');
    $('#learners').innerHTML = '<tr><th>Username</th><th>Topics started</th><th>Last activity</th></tr>' + (stats.learners.map(l => `<tr><td>${esc(l.username)}</td><td>${l.topics}</td><td>${l.last ? new Date(l.last).toLocaleString() : '-'}</td></tr>`).join('') || '<tr><td colspan="3">No accounts yet.</td></tr>');
  } catch (e) { if (token) msg($('#resMsg'), e.message, 'bad'); }
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  try { token = (await api('/admin/login', { method: 'POST', body: { password: e.target.password.value } })).token; sessionStorage.setItem('upsc.admin', token); e.target.reset(); msg($('#loginMsg'), ''); show(); }
  catch (er) { token = ''; msg($('#loginMsg'), er.message, 'bad'); }
});
$('#out').onclick = signOut;
$('#noticeForm').addEventListener('submit', async e => { e.preventDefault(); try { await api('/admin/notice', { method: 'POST', body: { notice: e.target.notice.value, signup: e.target.signup.value } }); msg($('#noticeMsg'), 'Saved', 'ok'); } catch (er) { msg($('#noticeMsg'), er.message, 'bad'); } });

function resetForm() { const f = $('#resForm'); f.reset(); f.id.value = ''; $('#formTitle').textContent = 'Add a resource'; $('#cancel').hidden = true; }
$('#cancel').onclick = resetForm;
$('#resForm').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, m = $('#resMsg');
  try {
    let url = f.url.value.trim(), file_id = null; const file = f.file.files[0];
    if (file) {
      msg(m, 'Uploading to ImageKit...');
      const fd = new FormData(); fd.append('file', file); fd.append('fileName', file.name); fd.append('folder', f.category.value === 'notebook' ? 'notes' : 'library');
      const up = await api('/admin/upload', { method: 'POST', body: fd }); url = up.url; file_id = up.fileId;
    }
    if (!url) throw new Error('Choose a file or paste a URL');
    await api('/admin/resources', { method: 'POST', body: { id: Number(f.id.value) || undefined, slug: f.slug.value.trim() || undefined, title: f.title.value, category: f.category.value, kind: f.kind.value, url, file_id, description: f.description.value, sort: f.sort.value } });
    resetForm(); msg(m, 'Saved', 'ok'); load();
  } catch (er) { msg(m, er.message, 'bad'); }
});
$('#resTable').addEventListener('click', async e => {
  const ed = e.target.dataset.edit, del = e.target.dataset.del;
  if (ed) { const r = rows.find(x => x.id == ed), f = $('#resForm'); f.id.value = r.id; f.title.value = r.title; f.category.value = r.category; f.slug.value = r.slug || ''; f.kind.value = r.kind; f.url.value = r.url; f.description.value = r.description || ''; f.sort.value = r.sort; $('#formTitle').textContent = 'Edit resource'; $('#cancel').hidden = false; f.scrollIntoView({ behavior: 'smooth' }); }
  if (del && confirm('Delete this resource? Its ImageKit file (if any) is removed too. This cannot be undone.')) { try { await api('/admin/resources/' + del + '?file=1', { method: 'DELETE' }); load(); } catch (er) { msg($('#resMsg'), er.message, 'bad'); } }
});
show();
