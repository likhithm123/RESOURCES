// Track sheet: notebooks for the user's roles -> sections -> items with checkboxes.
// Progress is saved per item; every item can open the notes at its exact page.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Doc } from "./api";
import { useAuth, Msg } from "./App";
import { NOTEBOOKS, CAREER_ROLES } from "../shared/catalog";
import topicsJson from "../shared/topics.json";

type Item = { id: string; title: string; page?: number };
type Section = { id: string; title: string; page?: number; items: Item[] };
const TOPICS = topicsJson as Record<string, { slug: string; sections: Section[] }>;
const A2Z = "11-dsa-a2z-solutions";
const tufSlug = (t: string) => t.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const pct = (d: number, n: number) => (n ? Math.round((100 * d) / n) : 0);
const Bar = ({ d, n }: { d: number; n: number }) => <><div className="bar" aria-hidden><i style={{ width: pct(d, n) + "%" }} /></div><span className="pct">{pct(d, n)}%</span></>;

export default function Track() {
  const { user, refresh } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState<{ current: number; longest: number; days: string[] }>({ current: 0, longest: 0, days: [] });
  const [docs, setDocs] = useState<Record<string, Doc>>({});
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(""); const [hideDone, setHideDone] = useState(false); const [err, setErr] = useState(""); const [edit, setEdit] = useState(false);
  useEffect(() => {
    api("/progress").then(r => {
      setDone(new Set(r.done));
      if (r.streak) setStreak(r.streak);
    }).catch(e => setErr(e.message));
    api("/docs").then(r => setDocs(Object.fromEntries(r.docs.map((d: Doc) => [d.slug, d])))).catch(() => {});
  }, []);

  // plan = explicit list of notebook slugs; "-slug" hides one suggested by the roles.
  const plan = user!.plan;
  const mine = useMemo(() => NOTEBOOKS.filter(nb =>
    plan.includes(nb.slug) || (nb.roles.some(r => user!.career_roles.includes(r)) && !plan.includes("-" + nb.slug))), [user]);
  async function toggleNotebook(slug: string, show: boolean) {
    const next = plan.filter(x => x !== slug && x !== "-" + slug); next.push(show ? slug : "-" + slug);
    await api("/me", "PUT", { name: user!.name, career_roles: user!.career_roles, plan: next }); await refresh();
  }
  async function mark(ids: string[], value: boolean) {
    const next = new Set(done); ids.forEach(id => (value ? next.add(id) : next.delete(id))); setDone(next);     // optimistic
    try { await api("/progress", "POST", { items: ids, done: value }); } catch (e: any) { setErr(e.message); }
  }
  const flip = (id: string) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const all = mine.flatMap(nb => (TOPICS[nb.slug]?.sections || []).flatMap(s => s.items));
  const total = all.length, finished = all.filter(i => done.has(i.id)).length;
  const needle = q.trim().toLowerCase();

  return <>
    <div className="card">
      <div className="row"><div style={{ flex: 1, minWidth: 220 }}>
        <h1>Hi {user!.name.split(" ")[0]}, here is your track sheet</h1>
        <div className="muted small">Roles: {user!.career_roles.map(r => CAREER_ROLES.find(x => x.id === r)?.label).join(" · ")} · <Link to="/plan">change</Link></div>
      </div>
      <div className="row" style={{ gap: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: streak.current > 0 ? "#e65100" : "var(--ink)" }}>
            🔥 {streak.current}
          </div>
          <div className="small muted">day streak (best: {streak.longest})</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--ink)" }}>{pct(finished, total)}%</div>
          <div className="small muted">{finished} of {total} topics done</div>
        </div>
      </div></div>
      <div className="row" style={{ marginTop: 10 }}><Bar d={finished} n={total} /></div>
    </div>
    <Msg>{err}</Msg>
    <div className="row" style={{ marginBottom: 12 }}>
      <input placeholder="Search a topic or problem (e.g. binary search, joins, kafka)" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} aria-label="Search topics" />
      <label className="row small"><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Hide completed</label>
      <button className="sm" onClick={() => setEdit(!edit)}>{edit ? "Done customising" : "Customise notebooks"}</button>
    </div>
    {edit && <div className="card"><h2>Notebooks on my sheet</h2><div className="chips">{NOTEBOOKS.map(nb => {
      const on = mine.includes(nb);
      return <span key={nb.slug} className={`chip ${on ? "on" : ""}`} onClick={() => toggleNotebook(nb.slug, !on)}>{nb.title}</span>;
    })}</div></div>}

    {mine.map(nb => {
      const sections = TOPICS[nb.slug]?.sections || [];
      const items = sections.flatMap(s => s.items); const d = items.filter(i => done.has(i.id)).length;
      const doc = docs[nb.slug]; const isOpen = open.has(nb.slug) || !!needle;
      const read = (page?: number) => `/read/${nb.slug}${page ? `?page=${page}` : ""}`;
      return <div className="nb" key={nb.slug}>
        <div className="nb-head" onClick={() => flip(nb.slug)} role="button" aria-expanded={isOpen}>
          <span className="caret">{isOpen ? "▾" : "▸"}</span>
          <div style={{ flex: 1, minWidth: 160 }}><h3>{nb.title}</h3><div className="small muted">{items.length ? `${d} / ${items.length} done` : "Notes coming soon"}</div></div>
          <div className="row" style={{ width: 220 }}><Bar d={d} n={items.length} /></div>
          {doc && <Link className="btn sm" to={read()} onClick={e => e.stopPropagation()}>Open notes</Link>}
        </div>
        {isOpen && sections.map(sec => {
          const shown = sec.items.filter(i => (!needle || i.title.toLowerCase().includes(needle) || sec.title.toLowerCase().includes(needle)) && !(hideDone && done.has(i.id)));
          if (!shown.length) return null;
          const sd = sec.items.filter(i => done.has(i.id)).length; const sOpen = open.has(sec.id) || !!needle;
          return <div className="sec" key={sec.id}>
            <div className="sec-head" onClick={() => flip(sec.id)} role="button" aria-expanded={sOpen}>
              <span className="caret">{sOpen ? "▾" : "▸"}</span><span style={{ flex: 1 }}>{sec.title}</span>
              <span className="small muted">{sd} / {sec.items.length}</span>
              <button className="sm" onClick={e => { e.stopPropagation(); mark(sec.items.map(i => i.id), sd !== sec.items.length); }}>{sd === sec.items.length ? "Unmark all" : "Mark all"}</button>
            </div>
            {sOpen && shown.map(it => <div className={`item ${done.has(it.id) ? "done" : ""}`} key={it.id}>
              <input type="checkbox" checked={done.has(it.id)} onChange={e => mark([it.id], e.target.checked)} aria-label={`Done: ${it.title}`} />
              {doc ? <Link className="t" to={read(it.page || sec.page)} title="Open the notes at this topic">{it.title}</Link> : <span className="t">{it.title}</span>}
              {doc && it.page && <Link className="btn sm primary" to={read(it.page)} title="Open our notes at this topic">Notes · p.{it.page}</Link>}
              {nb.slug === A2Z && <a className="btn sm" href={`https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?note=${tufSlug(it.title)}`} target="_blank" rel="noopener noreferrer" title="Extra resource on takeUforward">TUF ↗</a>}
            </div>)}
          </div>;
        })}
      </div>;
    })}
    {!Object.keys(docs).length && <div className="card small muted">Notes PDFs are being published. Topic links open the notes once a notebook is published.</div>}
    {!mine.length && <div className="card">No notebooks yet. <Link to="/plan">Choose your roles</Link>.</div>}
  </>;
}
