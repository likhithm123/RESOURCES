// Admin CMS: overview, documents (PDF -> private page images on ImageKit), resources/projects, Connect review, users.
import React, { useEffect, useState } from "react";
import { api, type Doc } from "./api";
import { Msg, RoleChips } from "./App";
import { NOTEBOOKS, roleLabel } from "../shared/catalog";

export function formatTime(ts: string | number | null | undefined): string {
  if (!ts) return "—";
  let s = String(ts).trim();
  if (!s) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    return dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

const TABS = ["Overview", "Documents", "Certifications", "Feedback", "Site Settings", "Resources & Projects", "Connect", "Users", "JD Checklists", "Team", "Audit Logs"] as const;

export default function Admin() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  return <>
    <h1>Admin</h1>
    <div className="chips" style={{ margin: "10px 0 16px" }}>{TABS.map(t => <span key={t} className={`chip ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>{t}</span>)}</div>
    {tab === "Overview" && <Overview />}
    {tab === "Documents" && <Documents />}
    {tab === "Certifications" && <CertificationsAdmin />}
    {tab === "Feedback" && <FeedbackAdmin />}
    {tab === "Site Settings" && <SettingsAdmin />}
    {tab === "Resources & Projects" && <LinksAdmin />}
    {tab === "Connect" && <ConnectAdmin />}
    {tab === "Users" && <Users />}
    {tab === "JD Checklists" && <JDChecklistsAdmin />}
    {tab === "Team" && <TeamAdmin />}
    {tab === "Audit Logs" && <AuditLogsAdmin />}
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
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("/pdf.worker.min.mjs", window.location.origin).toString();
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false } as any).promise;
  const canvas = document.createElement("canvas");
  const texts: { page: number; text: string; boxes: number[][] }[] = [];
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
    // Words and their positions (0-1000) for in-document search.
    const tc = await page.getTextContent(); const base = page.getViewport({ scale: 1 }); const words: string[] = []; const boxes: number[][] = [];
    for (const it of tc.items as any[]) {
      const str = String(it.str || ""); if (!str.trim()) continue;
      const [x, y] = [it.transform[4], it.transform[5]], h = Math.abs(it.transform[3]) || 10, w = it.width || 0;
      let cx = 0;
      for (const part of str.split(/(\s+)/)) {                 // split runs into words, width shared by character count
        const pw = (part.length / str.length) * w;
        if (part.trim()) { words.push(part); boxes.push([x + cx, base.height - y - h, x + cx + pw, base.height - y].map((v, i) => Math.round((v / (i % 2 ? base.height : base.width)) * 1000))); }
        cx += pw;
      }
    }
    texts.push({ page: n, text: words.join(" "), boxes });
    onProgress(n, pdf.numPages);
  }
  return { pages: pdf.numPages, texts };
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
      const { pages, texts } = await uploadPdf(file, p.folder, (d, t) => setBusy(`Uploading page ${d} of ${t}...`));
      await api("/admin/docs", "POST", { ...f, slug: p.slug, version: p.version, folder: p.folder, pages });
      setBusy("Indexing text for search...");
      for (let i = 0; i < texts.length; i += 10) await api(`/admin/docs/${p.slug}/text`, "POST", { reset: i === 0, pages: texts.slice(i, i + 10) });
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
      <div className="row"><span className="tag">{p.status}</span><span className="tag">{p.kind}</span><b>{p.company}</b><span className="small muted">{p.user_email}</span><span className="small muted right">{formatTime(p.created_at)}</span></div>
      <h3 style={{ margin: "8px 0" }}>{p.title}</h3><p className="small" style={{ whiteSpace: "pre-wrap" }}>{p.body}</p>
      <div className="row">{p.status !== "approved" && <button className="sm primary" onClick={() => act(p.id, { status: "approved" })}>Approve</button>}
        {p.status !== "rejected" && <button className="sm" onClick={() => act(p.id, { status: "rejected" })}>Reject</button>}
        <button className="sm danger" onClick={() => confirm("Delete this post?") && act(p.id, { action: "delete" })}>Delete</button></div>
    </div>)}
  </>;
}

function Users() {
  const [users, setUsers] = useState<any[]>([]); const [err, setErr] = useState(""); const [q, setQ] = useState("");
  const [detail, setDetail] = useState<any>(null); const [progress, setProgress] = useState<string[]>([]);
  const [userStreak, setUserStreak] = useState<any>(null);
  const [logins, setLogins] = useState<any[]>([]);
  const [userChecklists, setUserChecklists] = useState<any[]>([]);
  const [expandedChecklistId, setExpandedChecklistId] = useState<number | null>(null);

  const load = () => api("/admin/users").then(r => setUsers(r.users)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  const act = async (id: number, b: any) => { setErr(""); await api(`/admin/users/${id}`, "POST", b).catch(e => setErr(e.message)); load(); };
  const shown = users.filter(u => !q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  async function viewUser(id: number) {
    try {
      const r = await api(`/admin/users/${id}/detail`);
      setDetail(r.user); setProgress(r.progress); setLogins(r.logins || []); setUserStreak(r.streak || null);
      setUserChecklists(r.checklists || []); setExpandedChecklistId(null);
    } catch (e: any) { setErr(e.message); }
  }
  return <>
    <Msg>{err}</Msg><input placeholder="Search users" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 12 }} aria-label="Search users" />
    {detail && <div className="card" style={{ marginBottom: 16 }}>
      <div className="row"><h2 style={{ flex: 1 }}>{detail.name}</h2><button className="sm" onClick={() => setDetail(null)}>Close</button></div>
      <div className="grid" style={{ gap: 8, marginTop: 8 }}>
        <div><span className="muted small">Email:</span> {detail.email}</div>
        <div><span className="muted small">Phone:</span> {detail.phone || "—"}</div>
        <div><span className="muted small">Role:</span> <span className="tag">{detail.role}</span></div>
        <div><span className="muted small">Status:</span> <span className="tag">{detail.status}</span></div>
        <div><span className="muted small">Joined:</span> {formatTime(detail.created_at)}</div>
        <div><span className="muted small">Last sign-in:</span> {formatTime(detail.last_login_at)}</div>
      </div>
      <div style={{ marginTop: 12 }}><span className="muted small">Selected roles:</span>
        <div className="chips" style={{ marginTop: 4 }}>{(detail.career_roles || []).map((r: string) => <span className="chip on" key={r}>{roleLabel(r)}</span>)}{!(detail.career_roles || []).length && <span className="muted small">None selected</span>}</div>
      </div>
      <div className="row" style={{ marginTop: 14, gap: 16 }}>
        <div className="card" style={{ flex: 1, margin: 0, padding: 12 }}>
          <div className="muted small">Progress</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{progress.length} <span style={{ fontSize: 13, fontWeight: "normal" }} className="muted">topics done</span></div>
        </div>
        <div className="card" style={{ flex: 1, margin: 0, padding: 12 }}>
          <div className="muted small">Current Streak</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: (userStreak?.current || 0) > 0 ? "#e65100" : "inherit" }}>
            {userStreak?.current || 0} <span style={{ fontSize: 13, fontWeight: "normal" }} className="muted">days</span>
          </div>
        </div>
        <div className="card" style={{ flex: 1, margin: 0, padding: 12 }}>
          <div className="muted small">Best Streak</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {userStreak?.longest || 0} <span style={{ fontSize: 13, fontWeight: "normal" }} className="muted">days</span>
          </div>
        </div>
      </div>
      {userStreak?.days && !!userStreak.days.length && <div style={{ marginTop: 12 }}>
        <span className="muted small">Active days ({userStreak.days.length}): </span>
        <span className="small">{userStreak.days.slice(-10).join(", ")}{userStreak.days.length > 10 ? "..." : ""}</span>
      </div>}

      {/* User's JD Checklists & Details */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <h3>Job Description Checklists & Target Roles ({userChecklists.length})</h3>
        {!userChecklists.length ? (
          <p className="muted small">No JD checklists generated by this user yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
            {userChecklists.map(cl => {
              const done = (cl.items || []).filter((i: any) => i.completed).length;
              const total = (cl.items || []).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isExpanded = expandedChecklistId === cl.id;

              return (
                <div key={cl.id} className="card" style={{ margin: 0, padding: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                        <b style={{ fontSize: 16 }}>{cl.title}</b>
                        {cl.company && <span className="tag" style={{ background: "#fef3c7", color: "#92400e" }}>{cl.company}</span>}
                        <span className="tag primary">{cl.role_detected}</span>
                        <span className="tag ok">{cl.match_score}% Match</span>
                      </div>
                      <div className="small muted">
                        Progress: <b>{done}</b> / <b>{total}</b> topics completed ({pct}%) · Updated: {formatTime(cl.updated_at)}
                      </div>
                      <div style={{ width: "100%", height: 6, background: "#e2e8f0", borderRadius: 9999, overflow: "hidden", margin: "8px 0" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", transition: "width 0.3s" }} />
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {(cl.skills || []).map((s: string, idx: number) => (
                          <span key={idx} style={{ fontSize: 11, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="sm"
                      onClick={() => setExpandedChecklistId(isExpanded ? null : cl.id)}
                    >
                      {isExpanded ? "Hide Details" : "View Full JD & Topics"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                      {cl.raw_text && (
                        <div style={{ marginBottom: 12 }}>
                          <div className="small muted" style={{ fontWeight: 700, marginBottom: 4 }}>Raw Job Description Ingested:</div>
                          <div style={{ maxHeight: 160, overflowY: "auto", background: "#ffffff", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#334155" }}>
                            {cl.raw_text}
                          </div>
                        </div>
                      )}

                      <div className="small muted" style={{ fontWeight: 700, marginBottom: 6 }}>All Checklist Topics ({(cl.items || []).length}):</div>
                      <div style={{ maxHeight: 260, overflowY: "auto", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
                        <table style={{ margin: 0, fontSize: 12 }}>
                          <thead>
                            <tr>
                              <th style={{ width: 45 }}>Status</th>
                              <th>Topic</th>
                              <th>Category</th>
                              <th>Priority</th>
                              <th>Links</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(cl.items || []).map((it: any) => (
                              <tr key={it.id} style={{ background: it.completed ? "#f0fdf4" : "transparent" }}>
                                <td style={{ textAlign: "center" }}>{it.completed ? "[x]" : "[ ]"}</td>
                                <td><b style={{ textDecoration: it.completed ? "line-through" : "none", color: it.completed ? "#64748b" : "#0f172a" }}>{it.topic}</b></td>
                                <td><span className="small muted">{it.category}</span></td>
                                <td><span className={`tag ${it.priority === "High" ? "err" : it.priority === "Medium" ? "" : "ok"}`} style={{ fontSize: 10 }}>{it.priority}</span></td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  {it.tufUrl && <a href={it.tufUrl} target="_blank" rel="noopener noreferrer" className="small" style={{ marginRight: 6 }}>TUF ↗</a>}
                                  {it.leetcodeUrl && <a href={it.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="small" style={{ marginRight: 6 }}>LeetCode ↗</a>}
                                  {it.gfgUrl && <a href={it.gfgUrl} target="_blank" rel="noopener noreferrer" className="small">GFG ↗</a>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!!logins.length && <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
        <h3>Recent sign-in history</h3>
        <table>
          <thead><tr><th>Event</th><th>IP</th><th>Time</th></tr></thead>
          <tbody>
            {logins.map((l: any) => <tr key={l.id}>
              <td><span className={`tag ${l.action === "auth.login" ? "primary" : ""}`}>{l.action === "auth.login" ? "Sign in" : "Sign out"}</span></td>
              <td className="small">{l.ip || "—"}</td>
              <td className="small">{formatTime(l.created_at)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>}
    <div className="card"><table><thead><tr><th>User</th><th>Phone</th><th>Streak</th><th>Status</th><th>Role</th><th>Last sign-in</th><th /></tr></thead><tbody>
      {shown.map(u => <tr key={u.id}>
        <td><b style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => viewUser(u.id)}>{u.name}</b><div className="small muted">{u.email}</div></td>
        <td className="small">{u.phone || "—"}</td>
        <td>
          <span className="tag" style={{ color: (u.streak?.current || 0) > 0 ? "#e65100" : "inherit", fontWeight: 600 }}>
            {u.streak?.current || 0}d
          </span>
          <div className="small muted">best: {u.streak?.longest || 0}d</div>
        </td>
        <td><span className="tag">{u.status}</span></td>
        <td>{u.role}</td>
        <td className="small">{formatTime(u.last_login_at)}</td>
        <td><div className="row">
          <button className="sm" onClick={() => act(u.id, { action: "role", role: u.role === "admin" ? "student" : "admin" })}>{u.role === "admin" ? "Remove admin" : "Make admin"}</button>
          <button className="sm" onClick={() => act(u.id, { action: u.status === "blocked" ? "unblock" : "block" })}>{u.status === "blocked" ? "Unblock" : "Block"}</button>
          <button className="sm danger" onClick={() => confirm(`Delete ${u.email}?`) && act(u.id, { action: "delete" })}>Delete</button></div></td></tr>)}
    </tbody></table></div>
  </>;
}

/* ---------------- All Users JD Checklists CMS ---------------- */
function JDChecklistsAdmin() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selectedCl, setSelectedCl] = useState<any>(null);

  const load = () => api("/admin/jd-checklists").then(r => setChecklists(r.checklists || [])).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function deleteCl(id: number, title: string) {
    if (!confirm(`Delete checklist "${title}"? This cannot be undone.`)) return;
    try {
      await api(`/admin/jd-checklists/${id}`, "DELETE");
      setChecklists(prev => prev.filter(c => c.id !== id));
      if (selectedCl?.id === id) setSelectedCl(null);
    } catch (e: any) { setErr(e.message); }
  }

  const needle = q.toLowerCase();
  const shown = checklists.filter(c => {
    if (roleFilter !== "All" && c.role_detected !== roleFilter) return false;
    if (!needle) return true;
    return [c.title, c.company, c.role_detected, c.user_name, c.user_email].join(" ").toLowerCase().includes(needle);
  });

  const roles = ["All", ...new Set(checklists.map(c => c.role_detected).filter(Boolean))];

  return <>
    <Msg>{err}</Msg>

    {/* Detail View Drawer */}
    {selectedCl && (
      <div className="card" style={{ marginBottom: 16, borderLeft: "5px solid #2563eb", background: "#f8fafc" }}>
        <div className="row" style={{ alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 4px" }}>{selectedCl.title}</h2>
            <div className="small muted">
              User: <b>{selectedCl.user_name || "Unknown"}</b> ({selectedCl.user_email}) · Created: {formatTime(selectedCl.created_at)} · Updated: {formatTime(selectedCl.updated_at)}
            </div>
          </div>
          <button className="sm" onClick={() => setSelectedCl(null)}>Close</button>
        </div>

        <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {selectedCl.company && <span className="tag" style={{ background: "#fef3c7", color: "#92400e" }}>{selectedCl.company}</span>}
          <span className="tag primary">{selectedCl.role_detected}</span>
          <span className="tag ok">{selectedCl.match_score}% Match Score</span>
          <span className="tag">{(selectedCl.items || []).length} Topics</span>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="small muted" style={{ fontWeight: 700, marginBottom: 4 }}>Skills Detected:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(selectedCl.skills || []).map((s: string, idx: number) => (
              <span key={idx} style={{ fontSize: 12, background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 4, padding: "2px 8px", color: "#334155" }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        {selectedCl.raw_text && (
          <div style={{ marginBottom: 14 }}>
            <div className="small muted" style={{ fontWeight: 700, marginBottom: 4 }}>Ingested Job Description Text:</div>
            <div style={{ maxHeight: 180, overflowY: "auto", background: "#ffffff", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "monospace", color: "#334155" }}>
              {selectedCl.raw_text}
            </div>
          </div>
        )}

        <div>
          <div className="small muted" style={{ fontWeight: 700, marginBottom: 6 }}>
            Checklist Topics & Progress ({(selectedCl.items || []).filter((i: any) => i.completed).length} / {(selectedCl.items || []).length} completed):
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 6 }}>
            <table style={{ margin: 0, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 45 }}>Status</th>
                  <th>Topic</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {(selectedCl.items || []).map((it: any) => (
                  <tr key={it.id} style={{ background: it.completed ? "#f0fdf4" : "transparent" }}>
                    <td style={{ textAlign: "center" }}>{it.completed ? "[x]" : "[ ]"}</td>
                    <td><b style={{ textDecoration: it.completed ? "line-through" : "none", color: it.completed ? "#64748b" : "#0f172a" }}>{it.topic}</b></td>
                    <td><span className="small muted">{it.category}</span></td>
                    <td><span className={`tag ${it.priority === "High" ? "err" : it.priority === "Medium" ? "" : "ok"}`} style={{ fontSize: 10 }}>{it.priority}</span></td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {it.tufUrl && <a href={it.tufUrl} target="_blank" rel="noopener noreferrer" className="small" style={{ marginRight: 6 }}>TUF ↗</a>}
                      {it.leetcodeUrl && <a href={it.leetcodeUrl} target="_blank" rel="noopener noreferrer" className="small" style={{ marginRight: 6 }}>LeetCode ↗</a>}
                      {it.gfgUrl && <a href={it.gfgUrl} target="_blank" rel="noopener noreferrer" className="small">GFG ↗</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    {/* Search & Filter Bar */}
    <div className="row" style={{ marginBottom: 12, gap: 10 }}>
      <input
        placeholder="Search by user, email, company, role, or title..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ flex: 1, minWidth: 240 }}
      />
      <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 220 }}>
        {roles.map(r => <option key={r} value={r}>{r === "All" ? "All Engineering Roles" : r}</option>)}
      </select>
      <button className="sm" onClick={load}>Refresh</button>
    </div>

    {/* Checklists Table */}
    <div className="card">
      <h2>All User Job Checklists ({shown.length})</h2>
      {!shown.length && <p className="muted small">No job checklists found matching criteria.</p>}
      {!!shown.length && <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Checklist Title</th>
            <th>Company</th>
            <th>Role</th>
            <th>Progress</th>
            <th>Updated</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((cl: any) => {
            const done = (cl.items || []).filter((i: any) => i.completed).length;
            const total = (cl.items || []).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <tr key={cl.id}>
                <td>
                  <b>{cl.user_name || "Unknown"}</b>
                  <div className="small muted">{cl.user_email}</div>
                </td>
                <td>
                  <b style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setSelectedCl(cl)}>
                    {cl.title}
                  </b>
                  <div className="small muted">{cl.match_score}% Match</div>
                </td>
                <td>{cl.company || "—"}</td>
                <td><span className="tag primary" style={{ fontSize: 11 }}>{cl.role_detected}</span></td>
                <td>
                  <span className="tag ok" style={{ fontSize: 11 }}>{done}/{total} ({pct}%)</span>
                  <div style={{ width: 80, height: 4, background: "#e2e8f0", borderRadius: 9999, overflow: "hidden", marginTop: 4 }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#10b981" }} />
                  </div>
                </td>
                <td className="small" style={{ whiteSpace: "nowrap" }}>{formatTime(cl.updated_at)}</td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="sm" onClick={() => setSelectedCl(cl)}>View Details</button>
                    <button className="sm err" onClick={() => deleteCl(cl.id, cl.title)}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>}
    </div>
  </>;
}

function TeamAdmin() {
  const [members, setMembers] = useState<any[]>([]); const [err, setErr] = useState("");
  const blank = { id: 0, name: "", role_title: "", photo_url: "", linkedin: "", github: "", sort_order: 0 };
  const [f, setF] = useState<any>(blank);
  const load = () => api("/admin/team").then(r => setMembers(r.members)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try {
      if (f.id) await api(`/admin/team/${f.id}`, "PUT", f);
      else await api("/admin/team", "POST", f);
      setF(blank); load();
    } catch (x: any) { setErr(x.message); }
  }
  return <>
    <Msg>{err}</Msg>
    <form className="card" onSubmit={save}>
      <h2>{f.id ? "Edit" : "Add"} team member</h2>
      <div className="grid">
        <label className="f"><span>Name</span><input value={f.name} onChange={set("name")} required /></label>
        <label className="f"><span>Role / title</span><input value={f.role_title} onChange={set("role_title")} placeholder="e.g. Full Stack Developer" /></label>
        <label className="f"><span>Photo URL</span><input value={f.photo_url} onChange={set("photo_url")} placeholder="https://..." /></label>
        <label className="f"><span>LinkedIn URL</span><input value={f.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." /></label>
        <label className="f"><span>GitHub URL</span><input value={f.github} onChange={set("github")} placeholder="https://github.com/..." /></label>
        <label className="f"><span>Sort order</span><input type="number" value={f.sort_order} onChange={set("sort_order")} /></label>
      </div>
      <div className="row"><button className="primary">{f.id ? "Save changes" : "Add member"}</button>{!!f.id && <button type="button" onClick={() => setF(blank)}>Cancel</button>}</div>
    </form>
    <div className="card"><h2>Team members ({members.length})</h2><table><thead><tr><th>Photo</th><th>Name</th><th>Role</th><th /></tr></thead><tbody>
      {members.map(m => <tr key={m.id}>
        <td>{m.photo_url ? <img src={m.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} /> : <div className="avatar" style={{ width: 36, height: 36, fontSize: 14, lineHeight: "36px" }}>{m.name.charAt(0)}</div>}</td>
        <td><b>{m.name}</b></td>
        <td className="small">{m.role_title}</td>
        <td><div className="row">
          <button className="sm" onClick={() => { setF(m); window.scrollTo(0, 0); }}>Edit</button>
          <button className="sm danger" onClick={async () => { if (confirm(`Remove ${m.name}?`)) { await api(`/admin/team/${m.id}`, "DELETE"); load(); } }}>Delete</button>
        </div></td></tr>)}
    </tbody></table></div>
  </>;
}

function AuditLogsAdmin() {
  const [logs, setLogs] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const load = () => api("/admin/audit").then(r => setLogs(r.rows)).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);

  const actions = [...new Set(logs.map(l => l.action))];
  const needle = q.toLowerCase();
  const shown = logs.filter(l => {
    if (actionFilter && l.action !== actionFilter) return false;
    if (!needle) return true;
    return [l.action, l.detail, l.email, l.user_name, l.ip].join(" ").toLowerCase().includes(needle);
  });

  return <>
    <Msg>{err}</Msg>
    <div className="row" style={{ marginBottom: 12 }}>
      <input
        placeholder="Filter logs by user, action, IP, or details"
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ flex: 1, minWidth: 240 }}
      />
      <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ width: 180 }}>
        <option value="">All actions ({logs.length})</option>
        {actions.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <button className="sm" onClick={load}>Refresh</button>
    </div>
    <div className="card">
      <h2>Audit Logs & Sign-in History ({shown.length})</h2>
      {!shown.length && <p className="muted small">No logs matching criteria.</p>}
      {!!shown.length && <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Detail</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((l: any) => (
            <tr key={l.id}>
              <td className="small" style={{ whiteSpace: "nowrap" }}>{formatTime(l.created_at)}</td>
              <td>
                {l.email ? (
                  <>
                    <b>{l.user_name || l.email.split("@")[0]}</b>
                    <div className="small muted">{l.email}</div>
                  </>
                ) : <span className="muted small">Anonymous / System</span>}
              </td>
              <td>
                <span className={`tag ${l.action.startsWith("auth.") ? "primary" : l.action.startsWith("user.") ? "err" : ""}`}>
                  {l.action}
                </span>
              </td>
              <td className="small" style={{ maxWidth: 300, wordBreak: "break-word" }}>{l.detail || "—"}</td>
              <td className="small">{l.ip || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
  </>;
}

/* ---------------- Feedback & Suggestions Admin ---------------- */
function FeedbackAdmin() {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const load = () => { api("/admin/feedback").then(r => setFeedback(r.feedback || [])).catch(e => setErr(e.message)); };
  useEffect(load, []);

  async function updateStatus(id: number, status: string, reply: string = "") {
    setErr(""); setOk("");
    try {
      await api(`/admin/feedback/${id}`, "PUT", { status, admin_reply: reply });
      setOk(`Feedback marked as ${status}.`);
      load();
    } catch (e: any) { setErr(e.message); }
  }

  async function remove(id: number) {
    if (!confirm("Delete this feedback?")) return;
    try {
      await api(`/admin/feedback/${id}`, "DELETE", {});
      load();
    } catch (e: any) { setErr(e.message); }
  }

  return <>
    <div className="row"><h2 style={{ flex: 1 }}>User Suggestions & Inbound Feedback ({feedback.length})</h2><button className="sm" onClick={load}>Refresh</button></div>
    <Msg>{err}</Msg><Msg kind="ok">{ok}</Msg>
    {!feedback.length && <div className="card muted">No feedback received yet.</div>}
    {feedback.map(f => (
      <div className="card" key={f.id} style={{ borderLeft: `5px solid ${f.status === "new" ? "#f59e0b" : "#10b981"}` }}>
        <div className="row" style={{ marginBottom: 6 }}>
          <span className={`tag ${f.status === "new" ? "err" : "ok"}`}>{f.status.toUpperCase()}</span>
          <span className="tag">{f.category}</span>
          <b>{f.name}</b> <span className="small muted">({f.email})</span>
          <span className="small muted right">{formatTime(f.created_at)}</span>
        </div>
        <div style={{ whiteSpace: "pre-wrap", background: "#f8f9fa", padding: "10px 14px", borderRadius: 6, margin: "8px 0" }}>
          {f.message}
        </div>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          {f.status === "new" ? (
            <button className="sm primary" onClick={() => updateStatus(f.id, "resolved")}>Mark as Resolved</button>
          ) : (
            <button className="sm" onClick={() => updateStatus(f.id, "new")}>Reopen</button>
          )}
          <a className="btn sm" href={`mailto:${f.email}?subject=Re:%20Feedback%20on%20Resources%20Portal`}>Reply via Email ↗</a>
          <button className="sm err right" onClick={() => remove(f.id)}>Delete</button>
        </div>
      </div>
    ))}
  </>;
}

/* ---------------- Certifications Admin CMS ---------------- */
function CertificationsAdmin() {
  const [certs, setCerts] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const blank = { title: "", provider: "", tier: "free", cost: "Free ($0)", role: "sde", url: "", resources_url: "", description: "", sort_order: 0, published: 1 };

  const load = () => { api("/admin/certifications").then(r => setCerts(r.certifications || [])).catch(e => setErr(e.message)); };
  useEffect(load, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    try {
      if (edit.id) {
        await api(`/admin/certifications/${edit.id}`, "PUT", edit);
        setOk("Certification updated.");
      } else {
        await api("/admin/certifications", "POST", edit);
        setOk("Certification created.");
      }
      setEdit(null);
      load();
    } catch (x: any) { setErr(x.message); }
  }

  async function remove(id: number) {
    if (!confirm("Delete this certification?")) return;
    try { await api(`/admin/certifications/${id}`, "DELETE", {}); load(); } catch (x: any) { setErr(x.message); }
  }

  const set = (k: string) => (e: any) => setEdit({ ...edit, [k]: e.target.type === "checkbox" ? (e.target.checked ? 1 : 0) : e.target.value });

  return <>
    <div className="row"><h2 style={{ flex: 1 }}>Manage Certifications ({certs.length})</h2>
      <button className="primary sm" onClick={() => setEdit(blank)}>+ Add Certification</button>
    </div>
    <Msg>{err}</Msg><Msg kind="ok">{ok}</Msg>

    {edit && (
      <form className="card" onSubmit={save} style={{ border: "2px solid var(--accent, #6366f1)" }}>
        <h3>{edit.id ? "Edit Certification" : "Add Certification"}</h3>
        <div className="grid">
          <label className="f"><span>Title</span><input value={edit.title} onChange={set("title")} required /></label>
          <label className="f"><span>Provider (e.g. AWS, CNCF, Microsoft, freeCodeCamp)</span><input value={edit.provider} onChange={set("provider")} required /></label>
          <label className="f"><span>Tier</span>
            <select value={edit.tier} onChange={set("tier")}>
              <option value="free">Free ($0)</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="f"><span>Cost Label (e.g. Free ($0) or $150)</span><input value={edit.cost} onChange={set("cost")} required /></label>
          <label className="f"><span>Role</span>
            <select value={edit.role} onChange={set("role")}>
              <option value="sde">Software Engineer (SDE)</option>
              <option value="cloud">Cloud / AWS / Azure</option>
              <option value="devops">DevOps / Kubernetes</option>
              <option value="security">Cyber Security</option>
              <option value="ai">AI / ML</option>
              <option value="data">Data Science</option>
            </select>
          </label>
          <label className="f"><span>Sort order</span><input type="number" value={edit.sort_order} onChange={set("sort_order")} /></label>
        </div>
        <div className="grid">
          <label className="f"><span>Official Exam / Credential URL</span><input type="url" value={edit.url} onChange={set("url")} /></label>
          <label className="f"><span>Free Study Resources / Roadmap URL</span><input type="url" value={edit.resources_url} onChange={set("resources_url")} /></label>
        </div>
        <label className="f"><span>Description</span><textarea rows={3} value={edit.description} onChange={set("description")} /></label>
        <div className="row" style={{ marginTop: 12 }}>
          <label className="row small"><input type="checkbox" checked={!!edit.published} onChange={set("published")} /> Published on public portal</label>
          <div className="right row" style={{ gap: 8 }}>
            <button type="button" className="sm" onClick={() => setEdit(null)}>Cancel</button>
            <button type="submit" className="sm primary">Save Certification</button>
          </div>
        </div>
      </form>
    )}

    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Certification</th>
          <th>Provider</th>
          <th>Cost</th>
          <th>Role</th>
          <th>Links</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {certs.map(c => (
          <tr key={c.id}>
            <td>{c.sort_order}</td>
            <td><b>{c.title}</b><div className="small muted" style={{ maxWidth: 260 }}>{c.description}</div></td>
            <td>{c.provider}</td>
            <td><span className={`tag ${c.tier === "free" ? "ok" : ""}`}>{c.cost}</span></td>
            <td><span className="small">{c.role}</span></td>
            <td>
              {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="small">Exam ↗</a>}
              {c.resources_url && <div><a href={c.resources_url} target="_blank" rel="noopener noreferrer" className="small">Prep ↗</a></div>}
            </td>
            <td><span className={`tag ${c.published ? "ok" : ""}`}>{c.published ? "Published" : "Draft"}</span></td>
            <td>
              <div className="row" style={{ gap: 6 }}>
                <button className="sm" onClick={() => setEdit(c)}>Edit</button>
                <button className="sm err" onClick={() => remove(c.id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>;
}

/* ---------------- Legal & Disclaimer Settings Admin CMS ---------------- */
function SettingsAdmin() {
  const [s, setS] = useState<{ disclaimer: string; terms: string; privacy: string }>({ disclaimer: "", terms: "", privacy: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/admin/settings").then(r => setS(r.settings || {})).catch(e => setErr(e.message));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk(""); setBusy(true);
    try {
      await api("/admin/settings", "PUT", s);
      setOk("Site settings, disclaimer, and legal policies saved successfully.");
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }

  return <form className="card" onSubmit={save}>
    <h2>Site Legal Content & Disclaimer CMS</h2>
    <p className="muted small">Customize the official disclaimer, Terms & Conditions, and Privacy Policy presented to users across the platform, signup form, and footer.</p>
    <Msg>{err}</Msg><Msg kind="ok">{ok}</Msg>
    <label className="f">
      <span>Universal Disclaimer (shown in footer, signup consent, and legal notices)</span>
      <textarea rows={3} value={s.disclaimer || ""} onChange={e => setS({ ...s, disclaimer: e.target.value })} required />
    </label>
    <label className="f">
      <span>Terms and Conditions Content</span>
      <textarea rows={8} value={s.terms || ""} onChange={e => setS({ ...s, terms: e.target.value })} required />
    </label>
    <label className="f">
      <span>Privacy Policy Content</span>
      <textarea rows={8} value={s.privacy || ""} onChange={e => setS({ ...s, privacy: e.target.value })} required />
    </label>
    <button className="primary" disabled={busy}>{busy ? "Saving..." : "Save Legal Content"}</button>
  </form>;
}
