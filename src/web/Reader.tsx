// Protected viewer. The browser never receives a PDF: pages arrive as AES-GCM encrypted WebP images (4 per request),
// are decrypted in memory and painted onto canvases. Right-click, save, print and text selection are disabled,
// and every page carries the reader's email as a watermark.
//
// Smooth loading: the pages around the one you open load first (in parallel), then the rest of the document is
// prefetched in the background and kept in memory as small compressed images, so scrolling and jumping are instant.
// Only the canvases near the screen hold decoded pixels, which keeps memory low on phones.
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import "@fontsource/monsieur-la-doulaise/400.css";
import { api } from "./api";
import { useAuth, Msg } from "./App";
import topicsJson from "../shared/topics.json";

const TOPICS = topicsJson as Record<string, { slug: string; sections: { id: string; title: string; page?: number; items: { id: string; title: string; page?: number }[] }[] }>;
const RATIO = 1110 / 794;                         // notebook page height / width
const MOBILE = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
const CACHE_MAX = MOBILE ? 140 : 700;              // compressed pages kept in memory (~50-100 KB each)
const PREFETCH_RADIUS = MOBILE ? 40 : 100000;      // phones prefetch a window; desktops the whole document
const PAINT_RADIUS = MOBILE ? 3 : 5;               // canvases kept painted around the current page
const BATCH = 4;                                   // pages per request (server maximum)
const PARALLEL = MOBILE ? 2 : 3;                   // requests in flight at once
const SIGN_FONT = '"Cochocib Script Latin Pro", "Monsieur La Doulaise", cursive';

type Hit = { page: number; count: number; snippet: string; rects: number[][] };

export default function Reader() {
  const { slug } = useParams(); const [sp] = useSearchParams(); const { user } = useAuth();
  const [meta, setMeta] = useState<{ token: string; pages: number; title: string; searchable: boolean } | null>(null);
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
  const curRef = useRef(1); const active = useRef(0); const alive = useRef(true); const metaRef = useRef<typeof meta>(null);
  const start = Math.max(1, Number(sp.get("page")) || 1);
  const reqWidth = useRef(1100);

  useEffect(() => { document.body.classList.add("reading"); return () => document.body.classList.remove("reading"); }, []);
  useEffect(() => {
    alive.current = true;
    const px = Math.min(window.innerWidth, 820) * Math.min(window.devicePixelRatio || 1, 2);
    reqWidth.current = px <= 700 ? 700 : px <= 900 ? 900 : px <= 1100 ? 1100 : 1300;
    api(`/docs/${slug}/open`, "POST", {}).then(async r => {
      if (!alive.current) return;
      key.current = await crypto.subtle.importKey("raw", Uint8Array.from(atob(r.key), c => c.charCodeAt(0)), "AES-GCM", false, ["decrypt"]);
      curRef.current = Math.min(start, r.pages); setCur(curRef.current);
      document.fonts?.load(`20px ${SIGN_FONT}`).catch(() => {});
      metaRef.current = r; setMeta(r);
    }).catch(e => setErr(e.message));
    return () => { alive.current = false; cache.current.clear(); };
  }, [slug]);

  /* ---------- loading queue: nearest missing pages first, BATCH pages per request ---------- */
  function nextBatch(): number[] | null {
    const m = metaRef.current; if (!m) return null;
    const c = curRef.current, n = m.pages;
    const missing = (p: number) => p >= 1 && p <= n && !cache.current.has(p) && !inflight.current.has(p) && (failed.current.get(p) || 0) < 3;
    for (let d = 0; d <= n && d <= PREFETCH_RADIUS; d++) {
      for (const p of d === 0 ? [c] : [c + d, c - d]) {               // forward first: people read downwards
        if (!missing(p)) continue;
        const batch = [p];
        while (batch.length < BATCH && missing(batch[batch.length - 1] + 1) && batch[batch.length - 1] + 1 - c <= PREFETCH_RADIUS) batch.push(batch[batch.length - 1] + 1);
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
    while (alive.current && active.current < PARALLEL) {
      const batch = nextBatch(); if (!batch) return;
      active.current++; batch.forEach(p => inflight.current.add(p));
      load(batch).finally(() => { active.current--; batch.forEach(p => inflight.current.delete(p)); pump(); });
    }
  }
  async function load(batch: number[]) {
    try {
      const res = await fetch(`/api/view/${metaRef.current!.token}/${batch[0]}-${batch[batch.length - 1]}?w=${reqWidth.current}`, { credentials: "same-origin", cache: "no-store" });
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
      canvas.getContext("2d")!.drawImage(bmp, 0, 0); bmp.close();          // the signature is part of every page image
      canvas.parentElement?.classList.add("ready");
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

  // Track the page in view; start loading around the opened page; jump to ?page=.
  useEffect(() => {
    if (!meta || !holder.current) return;
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting && e.intersectionRatio >= 0.35);
      if (vis.length) onPage(Number((vis[0].target as HTMLElement).dataset.n));
    }, { threshold: [0, 0.35, 0.6] });
    const pages = Array.from(holder.current.querySelectorAll<HTMLElement>(".pg"));
    pages.forEach(el => io.observe(el));
    // Fallback: work out the page from the scroll position (binary search), throttled.
    let timer = 0;
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
    if (start > 1) setTimeout(() => holder.current?.querySelector(`[data-n="${Math.min(start, meta.pages)}"]`)?.scrollIntoView({ block: "start" }), 0);
    pump();
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [meta]);

  // Automatically mark page / topic as done after 5 to 6 seconds of viewing after successful loading
  useEffect(() => {
    if (!slug || hidden || !loadedPages.has(cur)) return;
    if (markedPages.current.has(cur)) return;
    const timer = setTimeout(async () => {
      if (markedPages.current.has(cur)) return;
      markedPages.current.add(cur);
      const nb = TOPICS[slug];
      const items: string[] = [];
      if (nb) for (const s of nb.sections || []) for (const it of s.items || []) if ((it.page || s.page) === cur) items.push(it.id);
      const explicitItem = cur === start ? sp.get("item") : null;
      const toMark = Array.from(new Set([...items, ...(explicitItem ? [explicitItem] : [])]));
      if (toMark.length > 0) {
        try {
          await api("/progress", "POST", { items: toMark, done: true });
          setStatusMsg(`✓ Page ${cur} marked as done`);
          setTimeout(() => setStatusMsg(""), 3500);
        } catch {}
      }
    }, 5500);
    return () => clearTimeout(timer);
  }, [cur, loadedPages, slug, hidden, start, sp]);

  /* ---------- search inside the document ---------- */
  useEffect(() => {
    if (!showSearch || !meta) return;
    const term = q.trim();
    if (!term) { setHits([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const r = await api(`/docs/${slug}/search?q=${encodeURIComponent(term)}`); setHits(r.results); setHitIdx(0); if (r.results[0]) setTimeout(() => goHit(r.results[0]), 30); }
      catch (e: any) { setErr(e.message); } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [q, showSearch, meta]);
  const hitMap = new Map(hits.map(h => [h.page, h]));
  const total = hits.reduce((s, h) => s + h.count, 0);
  // Scroll so the first highlighted word of a page sits just below the toolbar + search panel.
  const goHit = (h: Hit) => {
    const pg = holder.current?.querySelector<HTMLElement>(`[data-n="${h.page}"]`); if (!pg) return;
    const top = pg.getBoundingClientRect().top + window.scrollY + (h.rects[0] ? (h.rects[0][1] / 1000) * pg.offsetHeight : 0);
    const covered = (document.querySelector(".reader-bar")?.getBoundingClientRect().bottom || 0) + (document.querySelector(".search-panel")?.getBoundingClientRect().height || 0);
    window.scrollTo({ top: Math.max(0, top - covered - 24) });
  };
  const stepHit = (d: number) => { if (!hits.length) return; const i = (hitIdx + d + hits.length) % hits.length; setHitIdx(i); goHit(hits[i]); };

  // Deterrents: no context menu, no save/print shortcuts, hide content when the tab is not focused or printing.
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
    <div className="reader-bar">
      <Link to="/" className="btn sm" aria-label="Back to track sheet">←<span className="hide-sm"> Track sheet</span></Link>
      <b className="reader-title">{meta?.title || "Opening..."}</b>
      {statusMsg && <span className="reader-pill">{statusMsg}</span>}
      {meta && <>
        <button className="sm" onClick={() => go(cur - 1)} aria-label="Previous page">‹</button>
        <label className="row small nowrap"><span className="hide-sm">Page</span> <input className="page-input" type="number" min={1} max={meta.pages} value={cur} onChange={e => { const n = Number(e.target.value); if (n >= 1 && n <= meta.pages) go(n); }} aria-label="Go to page" /> / {meta.pages}</label>
        <button className="sm" onClick={() => go(cur + 1)} aria-label="Next page">›</button>
        <button className="sm hide-sm" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.15).toFixed(2)))} aria-label="Zoom out">−</button>
        <button className="sm hide-sm" onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))} aria-label="Zoom in">+</button>
        <button className={`sm ${showSearch ? "primary" : ""}`} onClick={() => { setShowSearch(s => !s); setTimeout(() => document.getElementById("doc-search")?.focus(), 30); }} aria-label="Search in document">🔍<span className="hide-sm"> Search</span></button>
        <a className="btn sm hide-sm" href={`https://ik.imagekit.io/likhi/resources-portal/pdfs/${slug}.pdf`} target="_blank" rel="noopener noreferrer" title="Direct PDF via ImageKit">📥 PDF</a>
        {pct < 100 && <span className="small muted hide-sm" title="Pages ready for instant scrolling">{pct}% loaded</span>}
      </>}
    </div>
    {showSearch && meta && <div className="search-panel">
      <div className="row">
        <input id="doc-search" placeholder={meta.searchable ? "Search a word or characters..." : "Search is not available for this document yet"} disabled={!meta.searchable}
          value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === "Enter") stepHit(e.shiftKey ? -1 : 1); if (e.key === "Escape") setShowSearch(false); }} aria-label="Search text" />
        <span className="small muted nowrap">{searching ? "Searching..." : q.trim() ? `${total} match${total === 1 ? "" : "es"} on ${hits.length} page${hits.length === 1 ? "" : "s"}` : ""}</span>
        <button className="sm" onClick={() => stepHit(-1)} disabled={!hits.length} aria-label="Previous match">▲</button>
        <button className="sm" onClick={() => stepHit(1)} disabled={!hits.length} aria-label="Next match">▼</button>
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
          <div className="wm">{user?.email}</div><span className="no">{n}</span>
        </div>)}
    </div>
    {hidden && <div className="shield"><div><h2>Protected document</h2><p>Return to this tab to continue reading.</p></div></div>}
  </>;
}
