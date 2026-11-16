// Admin CMS: overview, documents (PDF -> private page images on ImageKit), resources/projects, Connect review, users.
import React, { useEffect, useState } from "react";
import { api, type Doc } from "./api";
import { Msg, RoleChips } from "./App";
import { NOTEBOOKS } from "../shared/catalog";

const TABS = ["Overview", "Documents", "Resources & Projects", "Connect", "Users"] as const;

export default function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  return <>
    <h1>Admin</h1>
    <div className="chips" style={{ margin: "10px 0 16px" }}>{TABS.map(t => <span key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</span>)}</div>
    {tab === "Overview" && <Overview />}{tab === "Documents" && <Documents />}{tab === "Resources & Projects" && <LinksAdmin />}{tab === "Connect" && <ConnectAdmin />}{tab === "Users" && <Users />}
  </>;
}

function Overview() {
  const [s, setS] = useState<any>(null); const [err, setErr] = useState("");
  useEffect(() => { api("/admin/stats").then(setS).catch(e => setErr(e.message)); }, []);
  if (!s) return <Msg>{err}</Msg>;
  return <>
    {!s.imagekit && <Msg>ImageKit is not configured - documents cannot be uploaded or viewed.</Msg>}
    <div className="grid">{[["Active users", s.users], ["Unverified sign-ups", s.unverified], ["Documents", s.docs], ["Links", s.links], ["Connect posts to review", s.pending_posts]].map(([k, v]) =>
      <div className="card" key={k} style={{ marginBottom: 0 }}><div className="muted small">{k}</div><div style={{ fontSize: 26, fontWeight: 700 }}>{v}</div></div>)}</div>
    <div className="card" style={{ marginTop: 14 }}><h2>Most progress</h2><table><thead><tr><th>Name</th><th>Email</th><th>Topics done</th></tr></thead>
      <tbody>{s.top.map((u: any) => <tr key={u.email}><td>{u.name}</td><td>{u.email}</td><td>{u.done}</td></tr>)}</tbody></table></div>
  </>;
}

/** Renders every PDF page to a JPEG in the browser and uploads the images as private ImageKit files. The PDF itself is never uploaded. */
async function uploadPdf(file: File, folder: string, onProgress: (done: number, total: number) => void) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
  const canvas = document.createElement("canvas");
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const vp = page.getViewport({ scale: 1300 / page.getViewport({ scale: 1 }).width });
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp, canvas } as any).promise;
    const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), "image/jpeg", 0.82));
    for (let attempt = 1; ; attempt++) {
      const a = await api("/admin/ik-auth");
      const fd = new FormData();
      fd.append("file", blob, "page.jpg"); fd.append("fileName", `p-${String(n).padStart(4, "0")}.jpg`); fd.append("folder", folder);
      fd.append("useUniqueFileName", "false"); fd.append("isPrivateFile", "true"); fd.append("overwriteFile", "true");
      fd.append("publicKey", a.publicKey); fd.append("signature", a.signature); fd.append("expire", String(a.expire)); fd.append("token", a.token);
      const r = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body: fd });
      if (r.ok) break;
      if (attempt >= 3) throw new Error(`Upload of page ${n} failed (${r.status})`);
    }
    onProgress(n, pdf.numPages);
  }
  return pdf.numPages;
}

function Documents() {
  const [docs, setDocs] = useState<Doc[]>([]); const [err, setErr] = useState(""); const [ok, setOk] = useState(""); const [busy, setBusy] = useState("");
  const [f, setF] = useState<any>({ slug: "", title: "", description: "", career_roles: [], sort_order: 0 }); const [file, setFile] = useState<File | null>(null);
  const load = () => api("/admin/docs").then(r => setDocs(r.docs)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  const pick = (slug: string) => { const nb = NOTEBOOKS.find(n => n.slug === slug); setF({ ...f, slug, title: nb?.title || f.title, career_roles: nb?.roles || f.career_roles, sort_order: nb ? NOTEBOOKS.indexOf(nb) + 1 : f.sort_order }); };
  async function upload(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    if (!file) return setErr("Choose a PDF file.");
    try {
      setBusy("Preparing...");
      const p = await api("/admin/docs/prepare", "POST", { slug: f.slug });
      const pages = await uploadPdf(file, p.folder, (d, t) => setBusy(`Uploading page ${d} of ${t}...`));
      await api("/admin/docs", "POST", { ...f, slug: p.slug, version: p.version, folder: p.folder, pages });
      setOk(`Saved "${f.title}" (${pages} pages).`); setFile(null); load();
    } catch (x: any) { setErr(x.message); } finally { setBusy(""); }
  }
  async function update(d: Doc, patch: any) { await api(`/admin/docs/${d.id}`, "PUT", patch).catch(e => setErr(e.message)); load(); }
  async function remove(d: Doc) { if (confirm(`Delete "${d.title}" and its page images? This cannot be undone.`)) { await api(`/admin/docs/${d.id}`, "DELETE").catch(e => setErr(e.message)); load(); } }
  return <>
    <Msg>{err}</Msg><Msg kind="ok">{ok}</Msg>
    <form className="card" onSubmit={upload}>
      <h2>Upload or replace a document</h2>
      <p className="small muted">Pages are converted to images in your browser and stored as private files. Use a notebook name so the track sheet's "Notes · p.N" buttons link to it; uploading again with the same name replaces it.</p>
      <div className="grid">
        <label className="f"><span>Link to notebook (optional)</span><select value={NOTEBOOKS.some(n => n.slug === f.slug) ? f.slug : ""} onChange={e => pick(e.target.value)}><option value="">Custom document</option>{NOTEBOOKS.map(n => <option key={n.slug} value={n.slug}>{n.title}</option>)}</select></label>
        <label className="f"><span>Short name (slug)</span><input value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })} required placeholder="e.g. 13-operating-systems" /></label>
        <label className="f"><span>Title</span><input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} required /></label>
        <label className="f"><span>Order</span><input type="number" value={f.sort_order} onChange={e => setF({ ...f, sort_order: Number(e.target.value) })} /></label>
      </div>
      <label className="f"><span>Description</span><input value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></label>
      <label className="f"><span>Roles that see it by default</span><RoleChips value={f.career_roles} onChange={career_roles => setF({ ...f, career_roles })} /></label>
      <label className="f"><span>PDF file</span><input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
      <button className="primary" disabled={!!busy}>{busy || "Convert and upload"}</button>
    </form>
    <div className="card"><h2>Documents ({docs.length})</h2><table><thead><tr><th>Title</th><th>Pages</th><th>Visible</th><th /></tr></thead><tbody>
      {docs.map(d => <tr key={d.id}><td><b>{d.title}</b><div className="small muted">{d.slug}</div></td><td>{d.pages}</td>
        <td><input type="checkbox" checked={d.published} onChange={e => update(d, { published: e.target.checked })} aria-label="Published" /></td>
        <td><div className="row"><a className="btn sm" href={`/read/${d.slug}`}>View</a><button className="sm danger" onClick={() => remove(d)}>Delete</button></div></td></tr>)}
    </tbody></table></div>
  </>;
}

const blankLink = { id: 0, kind: "resource", title: "", description: "", url: "", category: "", career_roles: [] as string[], sort_order: 0, published: true };
function LinksAdmin() {
  const [links, setLinks] = useState<any[]>([]); const [f, setF] = useState<any>(blankLink); const [err, setErr] = useState("");
  const load = () => api("/admin/links").then(r => setLinks(r.links)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  async function save(e: React.FormEvent) { e.preventDefault(); setErr(""); try { await api(f.id ? `/admin/links/${f.id}` : "/admin/links", f.id ? "PUT" : "POST", f); setF(blankLink); load(); } catch (x: any) { setErr(x.message); } }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  return <>
    <Msg>{err}</Msg>
    <form className="card" onSubmit={save}>
      <h2>{f.id ? "Edit" : "Add"} a resource link or project</h2>
      <div className="grid">
        <label className="f"><span>Type</span><select value={f.kind} onChange={set("kind")}><option value="resource">Resource link</option><option value="project">Project idea</option></select></label>
        <label className="f"><span>Title</span><input value={f.title} onChange={set("title")} required /></label>
        <label className="f"><span>Group / category</span><input value={f.category} onChange={set("category")} placeholder="e.g. DSA practice, AI projects" /></label>
        <label className="f"><span>Link (optional for projects)</span><input value={f.url} onChange={set("url")} placeholder="https://..." /></label>
      </div>
      <label className="f"><span>Description</span><textarea rows={3} value={f.description} onChange={set("description")} /></label>
      <label className="f"><span>Roles</span><RoleChips value={f.career_roles} onChange={career_roles => setF({ ...f, career_roles })} /></label>
      <div className="row"><button className="primary">{f.id ? "Save changes" : "Add"}</button>{!!f.id && <button type="button" onClick={() => setF(blankLink)}>Cancel</button>}</div>
    </form>
    <div className="card"><table><thead><tr><th>Type</th><th>Title</th><th>Group</th><th /></tr></thead><tbody>
      {links.map(l => <tr key={l.id}><td><span className="tag">{l.kind}</span></td><td><b>{l.title}</b>{l.url && <div className="small"><a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a></div>}</td><td>{l.category}</td>
        <td><div className="row"><button className="sm" onClick={() => { setF(l); window.scrollTo(0, 0); }}>Edit</button><button className="sm danger" onClick={async () => { if (confirm(`Delete "${l.title}"?`)) { await api(`/admin/links/${l.id}`, "DELETE"); load(); } }}>Delete</button></div></td></tr>)}
    </tbody></table></div>
  </>;
}

function ConnectAdmin() {
  const [posts, setPosts] = useState<any[]>([]); const [err, setErr] = useState("");
  const load = () => api("/admin/connect").then(r => setPosts(r.posts)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  const act = async (id: number, b: any) => { await api(`/admin/connect/${id}`, "POST", b).catch(e => setErr(e.message)); load(); };
  return <>
    <Msg>{err}</Msg>{!posts.length && <div className="card">No posts yet.</div>}
    {posts.map(p => <div className="card" key={p.id}>
      <div className="row"><span className="tag">{p.status}</span><span className="tag">{p.kind}</span><b>{p.company}</b><span className="small muted">{p.user_email}</span></div>
      <h3 style={{ margin: "8px 0" }}>{p.title}</h3><p className="small" style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>
      <div className="row">{p.status !== "approved" && <button className="sm primary" onClick={() => act(p.id, { status: "approved" })}>Approve</button>}
        {p.status !== "rejected" && <button className="sm" onClick={() => act(p.id, { status: "rejected" })}>Reject</button>}
        <button className="sm danger" onClick={() => confirm("Delete this post?") && act(p.id, { action: "delete" })}>Delete</button></div>
    </div>)}
  </>;
}

function Users() {
  const [users, setUsers] = useState<any[]>([]); const [err, setErr] = useState(""); const [q, setQ] = useState("");
  const load = () => api("/admin/users").then(r => setUsers(r.users)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  const act = async (id: number, b: any) => { setErr(""); await api(`/admin/users/${id}`, "POST", b).catch(e => setErr(e.message)); load(); };
  const shown = users.filter(u => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  return <>
    <Msg>{err}</Msg><input placeholder="Search users" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 12 }} aria-label="Search users" />
    <div className="card"><table><thead><tr><th>User</th><th>Status</th><th>Role</th><th>Last sign-in</th><th /></tr></thead><tbody>
      {shown.map(u => <tr key={u.id}><td><b>{u.name}</b><div className="small muted">{u.email}</div></td><td><span className="tag">{u.status}</span></td><td>{u.role}</td><td className="small">{u.last_login_at || "-"}</td>
        <td><div className="row">
          <button className="sm" onClick={() => act(u.id, { action: "role", role: u.role === "admin" ? "student" : "admin" })}>{u.role === "admin" ? "Remove admin" : "Make admin"}</button>
          <button className="sm" onClick={() => act(u.id, { action: u.status === "blocked" ? "unblock" : "block" })}>{u.status === "blocked" ? "Unblock" : "Block"}</button>
          <button className="sm danger" onClick={() => confirm(`Delete ${u.email}?`) && act(u.id, { action: "delete" })}>Delete</button></div></td></tr>)}
    </tbody></table></div>
  </>;
}
