// Protected viewer. The browser never receives a PDF: pages arrive as AES-256-GCM encrypted WebP images
// (watermarked with the reader's email by the server), are decrypted in memory and painted onto canvases.
// Right-click, save, print, copy and drag are blocked, and the page is hidden when the tab loses focus.
//
// Fast loading: the opened page is requested alone so it paints first; then pages load nearest-first in
// batches of 4 with several requests in flight, are kept in memory as small compressed images, and only the
// canvases near the screen hold decoded pixels (low memory on phones).
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "./api";
import { useAuth, Msg } from "./App";
import topicsJson from "../shared/topics.json";

type TItem = { id: string; title: string; page?: number; masterPage?: number; deep?: boolean };
type TSection = { id: string; title: string; page?: number; masterPage?: number; deep?: boolean; items: TItem[] };
const TOPICS = topicsJson as Record<string, { slug: string; sections: TSection[] }>;
const RATIO = 1110 / 794;                         // notebook page height / width
const MOBILE = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
const CACHE_MAX = MOBILE ? 140 : 700;              // compressed pages kept in memory (~50-100 KB each)
const PREFETCH_RADIUS = MOBILE ? 40 : 100000;      // phones prefetch a window; desktops the whole document
const PAINT_RADIUS = MOBILE ? 2 : 4;               // canvases kept painted around the current page
const BATCH = 4;                                   // pages per request (server maximum)
const PARALLEL = MOBILE ? 3 : 4;                   // requests in flight at once
const MARK_AFTER_MS = 10000;                       // reading time before topics on a page are marked done

type Hit = { page: number; count: number; snippet: string; rects: number[][] };
type Meta = { token: string; pages: number; title: string; searchable: boolean; email?: string };

const isDeepSlug = (slug: string) => slug.endsWith("-master") || slug.endsWith("-long");
// Page of a checklist item inside this document: deep-dive items live in the -master PDF, the rest in the quick notes.
function itemPage(slug: string, it: TItem, s: TSection): number | undefined {
  const deep = !!(it.deep || s.deep);
  if (deep !== isDeepSlug(slug)) return undefined;
  return deep ? (it.masterPage || s.masterPage) : (it.page || s.page);
}
const notebookOf = (slug: string) => TOPICS[slug.replace(/-(master|long)$/, "")] || TOPICS[slug];

export default function Reader() {
  const { user } = useAuth();
  if (!user) {
    const nextUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    return (
      <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 16px" }}>
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <h2 style={{ marginBottom: 10 }}>Sign in required</h2>
          <p className="muted" style={{ marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>You must be signed in to access and read study notes.</p>
          <div className="row" style={{ justifyContent: "center", gap: 12 }}>
            <Link to={`/login?next=${encodeURIComponent(nextUrl)}`} className="btn primary">Sign in</Link>
            <Link to={`/signup?next=${encodeURIComponent(nextUrl)}`} className="btn btn-signup">Create free account</Link>
          </div>
          <div style={{ marginTop: 20 }}><Link to="/" className="small muted">Back to track sheet</Link></div>
        </div>
      </div>
    );
  }
  return <SecureReader email={user.email} />;
}

function SecureReader({ email }: { email: string }) {
  const { slug = "" } = useParams(); const [sp] = useSearchParams();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [err, setErr] = useState(""); const [zoom, setZoom] = useState(1); const [cur, setCur] = useState(1); const [hidden, setHidden] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [cachedCount, setCachedCount] = useState(0);
  const [showSearch, setShowSearch] = useState(false); const [q, setQ] = useState(""); const [hits, setHits] = useState<Hit[]>([]);
  const [hitIdx, setHitIdx] = useState(0); const [searching, setSearching] = useState(false);
  const markedPages = useRef<Set<number>>(new Set());
  const key = useRef<CryptoKey | null>(null); const holder = useRef<HTMLDivElement>(null);
  const cache = useRef(new Map<number, Blob>());            // decrypted WebP per page
  const inflight = useRef(new Set<number>()); const failed = useRef(new Map<number, number>());
  const curRef = useRef(1); const active = useRef(0); const alive = useRef(true); const metaRef = useRef<Meta | null>(null);
  const firstPainted = useRef(false);
  const reqWidth = useRef(1100);

  const itemParam = sp.get("item");
  const start = (() => {
    const nb = itemParam ? notebookOf(slug) : null;
    if (nb) for (const s of nb.sections) {
      if (s.id === itemParam) { const p = isDeepSlug(slug) ? s.masterPage : s.page; if (p) return p; }
      for (const it of s.items) if (it.id === itemParam) { const p = itemPage(slug, it, s); if (p) return p; }
    }
    return Math.max(1, Number(sp.get("page")) || 1);
  })();

  useEffect(() => { document.body.classList.add("reading"); return () => document.body.classList.remove("reading"); }, []);
  useEffect(() => {
    alive.current = true; firstPainted.current = false;
    cache.current.clear(); inflight.current.clear(); failed.current.clear(); markedPages.current.clear();
    setMeta(null); metaRef.current = null; setLoadedPages(new Set()); setCachedCount(0); setErr("");
    const px = Math.min(window.innerWidth, 820) * Math.min(window.devicePixelRatio || 1, 2);
    reqWidth.current = px <= 700 ? 700 : px <= 900 ? 900 : px <= 1100 ? 1100 : 1300;
    api(`/docs/${slug}/open`, "POST", {}).then(async (r: Meta & { key: string }) => {
      if (!alive.current) return;
      key.current = await crypto.subtle.importKey("raw", Uint8Array.from(atob(r.key), c => c.charCodeAt(0)), "AES-GCM", false, ["decrypt"]);
      curRef.current = Math.min(start, r.pages); setCur(curRef.current);
      metaRef.current = r; setMeta(r);
    }).catch(e => setErr(/sign in/i.test(e.message || "") ? "Please sign in to access and read this document." : e.message || "Failed to open document."));
    return () => { alive.current = false; cache.current.clear(); };
  }, [slug]);

  /* ---------- loading queue: nearest missing pages first ---------- */
  function nextBatch(): number[] | null {
    const m = metaRef.current; if (!m) return null;
    const c = curRef.current, n = m.pages;
    const missing = (p: number) => p >= 1 && p <= n && !cache.current.has(p) && !inflight.current.has(p) && (failed.current.get(p) || 0) < 3;
    const size = firstPainted.current ? BATCH : 1;                    // the opened page goes alone so it paints first
    for (let d = 0; d <= n && d <= PREFETCH_RADIUS; d++) {
      for (const p of d === 0 ? [c] : [c + d, c - d]) {               // forward first: people read downwards
        if (!missing(p)) continue;
        const batch = [p];
        while (batch.length < size && missing(batch[batch.length - 1] + 1) && batch[batch.length - 1] + 1 - c <= PREFETCH_RADIUS) batch.push(batch[batch.length - 1] + 1);
        return batch;
      }
    }
    return null;
  }
  function evictFar() {
    if (cache.current.size <= CACHE_MAX) return;
    const far = [...cache.current.keys()].sort((a, b) => Math.abs(b - curRef.current) - Math.abs(a - curRef.current));
    for (const p of far.slice(0, cache.current.size - CACHE_MAX)) cache.current.delete(p);
  }
  function pump() {
    while (alive.current && active.current < (firstPainted.current ? PARALLEL : 2)) {
      const batch = nextBatch(); if (!batch) return;
      active.current++; batch.forEach(p => inflight.current.add(p));
      load(batch).finally(() => { active.current--; batch.forEach(p => inflight.current.delete(p)); pump(); });
    }
  }
  async function load(batch: number[]) {
    const m = metaRef.current; if (!m) return;
    try {
      const res = await fetch(`/api/view/${m.token}/${batch[0]}-${batch[batch.length - 1]}?w=${reqWidth.current}`, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({}))).error || "Could not load pages";
        if (res.status === 401 || res.status === 403 || res.status === 429) { setErr(msg); alive.current = false; }
        throw new Error(msg);
      }
      const buf = new Uint8Array(await res.arrayBuffer()); let off = 0;
      for (const p of batch) {
        const len = new DataView(buf.buffer, buf.byteOffset + off, 4).getUint32(0); off += 4;
        const part = buf.subarray(off, off + len); off += len;
        const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: part.slice(0, 12) }, key.current!, part.slice(12));
        if (metaRef.current !== m) return;                                     // document changed meanwhile
        cache.current.set(p, new Blob([plain], { type: "image/webp" }));
        if (Math.abs(p - curRef.current) <= PAINT_RADIUS) paint(p);
      }
      evictFar(); setCachedCount(cache.current.size);
    } catch { batch.forEach(p => failed.current.set(p, (failed.current.get(p) || 0) + 1)); }
  }

  /* ---------- painting: only pages near the screen hold decoded pixels ---------- */
  const canvasOf = (n: number) => holder.current?.querySelector<HTMLCanvasElement>(`canvas[data-p="${n}"]`);
  async function paint(n: number) {
    const canvas = canvasOf(n), blob = cache.current.get(n);
    if (!canvas || !blob || canvas.dataset.ok) return;
    canvas.dataset.ok = "1";
    try {
      const bmp = await createImageBitmap(blob);
      canvas.width = bmp.width; canvas.height = bmp.height;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0); bmp.close();
      canvas.parentElement?.classList.add("ready");
      if (!firstPainted.current) { firstPainted.current = true; pump(); }
      setLoadedPages(s => (s.has(n) ? s : new Set(s).add(n)));
    } catch { delete canvas.dataset.ok; }
  }
  function release(n: number) {
    const c = canvasOf(n);
    if (c?.dataset.ok) { c.width = c.height = 1; delete c.dataset.ok; c.parentElement?.classList.remove("ready"); }
  }
  function onPage(n: number) {
    curRef.current = n; setCur(n);
    for (let p = n - PAINT_RADIUS; p <= n + PAINT_RADIUS; p++) paint(p);
    holder.current?.querySelectorAll<HTMLCanvasElement>("canvas[data-ok]").forEach(c => { const p = Number(c.dataset.p); if (Math.abs(p - n) > PAINT_RADIUS + 2) release(p); });
    pump();
  }

  // Track the page in view; start loading around the opened page; jump to the requested page.
  useEffect(() => {
    if (!meta || !holder.current) return;
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting && e.intersectionRatio >= 0.35);
      if (vis.length) onPage(Number((vis[0].target as HTMLElement).dataset.n));
    }, { threshold: [0, 0.35, 0.6] });
    const pages = Array.from(holder.current.querySelectorAll<HTMLElement>(".pg"));
    pages.forEach(el => io.observe(el));
    let timer = 0;                                    // fallback: page from scroll position (binary search), throttled
    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const mid = window.innerHeight * 0.4; let lo = 0, hi = pages.length - 1;
        while (lo < hi) { const m = (lo + hi + 1) >> 1; if (pages[m].getBoundingClientRect().top <= mid) lo = m; else hi = m - 1; }
        const n = lo + 1; if (n !== curRef.current) onPage(n);
      }, 90);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const first = Math.min(start, meta.pages);
    if (first > 1) setTimeout(() => holder.current?.querySelector(`[data-n="${first}"]`)?.scrollIntoView({ block: "start" }), 0);
    pump();
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [meta]);

  // After 10 seconds of reading a loaded page, mark the checklist items printed on it as done.
  useEffect(() => {
    if (!slug || hidden || !loadedPages.has(cur) || markedPages.current.has(cur)) return;
    const timer = setTimeout(async () => {
      if (markedPages.current.has(cur)) return;
      markedPages.current.add(cur);
      const nb = notebookOf(slug); const items: string[] = [];
      if (nb) for (const s of nb.sections) for (const it of s.items) if (itemPage(slug, it, s) === cur) items.push(it.id);
      if (cur === start && itemParam) items.push(itemParam);
      const toMark = Array.from(new Set(items));
      if (!toMark.length) return;
      try { await api("/progress", "POST", { items: toMark, done: true }); setStatusMsg(`Page ${cur} marked as read`); setTimeout(() => setStatusMsg(""), 3500); } catch {}
    }, MARK_AFTER_MS);
    return () => clearTimeout(timer);
  }, [cur, loadedPages, slug, hidden, start, itemParam]);

  /* ---------- search inside the document (server-side index; the text never reaches the browser) ---------- */
  useEffect(() => {
    if (!showSearch || !meta) return;
    const term = q.trim();
    if (!term) { setHits([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const r = await api(`/docs/${slug}/search?q=${encodeURIComponent(term)}`); setHits(r.results); setHitIdx(0); if (r.results[0]) setTimeout(() => goHit(r.results[0]), 30); }
      catch (e: any) { setErr(e.message); } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, showSearch, meta]);
  const hitMap = new Map(hits.map(h => [h.page, h]));
  const total = hits.reduce((s, h) => s + h.count, 0);
  const goHit = (h: Hit) => {
    const pg = holder.current?.querySelector<HTMLElement>(`[data-n="${h.page}"]`); if (!pg) return;
    const top = pg.getBoundingClientRect().top + window.scrollY + (h.rects[0] ? (h.rects[0][1] / 1000) * pg.offsetHeight : 0);
    const covered = (document.querySelector(".reader-bar")?.getBoundingClientRect().bottom || 0) + (document.querySelector(".search-panel")?.getBoundingClientRect().height || 0);
    window.scrollTo({ top: Math.max(0, top - covered - 24) });
  };
  const stepHit = (d: number) => { if (!hits.length) return; const i = (hitIdx + d + hits.length) % hits.length; setHitIdx(i); goHit(hits[i]); };

  // Deterrents: no context menu, no save/print/view-source shortcuts, hide content when unfocused or printing.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "f") { e.preventDefault(); setShowSearch(true); setTimeout(() => document.getElementById("doc-search")?.focus(), 30); }
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(k)) e.preventDefault();
      if (k === "printscreen") { setHidden(true); setTimeout(() => setHidden(false), 1500); }
    };
    const vis = () => setHidden(document.visibilityState !== "visible");
    const bp = () => setHidden(true), ap = () => setHidden(false);
    document.addEventListener("contextmenu", block); document.addEventListener("dragstart", block); document.addEventListener("copy", block);
    window.addEventListener("keydown", keys); document.addEventListener("visibilitychange", vis);
    window.addEventListener("beforeprint", bp); window.addEventListener("afterprint", ap);
    return () => {
      document.removeEventListener("contextmenu", block); document.removeEventListener("dragstart", block); document.removeEventListener("copy", block);
      window.removeEventListener("keydown", keys); document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("beforeprint", bp); window.removeEventListener("afterprint", ap);
    };
  }, []);

  const go = (n: number) => holder.current?.querySelector(`[data-n="${Math.max(1, Math.min(meta!.pages, n))}"]`)?.scrollIntoView({ block: "start" });
  const width = Math.round(820 * zoom);
  const target = meta ? (MOBILE ? Math.min(meta.pages, PREFETCH_RADIUS * 2 + 1) : meta.pages) : 1;
  const pct = Math.min(100, Math.round((100 * cachedCount) / target));
  return <>
    <div className="reader-progress-bar" style={{ width: `${meta ? Math.max(pct, Math.round((100 * cur) / meta.pages)) : 5}%` }} />
    <div className="reader-bar">
      <Link to="/" className="btn sm" aria-label="Back to track sheet">Track sheet</Link>
      <b className="reader-title">{meta?.title || "Opening document..."}</b>
      {statusMsg && <span className="reader-pill">{statusMsg}</span>}
      {meta && <>
        <button className="sm" onClick={() => go(cur - 1)} disabled={cur <= 1} aria-label="Previous page">Prev</button>
        <label className="page-control small nowrap"><span className="hide-sm">Page</span>
          <input className="page-input" type="number" min={1} max={meta.pages} value={cur} onChange={e => { const n = Number(e.target.value); if (n >= 1 && n <= meta.pages) go(n); }} aria-label="Go to page" /> / {meta.pages}
        </label>
        <button className="sm" onClick={() => go(cur + 1)} disabled={cur >= meta.pages} aria-label="Next page">Next</button>
        <button className="sm hide-sm" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.15).toFixed(2)))} aria-label="Zoom out">−</button>
        <button className="sm hide-sm" onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))} aria-label="Zoom in">+</button>
        <button className={`sm ${showSearch ? "primary" : ""}`} title="Search in document (Ctrl+F)" onClick={() => { setShowSearch(s => !s); setTimeout(() => document.getElementById("doc-search")?.focus(), 30); }} aria-label="Search in document">Search</button>
        {pct < 100 && <span className="small muted hide-sm" title="Pages ready for instant scrolling">{pct}% loaded</span>}
      </>}
    </div>
    {showSearch && meta && <div className="search-panel" role="search" aria-label="In-document search">
      <div className="row">
        <input id="doc-search" placeholder={meta.searchable ? "Search a word or characters..." : "Search is not available for this document yet"} disabled={!meta.searchable}
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") stepHit(e.shiftKey ? -1 : 1); if (e.key === "Escape") setShowSearch(false); }} aria-label="Search text" />
        <span className="small muted nowrap">{searching ? "Searching..." : q.trim() ? `${total} match${total === 1 ? "" : "es"} on ${hits.length} page${hits.length === 1 ? "" : "s"}` : "Type to search"}</span>
        <button className="sm" onClick={() => stepHit(-1)} disabled={!hits.length} title="Previous match (Shift+Enter)" aria-label="Previous match">▲</button>
        <button className="sm" onClick={() => stepHit(1)} disabled={!hits.length} title="Next match (Enter)" aria-label="Next match">▼</button>
        <button className="sm" onClick={() => { setShowSearch(false); setQ(""); setHits([]); }} aria-label="Close search">✕</button>
      </div>
      {!!hits.length && <div className="hits">{hits.map((h, i) =>
        <button key={h.page} className={`hit ${i === hitIdx ? "on" : ""}`} onClick={() => { setHitIdx(i); goHit(h); }}>
          <b>p.{h.page}</b> <span className="muted">({h.count})</span> {h.snippet}
        </button>)}</div>}
    </div>}
    <div className="reader" ref={holder}>
      {err && <div style={{ maxWidth: 600, margin: "auto" }}><Msg>{err}</Msg></div>}
      {meta && Array.from({ length: meta.pages }, (_, i) => i + 1).map(n =>
        <div className="pg" key={n} data-n={n} style={{ width: `min(${width}px, 100%)`, aspectRatio: `${1 / RATIO}` }}>
          <canvas data-p={n} aria-label={`Page ${n}`} />
          <div className="pg-wait">Loading page {n}...</div>
          {hitMap.get(n)?.rects.map((r, k) => <i key={k} className={`hl ${hits[hitIdx]?.page === n ? "cur" : ""}`}
            style={{ left: `${r[0] / 10}%`, top: `${r[1] / 10}%`, width: `${(r[2] - r[0]) / 10}%`, height: `${(r[3] - r[1]) / 10}%` }} />)}
          <div className="wm">{email}</div><span className="no">{n}</span>
        </div>)}
    </div>
    {hidden && <div className="shield"><div><h2>Protected document</h2><p>Return to this tab to continue reading.</p></div></div>}
  </>;
}
