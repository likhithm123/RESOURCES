// Protected viewer. The browser never receives a PDF: each page arrives as AES-GCM encrypted image bytes,
// is decrypted in memory and painted onto a canvas. Right-click, save, print and text selection are disabled,
// and every page carries the reader's email as a watermark.
import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "./api";
import { useAuth, Msg } from "./App";
import topicsJson from "../shared/topics.json";

const TOPICS = topicsJson as Record<string, { slug: string; sections: { id: string; title: string; page?: number; items: { id: string; title: string; page?: number }[] }[] }>;
const RATIO = 1110 / 794;          // notebook page height / width
const KEEP = 10;                   // painted pages kept in memory

export default function Reader() {
  const { slug } = useParams(); const [sp] = useSearchParams(); const { user } = useAuth();
  const [meta, setMeta] = useState<{ token: string; pages: number; title: string } | null>(null);
  const [err, setErr] = useState(""); const [zoom, setZoom] = useState(1); const [cur, setCur] = useState(1); const [hidden, setHidden] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const markedPages = useRef<Set<number>>(new Set());
  const key = useRef<CryptoKey | null>(null); const holder = useRef<HTMLDivElement>(null);
  const painted = useRef<number[]>([]); const loading = useRef(new Set<number>());
  const start = Math.max(1, Number(sp.get("page")) || 1);

  useEffect(() => {
    let off = false;
    api(`/docs/${slug}/open`, "POST", {}).then(async r => {
      if (off) return;
      key.current = await crypto.subtle.importKey("raw", Uint8Array.from(atob(r.key), c => c.charCodeAt(0)), "AES-GCM", false, ["decrypt"]);
      setMeta(r);
    }).catch(e => setErr(e.message));
    return () => { off = true; };
  }, [slug]);

  async function paint(n: number) {
    const canvas = holder.current?.querySelector<HTMLCanvasElement>(`canvas[data-p="${n}"]`);
    if (!meta || !canvas || canvas.dataset.ok || loading.current.has(n)) return;
    loading.current.add(n);
    try {
      const res = await fetch(`/api/view/${meta.token}/${n}`, { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Could not load page");
      const buf = new Uint8Array(await res.arrayBuffer());
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, key.current!, buf.slice(12));
      const bmp = await createImageBitmap(new Blob([plain], { type: "image/jpeg" }));
      canvas.width = bmp.width; canvas.height = bmp.height;
      canvas.getContext("2d")!.drawImage(bmp, 0, 0); bmp.close();
      canvas.dataset.ok = "1";
      painted.current.push(n);
      setLoadedPages(s => new Set(s).add(n));
      if (painted.current.length > KEEP) {                          // free the page painted longest ago
        const old = painted.current.shift()!;
        const c = holder.current?.querySelector<HTMLCanvasElement>(`canvas[data-p="${old}"]`);
        if (c) { c.width = c.height = 1; delete c.dataset.ok; }
      }
    } catch (e: any) { setErr(e.message); } finally { loading.current.delete(n); }
  }

  // Paint pages as they scroll into view; jump to ?page= on open.
  useEffect(() => {
    if (!meta || !holder.current) return;
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const n = Number((en.target as HTMLElement).dataset.n); setCur(c => (en.intersectionRatio > 0.4 ? n : c)); paint(n);
    }), { rootMargin: "600px 0px", threshold: [0, 0.4] });
    holder.current.querySelectorAll(".pg").forEach(el => io.observe(el));
    const target = holder.current.querySelector(`[data-n="${Math.min(start, meta.pages)}"]`);
    if (target && start > 1) setTimeout(() => target.scrollIntoView({ block: "start" }), 50);
    return () => io.disconnect();
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
      if (nb) {
        for (const s of nb.sections || []) {
          for (const it of s.items || []) {
            if ((it.page || s.page) === cur) items.push(it.id);
          }
        }
      }
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

  // Deterrents: no context menu, no save/print shortcuts, hide content when the tab is not focused or printing.
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
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
  return <>
    <div className="reader-bar">
      <Link to="/" className="btn sm">← Track sheet</Link>
      <b style={{ flex: 1, minWidth: 140 }}>{meta?.title || "Opening..."}</b>
      {statusMsg && <span className="reader-pill">{statusMsg}</span>}
      {meta && <>
        <button className="sm" onClick={() => go(cur - 1)} aria-label="Previous page">‹</button>
        <label className="row small">Page <input style={{ width: 70 }} type="number" min={1} max={meta.pages} value={cur} onChange={e => { const n = Number(e.target.value); setCur(n); go(n); }} aria-label="Go to page" /> of {meta.pages}</label>
        <button className="sm" onClick={() => go(cur + 1)} aria-label="Next page">›</button>
        <button className="sm" onClick={() => setZoom(z => Math.max(0.6, +(z - 0.15).toFixed(2)))} aria-label="Zoom out">−</button>
        <button className="sm" onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))} aria-label="Zoom in">+</button>
      </>}
    </div>
    <div className="reader" ref={holder}>
      {err && <div style={{ maxWidth: 600, margin: "auto" }}><Msg>{err}</Msg></div>}
      {meta && Array.from({ length: meta.pages }, (_, i) => i + 1).map(n =>
        <div className="pg" key={n} data-n={n} style={{ width: `min(${width}px, 100%)`, aspectRatio: `${1 / RATIO}` }}>
          <canvas data-p={n} aria-label={`Page ${n}`} />
          <div className="wm">{user?.email}</div><span className="no">{n}</span>
        </div>)}
    </div>
    {hidden && <div className="shield"><div><h2>Protected document</h2><p>Return to this tab to continue reading.</p></div></div>}
  </>;
}
