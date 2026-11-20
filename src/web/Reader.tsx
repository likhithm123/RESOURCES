// Protected viewer. The browser receives a secured binary stream rendered into memory canvases via PDF.js.
// Right-click, save, print and text selection are disabled, and every page carries the reader's email watermark.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "./api";
import { useAuth, Msg } from "./App";
import topicsJson from "../shared/topics.json";

const TOPICS = topicsJson as Record<string, { slug: string; sections: { id: string; title: string; page?: number; masterPage?: number; items: { id: string; title: string; page?: number; masterPage?: number }[] }[] }>;
const RATIO = 1110 / 794;                         // standard notebook aspect ratio
const MOBILE = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
const PAINT_RADIUS = MOBILE ? 2 : 4;               // canvases kept painted around current page

type Hit = {
  page: number;
  count: number;
  snippetPrefix: string;
  snippetMatch: string;
  snippetSuffix: string;
};

export default function Reader() {
  const { slug } = useParams(); const [sp] = useSearchParams(); const { user } = useAuth();
  const [meta, setMeta] = useState<{ token: string; pages: number; title: string; searchable: boolean; email?: string } | null>(null);
  const [err, setErr] = useState(""); const [zoom, setZoom] = useState(1); const [cur, setCur] = useState(1); const [hidden, setHidden] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [downloadPct, setDownloadPct] = useState(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [showSearch, setShowSearch] = useState(false); const [q, setQ] = useState(""); const [hits, setHits] = useState<Hit[]>([]);
  const [hitIdx, setHitIdx] = useState(0); const [searching, setSearching] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  const textCacheRef = useRef<Map<number, string>>(new Map());
  const searchIdRef = useRef(0);
  const markedPages = useRef<Set<number>>(new Set());
  const holder = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const curRef = useRef(1); const alive = useRef(true);
  const itemParam = sp.get("item");
  const rawPage = Number(sp.get("page"));
  const start = (() => {
    if (itemParam && slug) {
      const isMaster = slug.endsWith("-master") || slug.endsWith("-long");
      const baseSlug = slug.replace(/-(master|long)$/, "");
      const nb = (TOPICS as any)[baseSlug] || (TOPICS as any)[slug];
      if (nb) {
        for (const sec of nb.sections || []) {
          if (sec.id === itemParam) {
            const p = isMaster ? (sec.masterPage || sec.page) : (sec.page || sec.masterPage);
            if (p) return p;
          }
          for (const it of sec.items || []) {
            if (it.id === itemParam) {
              const p = isMaster ? (it.masterPage || sec.masterPage || it.page || sec.page) : (it.page || sec.page || it.masterPage || sec.masterPage);
              if (p) return p;
            }
          }
        }
      }
    }
    return rawPage > 0 ? rawPage : 1;
  })();
  const renderingRef = useRef<Set<number>>(new Set());

  useEffect(() => { document.body.classList.add("reading"); return () => document.body.classList.remove("reading"); }, []);

  // Fetch document token and stream PDF binary
  useEffect(() => {
    alive.current = true;
    renderingRef.current.clear();
    textCacheRef.current.clear();
    setPdfReady(false);
    setHits([]);
    setDownloadPct(10);

    api(`/docs/${slug}/open`, "POST", {}).then(async r => {
      if (!alive.current) return;
      setMeta(r);
      curRef.current = Math.min(start, r.pages);
      setCur(curRef.current);

      try {
        const res = await fetch(`/api/view-pdf/${r.token}`, { credentials: "same-origin" });
        if (!res.ok) throw new Error("Could not load secure document stream.");
        
        const contentLength = +(res.headers.get("Content-Length") || 0);
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        if (res.body) {
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            if (contentLength > 0) {
              setDownloadPct(Math.min(95, Math.round((receivedLength / contentLength) * 100)));
            }
          }
        }
        
        const fullBuffer = new Uint8Array(receivedLength);
        let pos = 0;
        for (const chunk of chunks) {
          fullBuffer.set(chunk, pos);
          pos += chunk.length;
        }
        setDownloadPct(100);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        const pdf = await pdfjs.getDocument({ data: fullBuffer, isEvalSupported: false } as any).promise;
        if (!alive.current) return;
        pdfDocRef.current = pdf;
        setPdfReady(true);

        // Render initial view
        renderAround(curRef.current);
      } catch (x: any) {
        if (alive.current) setErr(x.message || "Failed to initialize secure viewer.");
      }
    }).catch(e => {
      if (alive.current) setErr(e.message);
    });

    return () => {
      alive.current = false;
      setPdfReady(false);
      if (pdfDocRef.current) {
        try { pdfDocRef.current.destroy(); } catch {}
      }
    };
  }, [slug]);

  /* ---------- Page Canvas Rendering via PDF.js ---------- */
  const canvasOf = (n: number) => holder.current?.querySelector<HTMLCanvasElement>(`canvas[data-p="${n}"]`);

  async function renderPage(n: number) {
    const pdf = pdfDocRef.current;
    if (!pdf || !alive.current || renderingRef.current.has(n)) return;
    const canvas = canvasOf(n);
    if (!canvas || canvas.dataset.ok) return;

    renderingRef.current.add(n);
    try {
      const page = await pdf.getPage(n);
      const targetWidth = Math.min(window.innerWidth - 32, 820 * zoom);
      const unscaledViewport = page.getViewport({ scale: 1 });
      const scale = (targetWidth / unscaledViewport.width) * (window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport } as any).promise;

      // Subtle security watermark: reader email
      const email = user?.email || meta?.email;
      if (email && email !== "guest@portal.local") {
        ctx.save();
        ctx.font = `${Math.max(14, Math.round(viewport.width / 42))}px system-ui, sans-serif`;
        ctx.fillStyle = "rgba(27, 63, 174, 0.06)";
        ctx.translate(viewport.width / 2, viewport.height / 2);
        ctx.rotate(-Math.PI / 6);
        ctx.textAlign = "center";
        ctx.fillText(email, 0, 0);
        ctx.restore();
      }

      canvas.dataset.ok = "1";
      canvas.parentElement?.classList.add("ready");
      setLoadedPages(s => (s.has(n) ? s : new Set(s).add(n)));
    } catch {
      delete canvas.dataset.ok;
    } finally {
      renderingRef.current.delete(n);
    }
  }

  function releasePage(n: number) {
    const canvas = canvasOf(n);
    if (canvas?.dataset.ok) {
      canvas.width = canvas.height = 1;
      delete canvas.dataset.ok;
      canvas.parentElement?.classList.remove("ready");
    }
  }

  function renderAround(n: number) {
    if (!pdfDocRef.current) return;
    const total = meta?.pages || pdfDocRef.current.numPages;
    for (let p = Math.max(1, n - PAINT_RADIUS); p <= Math.min(total, n + PAINT_RADIUS); p++) {
      renderPage(p);
    }
    // Release distant canvases to keep memory light
    holder.current?.querySelectorAll<HTMLCanvasElement>("canvas[data-ok]").forEach(c => {
      const p = Number(c.dataset.p);
      if (Math.abs(p - n) > PAINT_RADIUS + 3) releasePage(p);
    });
  }

  function onPage(n: number) {
    curRef.current = n;
    setCur(n);
    renderAround(n);
  }

  // Scroll detection & viewport observer
  useEffect(() => {
    if (!meta || !holder.current) return;
    const io = new IntersectionObserver(entries => {
      const vis = entries.filter(e => e.isIntersecting && e.intersectionRatio >= 0.3);
      if (vis.length) onPage(Number((vis[0].target as HTMLElement).dataset.n));
    }, { threshold: [0, 0.3, 0.6] });

    const pages = Array.from(holder.current.querySelectorAll<HTMLElement>(".pg"));
    pages.forEach(el => io.observe(el));

    let timer = 0;
    const onScroll = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const mid = window.innerHeight * 0.4;
        let lo = 0, hi = pages.length - 1;
        while (lo < hi) {
          const m = (lo + hi + 1) >> 1;
          if (pages[m].getBoundingClientRect().top <= mid) lo = m;
          else hi = m - 1;
        }
        const n = lo + 1;
        if (n !== curRef.current) onPage(n);
      }, 100);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    let t1: any, t2: any, t3: any;
    if (start > 1) {
      const target = Math.min(start, meta.pages);
      const scrollToTarget = () => {
        const el = holder.current?.querySelector<HTMLElement>(`[data-n="${target}"]`);
        if (el) el.scrollIntoView({ block: "start" });
      };
      scrollToTarget();
      t1 = setTimeout(scrollToTarget, 50);
      t2 = setTimeout(scrollToTarget, 150);
      t3 = setTimeout(scrollToTarget, 400);
    }
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [meta, zoom]);

  // 10-Second reading timer: marks page / topics as completed
  useEffect(() => {
    if (!slug || hidden || !loadedPages.has(cur)) return;
    if (markedPages.current.has(cur)) return;

    const timer = setTimeout(async () => {
      if (markedPages.current.has(cur)) return;
      markedPages.current.add(cur);

      const baseSlug = slug.replace(/-(master|long)$/, "");
      const isMaster = slug.endsWith("-master") || slug.endsWith("-long");
      const nb = (TOPICS as any)[baseSlug] || (TOPICS as any)[slug];
      const items: string[] = [];
      if (nb) {
        for (const s of nb.sections || []) {
          for (const it of s.items || []) {
            const p = isMaster ? (it.masterPage || s.masterPage || it.page || s.page) : (it.page || s.page || it.masterPage || s.masterPage);
            if (p === cur) items.push(it.id);
          }
        }
      }
      const explicitItem = cur === start ? sp.get("item") : null;
      const toMark = Array.from(new Set([...items, ...(explicitItem ? [explicitItem] : [])]));

      if (toMark.length > 0) {
        try {
          await api("/progress", "POST", { items: toMark, done: true });
          setStatusMsg(`Page ${cur} marked as read`);
          setTimeout(() => setStatusMsg(""), 3500);
        } catch {}
      }
    }, 10000); // Exactly 10 seconds of active reading

    return () => clearTimeout(timer);
  }, [cur, loadedPages, slug, hidden, start, sp]);

  /* ---------- In-document search via PDF.js text layer (Cached & Batched) ---------- */
  const runSearch = useCallback((term: string) => {
    const pdf = pdfDocRef.current;
    const currentId = ++searchIdRef.current;
    if (!term || !pdf) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);

    (async () => {
      const found: Hit[] = [];
      const BATCH_SIZE = 12;
      const numPages = pdf.numPages;

      for (let i = 1; i <= numPages; i += BATCH_SIZE) {
        if (searchIdRef.current !== currentId || !alive.current) return;
        const pageBatch: number[] = [];
        for (let p = i; p < Math.min(numPages + 1, i + BATCH_SIZE); p++) {
          pageBatch.push(p);
        }

        const texts = await Promise.all(
          pageBatch.map(async p => {
            const cached = textCacheRef.current.get(p);
            if (cached !== undefined) return cached;
            try {
              const page = await pdf.getPage(p);
              const tc = await page.getTextContent();
              const str = tc.items
                .map((it: any) => (it && typeof it.str === "string" ? it.str : ""))
                .join(" ")
                .replace(/\s+/g, " ")
                .trim();
              textCacheRef.current.set(p, str);
              return str;
            } catch {
              return "";
            }
          })
        );

        if (searchIdRef.current !== currentId || !alive.current) return;

        for (let idx = 0; idx < pageBatch.length; idx++) {
          const p = pageBatch[idx];
          const text = texts[idx];
          if (!text) continue;
          const lower = text.toLowerCase();
          let count = 0;
          let pos = 0;
          let firstIdx = -1;
          while ((pos = lower.indexOf(term, pos)) !== -1) {
            if (firstIdx === -1) firstIdx = pos;
            count++;
            pos += term.length;
          }
          if (count > 0 && firstIdx !== -1) {
            const sStart = Math.max(0, firstIdx - 35);
            const sEnd = Math.min(text.length, firstIdx + term.length + 45);
            found.push({
              page: p,
              count,
              snippetPrefix: (sStart > 0 ? "... " : "") + text.slice(sStart, firstIdx),
              snippetMatch: text.slice(firstIdx, firstIdx + term.length),
              snippetSuffix: text.slice(firstIdx + term.length, sEnd) + (sEnd < text.length ? " ..." : ""),
            });
          }
        }
      }

      if (searchIdRef.current === currentId && alive.current) {
        setHits(found);
        setHitIdx(0);
        setSearching(false);
        if (found.length > 0) {
          go(found[0].page);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!showSearch || !pdfReady) return;
    const term = q.trim().toLowerCase();
    if (!term) {
      setHits([]);
      setSearching(false);
      return;
    }
    const t = setTimeout(() => {
      runSearch(term);
    }, 200);

    return () => clearTimeout(t);
  }, [q, showSearch, pdfReady, runSearch]);

  const totalMatches = hits.reduce((s, h) => s + h.count, 0);
  const stepHit = (d: number) => {
    if (!hits.length) return;
    const i = (hitIdx + d + hits.length) % hits.length;
    setHitIdx(i);
    go(hits[i].page);
  };

  // Deterrents: no context menu, no save/print shortcuts, hide on tab blur
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "f") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => document.getElementById("doc-search")?.focus(), 30);
      }
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(k)) e.preventDefault();
      if (k === "printscreen") {
        setHidden(true);
        setTimeout(() => setHidden(false), 1500);
      }
    };
    const vis = () => setHidden(document.visibilityState !== "visible");
    const bp = () => setHidden(true), ap = () => setHidden(false);

    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("copy", block);
    window.addEventListener("keydown", keys);
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("beforeprint", bp);
    window.addEventListener("afterprint", ap);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("copy", block);
      window.removeEventListener("keydown", keys);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("beforeprint", bp);
      window.removeEventListener("afterprint", ap);
    };
  }, []);

  const go = (n: number) => {
    const targetPage = Math.max(1, Math.min(meta?.pages || 1, n));
    onPage(targetPage);
    holder.current?.querySelector(`[data-n="${targetPage}"]`)?.scrollIntoView({ block: "start" });
  };

  const width = Math.round(820 * zoom);
  const totalPages = meta?.pages || 1;
  const progressRatio = Math.max(downloadPct, Math.round((cur / totalPages) * 100));

  return <>
    {/* Slim top progress bar */}
    <div className="reader-progress-bar" style={{ width: `${progressRatio}%` }} />

    <div className="reader-bar">
      <Link to="/" className="btn sm" aria-label="Back to track sheet">Track sheet</Link>
      <b className="reader-title">{meta?.title || "Opening document..."}</b>
      {statusMsg && <span className="reader-pill">{statusMsg}</span>}
      {meta && <>
        <button className="sm" onClick={() => go(cur - 1)} disabled={cur <= 1} aria-label="Previous page">Prev</button>
        <div className="page-control">
          <span className="hide-sm">Page</span>
          <input
            className="page-input"
            type="number"
            min={1}
            max={meta.pages}
            value={cur}
            onChange={e => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= meta.pages) go(n);
            }}
            aria-label="Go to page"
          />
          <span>/ {meta.pages}</span>
        </div>
        <button className="sm" onClick={() => go(cur + 1)} disabled={cur >= meta.pages} aria-label="Next page">Next</button>
        <button className="sm hide-sm" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.15).toFixed(2)))} aria-label="Zoom out">−</button>
        <button className="sm hide-sm" onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))} aria-label="Zoom in">+</button>
        <button
          className={`sm ${showSearch ? "primary" : ""}`}
          onClick={() => {
            setShowSearch(s => {
              const next = !s;
              if (next) setTimeout(() => document.getElementById("doc-search")?.focus(), 40);
              return next;
            });
          }}
          aria-label="Search in document"
          title="Search in document (Ctrl+F)"
        >
          Search
        </button>
        {downloadPct < 100 && <span className="small muted hide-sm">{downloadPct}% loaded</span>}
      </>}
    </div>

    {showSearch && meta && (
      <div className="search-panel" role="search" aria-label="In-document search">
        <div className="search-bar-row">
          <input
            id="doc-search"
            placeholder="Search in this document..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (hits.length > 0) {
                  stepHit(e.shiftKey ? -1 : 1);
                } else {
                  const term = q.trim().toLowerCase();
                  if (term) runSearch(term);
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                setShowSearch(false);
              }
            }}
            aria-label="Search words in document"
            autoFocus
          />
          <div className="search-match-count">
            {searching ? (
              <span className="muted">Searching...</span>
            ) : q.trim() ? (
              hits.length > 0 ? (
                <span>
                  {hitIdx + 1} of {hits.length} pages ({totalMatches} match{totalMatches === 1 ? "" : "es"})
                </span>
              ) : (
                <span className="muted">No matches found</span>
              )
            ) : (
              <span className="muted">Type to search</span>
            )}
          </div>
          <button
            type="button"
            className="sm"
            onClick={() => stepHit(-1)}
            disabled={!hits.length}
            aria-label="Previous match"
            title="Previous match (Shift+Enter)"
          >
            Prev
          </button>
          <button
            type="button"
            className="sm"
            onClick={() => stepHit(1)}
            disabled={!hits.length}
            aria-label="Next match"
            title="Next match (Enter)"
          >
            Next
          </button>
          {q && (
            <button
              type="button"
              className="sm"
              onClick={() => { setQ(""); setHits([]); }}
              aria-label="Clear search input"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className="sm"
            onClick={() => { setShowSearch(false); setQ(""); setHits([]); }}
            aria-label="Close search"
          >
            Close
          </button>
        </div>

        {hits.length > 0 && (
          <div className="hits" aria-label="Search results list">
            {hits.map((h, i) => (
              <button
                key={h.page}
                type="button"
                className={`hit ${i === hitIdx ? "on" : ""}`}
                onClick={() => {
                  setHitIdx(i);
                  go(h.page);
                }}
              >
                <b>Page {h.page}</b>
                <span className="hit-count">
                  ({h.count} match{h.count === 1 ? "" : "es"})
                </span>
                <span className="hit-snippet">
                  {h.snippetPrefix}
                  <mark className="snippet-hl">{h.snippetMatch}</mark>
                  {h.snippetSuffix}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    )}

    <div className="reader" ref={holder}>
      {err && <div style={{ maxWidth: 600, margin: "auto" }}><Msg>{err}</Msg></div>}
      {meta && Array.from({ length: meta.pages }, (_, i) => i + 1).map(n =>
        <div className="pg" key={n} data-n={n} style={{ width: `min(${width}px, 100%)`, aspectRatio: `${1 / RATIO}` }}>
          <canvas data-p={n} aria-label={`Page ${n}`} />
          <div className="pg-wait">Loading page {n}...</div>
          <span className="no">{n}</span>
        </div>
      )}
    </div>

    {hidden && <div className="shield"><div><h2>Protected document</h2><p>Return to this tab to continue reading.</p></div></div>}
  </>;
}
