// Notes library, Resources / Projects lists and the Connect tab.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Doc } from "./api";
import { useAuth, Msg } from "./App";
import { CAREER_ROLES, roleLabel } from "../shared/catalog";

export function Library() {
  const { user } = useAuth(); const [docs, setDocs] = useState<Doc[] | null>(null); const [all, setAll] = useState(false); const [err, setErr] = useState("");
  useEffect(() => { api("/docs").then(r => setDocs(r.docs)).catch(e => setErr(e.message)); }, []);
  const shown = (docs || []).filter(d => all || !d.career_roles.length || d.career_roles.some(r => user!.career_roles.includes(r)));
  return <>
    <div className="row"><h1 style={{ flex: 1 }}>Notes</h1><label className="row small"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> Show notes for all roles</label></div>
    <p className="muted">Handwritten-style notebooks. They open in the protected reader (view only).</p>
    <Msg>{err}</Msg>
    {docs && !shown.length && <div className="card">No notes published for your roles yet.</div>}
    <div className="grid">{shown.map(d => <div className="card" key={d.id} style={{ marginBottom: 0 }}>
      <h3>{d.title}</h3><p className="small muted">{d.description || `${d.pages} pages`}</p>
      <div className="row"><Link className="btn primary sm" to={`/read/${d.slug}`}>Read</Link><span className="small muted">{d.pages} pages</span></div>
    </div>)}</div>
  </>;
}

export function Links({ kind }: { kind: "resource" | "project" }) {
  const { user } = useAuth(); const [links, setLinks] = useState<any[] | null>(null); const [role, setRole] = useState(""); const [err, setErr] = useState("");
  useEffect(() => { api("/links").then(r => setLinks(r.links)).catch(e => setErr(e.message)); }, []);
  const shown = (links || []).filter(l => l.kind === kind && (!role || l.career_roles.includes(role)));
  const groups = [...new Set(shown.map(l => l.category || "General"))];
  return <>
    <div className="row"><h1 style={{ flex: 1 }}>{kind === "resource" ? "Resources" : "Projects"}</h1>
      <select style={{ width: 240 }} value={role} onChange={e => setRole(e.target.value)} aria-label="Filter by role"><option value="">All roles</option>{CAREER_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
    <p className="muted">{kind === "resource" ? "Hand-picked links: practice sheets, docs, videos and tools." : "Project ideas that add real weight to a resume, with what to build and what you will learn."}</p>
    <Msg>{err}</Msg>
    {links && !shown.length && <div className="card">Nothing here yet{user!.role === "admin" ? " - add some from the Admin tab." : "."}</div>}
    {groups.map(g => <div key={g}><h2 style={{ marginTop: 18 }}>{g}</h2><div className="grid">{shown.filter(l => (l.category || "General") === g).map(l =>
      <div className="card" key={l.id} style={{ marginBottom: 0 }}>
        <h3>{l.title}</h3>
        <p className="small" style={{ whiteSpace: "pre-wrap" }}>{l.description}</p>
        <div className="row">{l.url && <a className="btn sm primary" href={l.url} target="_blank" rel="noopener noreferrer">Open ↗</a>}
          {l.career_roles.map((r: string) => <span className="tag" key={r}>{roleLabel(r)}</span>)}</div>
      </div>)}</div></div>)}
  </>;
}

const blank = { kind: "interview", title: "", body: "", company: "", career_role: "", year: "", difficulty: "", links: "", anonymous: false };
export function Connect() {
  const [posts, setPosts] = useState<any[]>([]); const [mine, setMine] = useState<any[]>([]); const [f, setF] = useState<any>(blank);
  const [show, setShow] = useState(false); const [q, setQ] = useState(""); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const load = () => { api("/connect").then(r => setPosts(r.posts)).catch(e => setErr(e.message)); api("/connect/mine").then(r => setMine(r.posts)).catch(() => {}); };
  useEffect(load, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    try {
      const r = await api("/connect", "POST", { ...f, links: String(f.links).split(/\s+/).filter(Boolean) });
      setOk(r.status === "approved" ? "Posted." : "Thanks! Your post will appear after an admin reviews it."); setF(blank); setShow(false); load();
    } catch (x: any) { setErr(x.message); }
  }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const n = q.toLowerCase(); const shown = posts.filter(p => !n || [p.title, p.company, p.body, p.career_role].join(" ").toLowerCase().includes(n));
  return <>
    <div className="row"><h1 style={{ flex: 1 }}>Connect</h1><button className="primary" onClick={() => setShow(!show)}>{show ? "Close" : "Share a question or experience"}</button></div>
    <p className="muted">Interview questions, topics and experiences shared by members. Posts are reviewed by an admin before they appear.</p>
    <Msg>{err}</Msg><Msg kind="ok">{ok}</Msg>
    {show && <form className="card" onSubmit={submit}>
      <div className="grid">
        <label className="f"><span>Type</span><select value={f.kind} onChange={set("kind")}><option value="interview">Interview question</option><option value="topic">Important topic</option><option value="experience">Interview experience</option></select></label>
        <label className="f"><span>Company</span><input value={f.company} onChange={set("company")} placeholder="e.g. Amazon" /></label>
        <label className="f"><span>Role</span><input value={f.career_role} onChange={set("career_role")} placeholder="e.g. SDE intern" /></label>
        <label className="f"><span>Year</span><input type="number" value={f.year} onChange={set("year")} placeholder="2026" /></label>
        <label className="f"><span>Difficulty</span><select value={f.difficulty} onChange={set("difficulty")}><option value="">-</option><option>easy</option><option>medium</option><option>hard</option></select></label>
      </div>
      <label className="f"><span>Question / topic / headline</span><input value={f.title} onChange={set("title")} required minLength={8} /></label>
      <label className="f"><span>Details, your answer or approach</span><textarea rows={5} value={f.body} onChange={set("body")} /></label>
      <label className="f"><span>Helpful links (one per line)</span><textarea rows={2} value={f.links} onChange={set("links")} /></label>
      <div className="row"><label className="row small"><input type="checkbox" checked={f.anonymous} onChange={set("anonymous")} /> Post anonymously</label><button className="primary right">Submit for review</button></div>
    </form>}
    {!!mine.filter(p => p.status !== "approved").length && <div className="card"><h2>Your submissions</h2>{mine.filter(p => p.status !== "approved").map(p => <div className="row small" key={p.id}><span className="tag">{p.status}</span>{p.title}</div>)}</div>}
    <input placeholder="Search by company, role or keyword" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 12 }} aria-label="Search posts" />
    {!shown.length && <div className="card">No posts yet. Be the first to share.</div>}
    {shown.map(p => <div className="card" key={p.id}>
      <div className="row"><span className="tag">{p.kind}</span>{p.company && <b>{p.company}</b>}{p.career_role && <span className="muted small">{p.career_role}</span>}{p.year && <span className="muted small">{p.year}</span>}{p.difficulty && <span className="tag">{p.difficulty}</span>}<span className="right small muted">by {p.author}</span></div>
      <h3 style={{ margin: "8px 0" }}>{p.title}</h3>
      {p.body && <p style={{ whiteSpace: "pre-wrap", margin: "0 0 8px" }}>{p.body}</p>}
      <div className="row">{p.links.map((u: string) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="small">{new URL(u).hostname} ↗</a>)}</div>
    </div>)}
  </>;
}
