// Track sheet: notebooks for the user's roles -> sections -> items with checkboxes.
// Progress is saved per item; every item can open the notes at its exact page.
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Doc } from "./api";
import { useAuth, Msg } from "./App";
import { NOTEBOOKS, CAREER_ROLES } from "../shared/catalog";
import topicsJson from "../shared/topics.json";

type Item = { id: string; title: string; page?: number; masterPage?: number };
type Section = { id: string; title: string; page?: number; masterPage?: number; items: Item[] };
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
    if (user) {
      api("/progress").then(r => {
        setDone(new Set(r.done));
        if (r.streak) setStreak(r.streak);
      }).catch(e => setErr(e.message));
    } else {
      try {
        const saved = localStorage.getItem("rp_guest_done");
        if (saved) setDone(new Set(JSON.parse(saved)));
      } catch { }
    }
    api("/docs").then(r => setDocs(Object.fromEntries(r.docs.map((d: Doc) => [d.slug, d])))).catch(() => { });
  }, [user]);

  // If logged in, show notebooks matching user roles / plan. If guest, show all 39 notebooks.
  const mine = useMemo(() => {
    if (!user) return NOTEBOOKS;
    const plan = user.plan || [];
    return NOTEBOOKS.filter(nb =>
      plan.includes(nb.slug) || (nb.roles.some(r => (user.career_roles || []).includes(r)) && !plan.includes("-" + nb.slug)));
  }, [user]);

  async function toggleNotebook(slug: string, show: boolean) {
    if (!user) return;
    const plan = user.plan || [];
    const next = plan.filter(x => x !== slug && x !== "-" + slug); next.push(show ? slug : "-" + slug);
    await api("/me", "PUT", { name: user.name, career_roles: user.career_roles, plan: next }); await refresh();
  }

  async function mark(ids: string[], value: boolean) {
    const next = new Set(done); ids.forEach(id => (value ? next.add(id) : next.delete(id))); setDone(next);
    if (!user) {
      try { localStorage.setItem("rp_guest_done", JSON.stringify([...next])); } catch { }
      return;
    }
    try { await api("/progress", "POST", { items: ids, done: value }); } catch (e: any) { setErr(e.message); }
  }
  const flip = (id: string) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const all = mine.flatMap(nb => (TOPICS[nb.slug]?.sections || []).flatMap(s => s.items));
  const total = all.length, finished = all.filter(i => done.has(i.id)).length;
  const needle = q.trim().toLowerCase();

  // Search ranking: bring notebooks, sections, and items with matching topics to the top
  const sortedMine = useMemo(() => {
    if (!needle) return mine;
    const scored = mine.map(nb => {
      const sections = TOPICS[nb.slug]?.sections || [];
      let count = 0;
      if (nb.title.toLowerCase().includes(needle)) count += 50;
      for (const sec of sections) {
        if (sec.title.toLowerCase().includes(needle)) count += 10;
        for (const it of sec.items) {
          if (it.title.toLowerCase().includes(needle)) count += 1;
        }
      }
      return { nb, count };
    });
    return [...scored].sort((a, b) => b.count - a.count).map(x => x.nb);
  }, [mine, needle]);

  const otherMatchingNotebooks = useMemo(() => {
    if (!needle) return [];
    const mineSlugs = new Set(mine.map(m => m.slug));
    return NOTEBOOKS.filter(nb => !mineSlugs.has(nb.slug)).filter(nb => {
      if (nb.title.toLowerCase().includes(needle)) return true;
      const sections = TOPICS[nb.slug]?.sections || [];
      return sections.some(s => s.title.toLowerCase().includes(needle) || s.items.some(i => i.title.toLowerCase().includes(needle)));
    });
  }, [mine, needle]);

  return <>
    {!user && (
      <div className="card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <b style={{ fontSize: 15 }}>Sign in required to access notes</b>
          <div className="muted small" style={{ marginTop: 2 }}>You can track syllabus progress freely. To open and read handwritten notes, please sign in or create an account.</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/login" className="btn sm">Sign in</Link>
          <Link to="/signup" className="btn sm btn-signup">Sign up</Link>
        </div>
      </div>
    )}
    <div className="card">
      <div className="row"><div style={{ flex: 1, minWidth: 220 }}>
        <h1>Hi {user?.name ? user.name.split(" ")[0] : "Student"}, here is your track sheet</h1>
        <div className="muted small">{user ? <>Roles: {(user?.career_roles || []).map(r => CAREER_ROLES.find(x => x.id === r)?.label).filter(Boolean).join(" · ")} · <Link to="/plan">change</Link></> : <>Tracking all {NOTEBOOKS.length} curriculum notebooks · Progress saved locally · <Link to="/signup">Create free account</Link> to sync across devices</>}</div>
      </div>
        <div className="row" style={{ gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: streak.current > 0 ? "#e65100" : "var(--ink)" }}>
              {streak.current}
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
    <div className="row" style={{ marginBottom: 12, flexWrap: "wrap", gap: 10, alignItems: "center" }}>
      <input placeholder="Search a topic or problem (e.g. binary search, joins, kafka, kubernetes)" value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1, minWidth: 220 }} aria-label="Search topics" />
      <label className="row small"><input type="checkbox" checked={hideDone} onChange={e => setHideDone(e.target.checked)} /> Hide completed</label>
      <button className="sm" onClick={() => setEdit(!edit)}>{edit ? "Done customising" : "Customise notebooks"}</button>
    </div>
    {needle && otherMatchingNotebooks.length > 0 && (
      <div className="card small" style={{ marginBottom: 14, background: "var(--bg-subtle, #f8f9fa)" }}>
        <span className="muted">Matches also found in other notebooks: </span>
        {otherMatchingNotebooks.map(nb => (
          <button key={nb.slug} className="sm" style={{ marginLeft: 6, marginTop: 4 }} onClick={() => toggleNotebook(nb.slug, true)}>
            + Add {nb.title} to sheet
          </button>
        ))}
      </div>
    )}
    {edit && <div className="card"><h2>Notebooks on my sheet</h2><div className="chips">{NOTEBOOKS.map(nb => {
      const on = mine.includes(nb);
      return <span key={nb.slug} className={`chip ${on ? "on" : ""}`} onClick={() => toggleNotebook(nb.slug, !on)}>{nb.title}</span>;
    })}</div></div>}

    {sortedMine.map(nb => {
      const rawSections = TOPICS[nb.slug]?.sections || [];
      const sections = needle ? [...rawSections].sort((a, b) => {
        const scoreSec = (s: Section) => {
          let score = s.title.toLowerCase().includes(needle) ? 10 : 0;
          for (const it of s.items) {
            if (it.title.toLowerCase().includes(needle)) score += 2;
          }
          return score;
        };
        return scoreSec(b) - scoreSec(a);
      }) : rawSections;

      const items = sections.flatMap(s => s.items); const d = items.filter(i => done.has(i.id)).length;
      const matchingItemsCount = needle ? items.filter(i => i.title.toLowerCase().includes(needle) || sections.some(s => s.items.includes(i) && s.title.toLowerCase().includes(needle))).length : 0;
      const isOpen = open.has(nb.slug) || (!!needle && matchingItemsCount > 0);
      const isDsa = nb.slug.includes("dsa");
      const isA2Z = nb.slug === A2Z;
      const read = (page?: number, itemId?: string) => `/read/${nb.slug}${page ? `?page=${page}` : ""}${itemId ? `${page ? "&" : "?"}item=${encodeURIComponent(itemId)}` : ""}`;
      const shortRead = read;
      const prefix = nb.slug.slice(0, 3);
      const masterDoc = Object.values(docs || {}).find(d => (d.slug === `${nb.slug}-master` || (d.slug.startsWith(prefix) && d.slug.endsWith("-master"))));
      const masterSlug = masterDoc ? masterDoc.slug : `${nb.slug}-master`;
      const masterRead = (page?: number, itemId?: string) => `/read/${masterSlug}${page ? `?page=${page}` : ""}${itemId ? `${page ? "&" : "?"}item=${encodeURIComponent(itemId)}` : ""}`;
      const toUrl = (path: string) => user ? path : `/login?next=${encodeURIComponent(path)}`;

      return <div className={`nb ${isA2Z ? "nb-a2z" : isDsa ? "nb-dsa" : ""}`} key={nb.slug}>
        <div className="nb-head" onClick={() => flip(nb.slug)} role="button" aria-expanded={isOpen}>
          <span className="caret">{isOpen ? "▾" : "▸"}</span>
          <div style={{ flex: 1, minWidth: 160 }}>
            <h3>
              {nb.title}
              {(nb.slug === "19-ai-engineer-llms" || nb.slug === "38-claude-101" || nb.title.toLowerCase().includes("prompt engineering")) && (
                <span className="badge-pe" style={{ marginLeft: 8, fontSize: 11, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>Prompt Engineering Included</span>
              )}
              {isA2Z && <span className="badge-practice" style={{ marginLeft: 8, fontSize: 11, background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>Practice available (Interactive TUF Sheets)</span>}
              {isDsa && !isA2Z && <span className="badge-dsa" style={{ marginLeft: 8, fontSize: 11, background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>Core DSA</span>}
              {needle && matchingItemsCount > 0 && <span className="chip on small" style={{ fontSize: 11, verticalAlign: "middle", marginLeft: 6 }}>{matchingItemsCount} match{matchingItemsCount !== 1 ? "es" : ""}</span>}
            </h3>
            <div className="small muted">{items.length ? `${d} / ${items.length} done` : "Notes coming soon"}</div>
          </div>
          <div className="row" style={{ width: 140 }}><Bar d={d} n={items.length} /></div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }} onClick={e => e.stopPropagation()}>
            <a className="btn sm" href={toUrl(read())} target={user ? "_blank" : undefined} rel="noopener noreferrer" title="Open Quick Revision Notes in new tab">Quick Revise</a>
            <a className="btn sm primary" href={toUrl(masterRead())} target={user ? "_blank" : undefined} rel="noopener noreferrer" title="Open Master Deep-Dive Edition in new tab">Master Edition {masterDoc ? `(${masterDoc.pages}p)` : ""}</a>
          </div>
        </div>
        {isOpen && sections.map(sec => {
          const shown = sec.items
            .filter(i => (!needle || i.title.toLowerCase().includes(needle) || sec.title.toLowerCase().includes(needle)) && !(hideDone && done.has(i.id)))
            .sort((a, b) => {
              if (!needle) return 0;
              const aM = a.title.toLowerCase().includes(needle) ? 1 : 0;
              const bM = b.title.toLowerCase().includes(needle) ? 1 : 0;
              return bM - aM;
            });
          if (!shown.length) return null;
          const sd = sec.items.filter(i => done.has(i.id)).length; const sOpen = open.has(sec.id) || !!needle;
          return <div className="sec" key={sec.id}>
            <div className="sec-head" onClick={() => flip(sec.id)} role="button" aria-expanded={sOpen}>
              <span className="caret">{sOpen ? "▾" : "▸"}</span><span style={{ flex: 1 }}>{sec.title}</span>
              <span className="small muted">{sd} / {sec.items.length}</span>
              <button className="sm" onClick={e => { e.stopPropagation(); mark(sec.items.map(i => i.id), sd !== sec.items.length); }}>{sd === sec.items.length ? "Unmark all" : "Mark all"}</button>
            </div>
            {sOpen && shown.map(it => {
              const masterP = it.masterPage || sec.masterPage || it.page || sec.page;
              const shortP = it.page || sec.page || it.masterPage || sec.masterPage;
              const targetPage = masterP;
              const targetUrl = masterRead(masterP, it.id);
              const label = `Notes · p.${masterP}`;

              return <div className={`item ${done.has(it.id) ? "done" : ""}`} key={it.id}>
                <input type="checkbox" checked={done.has(it.id)} onChange={e => mark([it.id], e.target.checked)} aria-label={`Done: ${it.title}`} />
                <a className="t" href={toUrl(targetUrl)} target={user ? "_blank" : undefined} rel="noopener noreferrer" title="Open master notes at this topic in new tab">{it.title}</a>
                {targetPage && <a className="btn sm primary" href={toUrl(targetUrl)} target={user ? "_blank" : undefined} rel="noopener noreferrer" title="Open master notes at this topic in new tab">{label}</a>}
                {shortP && shortP !== masterP && <a className="btn sm" href={toUrl(shortRead(shortP, it.id))} target={user ? "_blank" : undefined} rel="noopener noreferrer" title="Open Quick Revision notes in new tab">Quick · p.{shortP}</a>}
                {nb.slug === A2Z && <a className="btn sm" href={`https://takeuforward.org/prep-hub/strivers-a2z-dsa-sheet?note=${tufSlug(it.title)}`} target="_blank" rel="noopener noreferrer" title="Extra resource on takeUforward">TUF ↗</a>}
              </div>;
            })}
          </div>;
        })}
      </div>;
    })}
    {!mine.length && <div className="card">No notebooks yet. <Link to="/plan">Choose your roles</Link>.</div>}
  </>;
}
