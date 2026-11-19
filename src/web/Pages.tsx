// Notes library, Resources / Projects lists and the Connect tab.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Doc } from "./api";
import { useAuth, Msg } from "./App";
import { CAREER_ROLES, roleLabel } from "../shared/catalog";

export function Library() {
  const { user } = useAuth(); const [docs, setDocs] = useState<Doc[] | null>(null); const [all, setAll] = useState(false); const [err, setErr] = useState("");
  useEffect(() => { api("/docs").then(r => setDocs(r.docs)).catch(e => setErr(e.message)); }, []);
  const shown = (docs || []).filter(d => all || !d.career_roles.length || (user ? d.career_roles.some(r => user.career_roles.includes(r)) : true));
  return <>
    <div className="row"><h1 style={{ flex: 1 }}>Notes</h1><label className="row small"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> Show notes for all roles</label></div>
    <p className="muted">Handwritten-style notebooks for each role.</p>
    <Msg>{err}</Msg>
    {docs && !shown.length && <div className="card">No notes published for your roles yet.</div>}
    <div className="grid">{shown.map(d => <div className="card" key={d.id} style={{ marginBottom: 0 }}>
      <h3>{d.title}</h3><p className="small muted">{d.description || `${d.pages} pages`}</p>
      <div className="row" style={{ gap: 8, alignItems: "center" }}>
        <Link className="btn primary sm" to={`/read/${d.slug}`}>Read</Link>
        <a className="btn sm" href={`https://ik.imagekit.io/likhi/resources-portal/pdfs/${d.slug}.pdf`} target="_blank" rel="noopener noreferrer" title="Direct PDF via ImageKit">PDF ↗</a>
        <span className="small muted">{d.pages} pages</span>
      </div>
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
    {links && !shown.length && <div className="card">Nothing here yet{user?.role === "admin" ? " - add some from the Admin tab." : "."}</div>}
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

/* ---------------- Certifications Portal (Free & Paid) ---------------- */
export function Certifications() {
  const [certs, setCerts] = useState<any[]>([]);
  const [tier, setTier] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/certifications").then(r => setCerts(r.certifications)).catch(e => setErr(e.message));
  }, []);

  const needle = q.toLowerCase();
  const filtered = certs.filter(c => {
    if (tier !== "all" && c.tier !== tier) return false;
    if (role !== "all" && c.role !== role) return false;
    if (needle && ![c.title, c.provider, c.description, c.role].join(" ").toLowerCase().includes(needle)) return false;
    return true;
  });

  return <>
    <div className="row"><h1 style={{ flex: 1 }}>High-Value Tech Certifications</h1>
      <Link to="/read/37-top-tech-certifications-guide" className="btn sm primary">Open Certifications Study Guide PDF ↗</Link>
    </div>
    <p className="muted">Hand-curated free and paid certifications that carry genuine weight with hiring managers across Cloud, DevOps, Cyber Security, and Software Engineering.</p>
    <Msg>{err}</Msg>

    <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <input placeholder="Search certifications (e.g. AWS, CKA, Security+, Terraform)" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 240 }} aria-label="Search certifications" />
      <select value={tier} onChange={e => setTier(e.target.value)} aria-label="Filter by cost" style={{ width: 140 }}>
        <option value="all">All Costs</option>
        <option value="free">Free ($0)</option>
        <option value="paid">Paid</option>
      </select>
      <select value={role} onChange={e => setRole(e.target.value)} aria-label="Filter by role" style={{ width: 160 }}>
        <option value="all">All Roles</option>
        <option value="cloud">Cloud / AWS / Azure</option>
        <option value="devops">DevOps / Kubernetes</option>
        <option value="security">Cyber Security</option>
        <option value="sde">Software Engineer</option>
      </select>
    </div>

    {!filtered.length && <div className="card muted">No certifications match your filters.</div>}
    <div className="grid">
      {filtered.map(c => <div className="card" key={c.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 0, borderTop: `4px solid ${c.tier === "free" ? "#10b981" : "#3b82f6"}` }}>
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="small muted" style={{ fontWeight: 600 }}>{c.provider}</span>
            <span className={`tag ${c.tier === "free" ? "ok" : ""}`} style={{ marginLeft: "auto", textTransform: "capitalize" }}>{c.cost}</span>
          </div>
          <h3 style={{ margin: "4px 0 8px" }}>{c.title}</h3>
          <p className="small muted" style={{ lineHeight: 1.5 }}>{c.description}</p>
        </div>
        <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
          {c.url && <a className="btn sm primary" href={c.url} target="_blank" rel="noopener noreferrer">Official Exam ↗</a>}
          {c.resources_url && <a className="btn sm" href={c.resources_url} target="_blank" rel="noopener noreferrer">Free Study Prep ↗</a>}
          <span className="small muted" style={{ marginLeft: "auto", textTransform: "uppercase", fontSize: 11 }}>{c.role}</span>
        </div>
      </div>)}
    </div>
  </>;
}

/* ---------------- User Suggestions & Feedback ---------------- */
export function Feedback() {
  const { user } = useAuth();
  const [f, setF] = useState({ name: user?.name || "", email: user?.email || "", category: "suggestion", message: "" });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk(""); setBusy(true);
    try {
      await api("/feedback", "POST", f);
      setOk("Thank you! Your feedback has been sent directly to the portal administrators.");
      setF(prev => ({ ...prev, message: "" }));
    } catch (x: any) { setErr(x.message); } finally { setBusy(false); }
  }

  return <div style={{ maxWidth: 640, margin: "auto" }}>
    <h1>Suggestions and Feedback</h1>
    <p className="muted">Have an idea for a new topic? Found an inaccuracy or typo? Need a specific cheat sheet or PDF? Let us know — every suggestion is emailed straight to our admin team.</p>
    <Msg>{err}</Msg><Msg kind="ok">{ok}</Msg>
    <form className="card" onSubmit={submit}>
      <div className="grid">
        <label className="f"><span>Your name</span><input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} required /></label>
        <label className="f"><span>Your email</span><input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required /></label>
      </div>
      <label className="f"><span>Feedback Category</span>
        <select value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
          <option value="suggestion">New Topic / Notebook Suggestion</option>
          <option value="correction">Content Inaccuracy / Error Correction</option>
          <option value="feature">Platform UI / Feature Improvement</option>
          <option value="other">General Feedback</option>
        </select>
      </label>
      <label className="f"><span>Your message or suggestion details</span>
        <textarea rows={6} value={f.message} onChange={e => setF({ ...f, message: e.target.value })} required minLength={5} placeholder="Describe the topic, explanation, or feature you'd like to see..." />
      </label>
      <button className="primary" disabled={busy}>{busy ? "Sending..." : "Submit feedback to admins"}</button>
    </form>
  </div>;
}

/* ---------------- Legal Pages: Terms & Privacy (Admin Managed) ---------------- */
export function Legal({ type }: { type: "terms" | "privacy" }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/settings").then(r => setSettings(r.settings || {})).catch(e => setErr(e.message));
  }, []);

  const isTerms = type === "terms";
  const title = isTerms ? "Terms and Conditions" : "Privacy Policy";
  const content = isTerms ? settings.terms : settings.privacy;

  return <div style={{ maxWidth: 760, margin: "auto" }}>
    <h1>{title}</h1>
    <div className="card small" style={{ background: "#fffbeb", border: "1px solid #fef3c7", marginBottom: 20 }}>
      <b>Disclaimer:</b> {settings.disclaimer || "This platform is an independent student & developer preparation resource. We are not affiliated with, endorsed by, or representing any company, official certification provider, or institution. We do not hold any legal responsibility for the content; while we ensure maximum accuracy and rigor, content is provided as-is for educational prep."}
    </div>
    <Msg>{err}</Msg>
    <div className="card" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 15 }}>
      {content || "Loading legal notice..."}
    </div>
    <div className="small muted" style={{ marginTop: 12 }}>
      Have legal or content questions? Reach out via our <Link to="/feedback">feedback form</Link>.
    </div>
  </div>;
}
