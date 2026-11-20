// Notes library, Resources / Projects lists and the Connect tab.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Doc } from "./api";
import { useAuth, Msg } from "./App";
import { CAREER_ROLES, roleLabel } from "../shared/catalog";

export function Library() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [all, setAll] = useState(false);
  const [role, setRole] = useState("");
  const [edition, setEdition] = useState<"all" | "master" | "short">("all");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/docs").then(r => setDocs(r.docs)).catch(e => setErr(e.message));
  }, []);

  const isMaster = (d: Doc) => d.slug.endsWith("-master") || d.slug.endsWith("-long");

  const needle = q.trim().toLowerCase();
  const shown = (docs || []).filter(d => {
    const master = isMaster(d);
    if (edition === "master" && !master) return false;
    if (edition === "short" && master) return false;
    if (role && !d.career_roles.includes(role)) return false;
    if (!all && !role && user && user.career_roles?.length && !d.career_roles.some(r => user.career_roles.includes(r))) return false;
    if (needle && ![d.title, d.description, d.slug].join(" ").toLowerCase().includes(needle)) return false;
    return true;
  });

  return <>
    <div className="row" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Notes Library</h1>
      <label className="row small" style={{ cursor: "pointer", userSelect: "none" }}>
        <input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} /> Show notes for all roles
      </label>
    </div>
    <p className="muted">Handwritten-style comprehensive notes. Choose between rapid Quick Revision notes and complete Master Deep-Dive editions (100+ pages).</p>
    <Msg>{err}</Msg>

    <div className="row" style={{ gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
      <input
        placeholder="Search notes (e.g. C++, DSA, System Design, FastAPI, Docker, SQL)..."
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ flex: 1, minWidth: 240 }}
        aria-label="Search notes"
      />
      <select value={role} onChange={e => setRole(e.target.value)} style={{ width: 220 }} aria-label="Filter notes by role">
        <option value="">All Career Roles</option>
        {CAREER_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
      <div className="row small" style={{ gap: 6 }}>
        <button type="button" className={`sm ${edition === "all" ? "primary" : ""}`} onClick={() => setEdition("all")}>All Editions ({docs ? docs.length : 0})</button>
        <button type="button" className={`sm ${edition === "master" ? "primary" : ""}`} onClick={() => setEdition("master")}>Master Long ({docs ? docs.filter(isMaster).length : 0})</button>
        <button type="button" className={`sm ${edition === "short" ? "primary" : ""}`} onClick={() => setEdition("short")}>Quick Short ({docs ? docs.filter(d => !isMaster(d)).length : 0})</button>
      </div>
    </div>

    {docs && !shown.length && <div className="card">No matching notes found. Try adjusting your search query or role filter.</div>}
    
    <div className="grid">{shown.map(d => {
      const isL = isMaster(d);
      return <div className="card" key={d.id} style={{ marginBottom: 0, borderTop: `4px solid ${isL ? "#1b3fae" : "#10b981"}` }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>
            {d.title}
            {(d.slug.includes("19-ai-engineer-llms") || d.slug.includes("38-claude-101") || d.title.toLowerCase().includes("prompt engineering")) && (
              <span className="badge-pe" style={{ marginLeft: 8, fontSize: 10, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "1px 6px", borderRadius: 10, fontWeight: 700, verticalAlign: "middle" }}>
                Prompt Engineering Included
              </span>
            )}
          </h3>
          <span className="tag" style={{ background: isL ? "#eff6ff" : "#ecfdf5", color: isL ? "#1e40af" : "#065f46", fontWeight: 700, fontSize: 11, flex: "none" }}>
            {isL ? "Master Edition" : "Quick Revise"}
          </span>
        </div>
        <p className="small muted" style={{ marginTop: 8, lineHeight: 1.5 }}>{d.description || `${d.pages} pages deep dive notes`}</p>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {d.career_roles.slice(0, 4).map(r => <span className="tag" key={r} style={{ fontSize: 10 }}>{roleLabel(r)}</span>)}
          {d.career_roles.length > 4 && <span className="tag" style={{ fontSize: 10 }}>+{d.career_roles.length - 4} more</span>}
        </div>
        <div className="row" style={{ gap: 8, alignItems: "center", marginTop: 14 }}>
          <a className="btn primary sm" href={`/read/${d.slug}`} target="_blank" rel="noopener noreferrer">
            {isL ? "Open Master Notes" : "Open Quick Notes"}
          </a>
          <span className="small muted" style={{ fontWeight: 600, marginLeft: "auto" }}>{d.pages} pages</span>
        </div>
      </div>;
    })}</div>
  </>;
}

export function Links({ kind }: { kind: "resource" | "project" }) {
  const { user } = useAuth();
  const [links, setLinks] = useState<any[] | null>(null);
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api("/links").then(r => setLinks(r.links)).catch(e => setErr(e.message));
  }, []);

  const needle = q.trim().toLowerCase();
  const shown = (links || []).filter(l => {
    if (l.kind !== kind) return false;
    if (role && !l.career_roles.includes(role)) return false;
    if (needle && ![l.title, l.description, l.category, l.url].join(" ").toLowerCase().includes(needle)) return false;
    return true;
  });

  const groups = [...new Set(shown.map(l => l.category || "General"))];

  return <>
    <div className="row" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <h1 style={{ margin: 0 }}>{kind === "resource" ? "Curated Resources" : "Resume-Grade Projects"}</h1>
      <select style={{ width: 240 }} value={role} onChange={e => setRole(e.target.value)} aria-label="Filter by role">
        <option value="">All Career Roles</option>
        {CAREER_ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select>
    </div>
    <p className="muted">
      {kind === "resource"
        ? "Hand-picked, production-grade tools, interactive practice sheets, official documentation, and architectural guides."
        : "Industry-standard open-source repositories and portfolio projects that carry genuine weight on a software engineering resume."}
    </p>
    <Msg>{err}</Msg>

    <div className="row" style={{ marginBottom: 16 }}>
      <input
        placeholder={`Search ${kind === "resource" ? "resources (e.g. LeetCode, Kubernetes, System Design, OWASP)" : "projects (e.g. Microservices, RAG, CRDT, LlamaIndex, Argo CD)"}...`}
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ flex: 1, minWidth: 260 }}
        aria-label={`Search ${kind === "resource" ? "resources" : "projects"}`}
      />
    </div>

    {links && !shown.length && <div className="card">No {kind === "resource" ? "resources" : "projects"} matching your filter.</div>}

    {groups.map(g => (
      <div key={g}>
        <h2 style={{ marginTop: 24, marginBottom: 12, fontSize: 18, color: "var(--ink)" }}>{g}</h2>
        <div className="grid">
          {shown.filter(l => (l.category || "General") === g).map(l => (
            <div className="card" key={l.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", marginBottom: 0 }}>
              <div>
                <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{l.title}</h3>
                <p className="small muted" style={{ lineHeight: 1.5, margin: 0 }}>{l.description}</p>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {l.career_roles.map((r: string) => <span className="tag" key={r} style={{ fontSize: 11 }}>{roleLabel(r)}</span>)}
                </div>
                {l.url && (
                  <a className="btn sm primary" href={l.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block" }}>
                    {kind === "project" ? "View GitHub Repository ↗" : "Open Resource ↗"}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
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
      <a href="/read/37-top-tech-certifications-guide-master" target="_blank" rel="noopener noreferrer" className="btn sm primary">Open Certifications Study Guide ↗</a>
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
        <option value="ai">AI / GenAI / Claude</option>
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
