/* Handwritten notebook renderer: parses the note markup, draws sketchy
   diagrams with rough.js and paginates everything onto ruled pages. */
(function () {
  const LINE = 30;            // px, one ruled line
  const PAGE_H = 37 * LINE;   // 1110px
  const TOP = 5 * LINE;       // first writing line
  const BOTTOM = 36 * LINE;   // last usable y
  const CW = 610;             // content width px
  const BLUE = '#1b3fae', BLACK = '#161616';
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = s => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<span class="ic">$1</span>');

  const mctx = document.createElement('canvas').getContext('2d');
  function tw(t, size, bold) { mctx.font = `${bold ? 700 : 400} ${size}px Kalam`; return mctx.measureText(t).width; }
  function wrap(t, maxW, size) {
    const out = []; let cur = '';
    for (const w of String(t).split(/\s+/)) {
      const n = cur ? cur + ' ' + w : w;
      if (tw(n, size) > maxW && cur) { out.push(cur); cur = w; } else cur = n;
    }
    if (cur) out.push(cur);
    return out.length ? out : [''];
  }

  // ---------- SVG helpers ----------
  const NS = 'http://www.w3.org/2000/svg';
  function mk(w, h) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return { svg, rc: rough.svg(svg), w, h };
  }
  const RO = (o = {}) => Object.assign({ stroke: BLACK, strokeWidth: 1.3, roughness: 1.1, bowing: 1, seed: 1 + Math.floor(rnd() * 9999) }, o);
  function text(c, x, y, t, o = {}) {
    const e = document.createElementNS(NS, 'text');
    e.setAttribute('x', x); e.setAttribute('y', y);
    e.setAttribute('text-anchor', o.anchor || 'middle');
    e.setAttribute('font-size', o.size || 16);
    e.setAttribute('fill', o.fill || BLUE);
    e.setAttribute('font-family', 'Kalam');
    if (o.bold) e.setAttribute('font-weight', 700);
    e.textContent = t; c.svg.appendChild(e);
  }
  function mtext(c, cx, cy, lines, o = {}) {
    const lh = (o.size || 16) + 3;
    lines.forEach((l, i) => text(c, cx, cy - (lines.length - 1) * lh / 2 + i * lh + 5, l, o));
  }
  function arrow(c, x1, y1, x2, y2, o = {}) {
    c.svg.appendChild(c.rc.line(x1, y1, x2, y2, RO({ stroke: o.stroke || BLACK })));
    if (o.nohead) return;
    const a = Math.atan2(y2 - y1, x2 - x1), L = 9;
    for (const d of [-0.45, 0.45])
      c.svg.appendChild(c.rc.line(x2, y2, x2 - L * Math.cos(a + d), y2 - L * Math.sin(a + d), RO({ roughness: 0.5, stroke: o.stroke || BLACK })));
  }
  const hl = { fill: 'rgba(27,63,174,0.22)', fillStyle: 'hachure', hachureGap: 5, fillWeight: 0.8 };

  // ---------- diagrams ----------
  function dFlow(arg) {
    const items = arg.split(/\s+\|\s+/).map(s => s.trim()).filter(Boolean);
    const nodes = items.map(raw => {
      let loop = false, t = raw, shape = 'rect', side = null;
      if (t[0] === '^') { loop = true; t = t.slice(1).trim(); }
      if (/^\(.*\)$/.test(t)) { shape = 'oval'; t = t.slice(1, -1); }
      else if (/^<.*>$/.test(t)) { shape = 'dia'; t = t.slice(1, -1); const p = t.split(/\s+~\s+/); t = p[0]; side = p[1] || null; }
      else if (/^\/.*\/$/.test(t)) { shape = 'io'; t = t.slice(1, -1); }
      else if (/^\[.*\]$/.test(t)) t = t.slice(1, -1);
      const lines = wrap(t, shape === 'dia' ? 150 : 230, 15);
      const w = Math.max(...lines.map(l => tw(l, 15))) + (shape === 'dia' ? 90 : 34);
      const h = lines.length * 18 + (shape === 'dia' ? 34 : 16);
      return { t, shape, side, loop, lines, w: Math.max(w, 90), h };
    });
    const gap = 26, cx = 250;
    let y = 6; nodes.forEach(n => { n.y = y; y += n.h + gap; });
    const H = Math.ceil((y - gap + 8) / LINE) * LINE;
    const c = mk(CW, H);
    let lastDia = null;
    nodes.forEach((n, i) => {
      const x = cx - n.w / 2, my = n.y + n.h / 2;
      if (n.shape === 'oval') c.svg.appendChild(c.rc.ellipse(cx, my, n.w + 10, n.h + 6, RO()));
      else if (n.shape === 'dia') c.svg.appendChild(c.rc.polygon([[cx, n.y - 2], [x + n.w, my], [cx, n.y + n.h + 2], [x, my]], RO()));
      else if (n.shape === 'io') c.svg.appendChild(c.rc.polygon([[x + 12, n.y], [x + n.w + 6, n.y], [x + n.w - 12, n.y + n.h], [x - 6, n.y + n.h]], RO()));
      else c.svg.appendChild(c.rc.rectangle(x, n.y, n.w, n.h, RO()));
      mtext(c, cx, my, n.lines, { size: 15 });
      if (n.shape === 'dia') {
        lastDia = n;
        if (n.side) {
          let st = n.side, so = false;
          if (/^\(.*\)$/.test(st)) { so = true; st = st.slice(1, -1); }
          const sl = wrap(st, 150, 15), sw = Math.max(...sl.map(l => tw(l, 15))) + 26, sh = sl.length * 18 + 14;
          const sx = Math.min(x + n.w + 62, CW - sw - 4);
          arrow(c, x + n.w + 2, my, sx - 3, my);
          text(c, x + n.w + 26, my - 6, 'No', { size: 13, fill: BLACK });
          if (so) c.svg.appendChild(c.rc.ellipse(sx + sw / 2, my, sw + 6, sh + 4, RO()));
          else c.svg.appendChild(c.rc.rectangle(sx, my - sh / 2, sw, sh, RO()));
          mtext(c, sx + sw / 2, my, sl, { size: 15 });
        }
      }
      if (n.loop && lastDia) {
        const lx = Math.min(x, cx - lastDia.w / 2) - 34, dy = lastDia.y + lastDia.h / 2;
        c.svg.appendChild(c.rc.line(x, my, lx, my, RO()));
        c.svg.appendChild(c.rc.line(lx, my, lx, dy, RO()));
        arrow(c, lx, dy, cx - lastDia.w / 2 - 3, dy);
        text(c, lx - 4, (my + dy) / 2, 'loop', { size: 13, fill: BLACK, anchor: 'end' });
      } else if (i < nodes.length - 1) {
        arrow(c, cx, n.y + n.h + 3, cx, nodes[i + 1].y - 4);
        if (n.shape === 'dia') text(c, cx + 8, n.y + n.h + 18, 'Yes', { size: 13, fill: BLACK, anchor: 'start' });
      }
    });
    return c.svg;
  }

  function dChain(arg) {
    const parts = arg.split(/\s*(<->|->)\s*/);
    const boxes = [], links = [];
    parts.forEach((p, i) => (i % 2 ? links : boxes).push(p));
    const B = boxes.map(t => {
      const star = /\*$/.test(t); if (star) t = t.slice(0, -1);
      const lines = wrap(t, 120, 15);
      return { lines, star, w: Math.max(...lines.map(l => tw(l, 15))) + 24, h: lines.length * 18 + 16 };
    });
    const gap = 38; let x = 4, row = 0; const rows = [[]];
    B.forEach(b => { if (x + b.w > CW - 4 && rows[row].length) { row++; rows[row] = []; x = 30; } b.x = x; b.row = row; rows[row].push(b); x += b.w + gap; });
    const rh = rows.map(r => Math.max(...r.map(b => b.h)));
    let y = 6; const ry = rh.map(h => { const v = y; y += h + 26; return v; });
    const H = Math.ceil((y - 14) / LINE) * LINE;
    const c = mk(CW, H);
    B.forEach((b, i) => {
      const cy = ry[b.row] + rh[b.row] / 2;
      b.cy = cy;
      c.svg.appendChild(c.rc.rectangle(b.x, cy - b.h / 2, b.w, b.h, RO(b.star ? hl : {})));
      mtext(c, b.x + b.w / 2, cy, b.lines, { size: 15 });
      if (i > 0) {
        const p = B[i - 1];
        if (p.row === b.row) {
          arrow(c, p.x + p.w + 4, cy, b.x - 4, cy);
          if (links[i - 1] === '<->') arrow(c, b.x - 4, cy, p.x + p.w + 4, cy);
        } else {
          const my = p.cy + rh[p.row] / 2 + 12;
          c.svg.appendChild(c.rc.line(p.x + p.w / 2, p.cy + p.h / 2 + 2, p.x + p.w / 2, my, RO()));
          c.svg.appendChild(c.rc.line(p.x + p.w / 2, my, 14, my, RO()));
          c.svg.appendChild(c.rc.line(14, my, 14, cy, RO()));
          arrow(c, 14, cy, b.x - 4, cy);
        }
      }
    });
    return c.svg;
  }

  function parseCell(t) {
    let ptr = null, star = false;
    const m = t.match(/^(.*?)\^(.+)$/); if (m) { t = m[1]; ptr = m[2]; }
    if (/\*$/.test(t)) { star = true; t = t.slice(0, -1); }
    return { t: t === '_' ? '' : t, ptr, star };
  }
  function dArray(arg, noIdx) {
    const cells = arg.trim().split(/\s+/).map(parseCell);
    const cw = Math.min(56, Math.max(34, ...cells.map(k => tw(k.t, 16) + 18)));
    const total = cw * cells.length, x0 = Math.max(4, (CW - total) / 2 - 40);
    const anyPtr = cells.some(k => k.ptr);
    const H = Math.ceil((34 + (noIdx ? 6 : 20) + (anyPtr ? 36 : 0) + 8) / LINE) * LINE;
    const c = mk(CW, H);
    cells.forEach((k, i) => {
      const x = x0 + i * cw;
      c.svg.appendChild(c.rc.rectangle(x, 4, cw, 32, RO(k.star ? hl : {})));
      text(c, x + cw / 2, 26, k.t, { size: 16 });
      if (!noIdx) text(c, x + cw / 2, 52, String(i), { size: 12, fill: BLACK });
      if (k.ptr) { const b = noIdx ? 40 : 56; arrow(c, x + cw / 2, b + 22, x + cw / 2, b + 2); text(c, x + cw / 2, b + 36, k.ptr, { size: 13, fill: BLACK }); }
    });
    return c.svg;
  }
  function dGrid(arg) {
    const rows = arg.split('/').map(r => r.trim().split(/\s+/).map(parseCell));
    const cw = Math.min(60, Math.max(34, ...rows.flat().map(k => tw(k.t, 15) + 16))), ch = 30;
    const n = Math.max(...rows.map(r => r.length));
    const x0 = Math.max(4, (CW - cw * n) / 2 - 40);
    const H = Math.ceil((rows.length * ch + 12) / LINE) * LINE;
    const c = mk(CW, H);
    rows.forEach((r, i) => r.forEach((k, j) => {
      c.svg.appendChild(c.rc.rectangle(x0 + j * cw, 4 + i * ch, cw, ch, RO(k.star ? hl : {})));
      text(c, x0 + j * cw + cw / 2, 4 + i * ch + 21, k.t, { size: 15 });
    }));
    return c.svg;
  }
  function dStack(arg) {
    const cells = arg.trim().split(/\s+/).map(parseCell);
    const cw = Math.max(70, ...cells.map(k => tw(k.t, 15) + 24)), ch = 28;
    const H = Math.ceil((cells.length * ch + 14) / LINE) * LINE;
    const c = mk(CW, H); const x0 = 150;
    cells.forEach((k, i) => {
      c.svg.appendChild(c.rc.rectangle(x0, 4 + i * ch, cw, ch, RO(k.star ? hl : {})));
      text(c, x0 + cw / 2, 4 + i * ch + 20, k.t, { size: 15 });
      if (k.ptr || i === 0) { arrow(c, x0 + cw + 46, 4 + i * ch + ch / 2, x0 + cw + 6, 4 + i * ch + ch / 2); text(c, x0 + cw + 52, 4 + i * ch + 20, k.ptr || 'top', { size: 14, fill: BLACK, anchor: 'start' }); }
    });
    return c.svg;
  }

  function parseTree(s) {
    let i = 0;
    function node() {
      let lab = '';
      while (i < s.length && !'(),'.includes(s[i])) lab += s[i++];
      lab = lab.trim();
      const n = lab ? { lab, kids: [] } : null;
      if (s[i] === '(') {
        i++;
        for (;;) { const k = node(); (n || {kids:[]}).kids.push(k); if (s[i] === ',') { i++; continue; } if (s[i] === ')') { i++; break; } if (i >= s.length) break; }
      }
      return n;
    }
    return node();
  }
  function dTree(arg) {
    const root = parseTree(arg.trim());
    let leaf = 0, depth = 0;
    (function lay(n, d) {
      if (!n) return;
      n.d = d; depth = Math.max(depth, d);
      const ks = n.kids;
      if (!ks.some(Boolean)) { n.x = leaf++; return; }
      ks.forEach((k, idx) => { if (k) lay(k, d + 1); else if (ks.length > 1) leaf += 0.5; });
      const real = ks.filter(Boolean);
      n.x = real.length === 1 && ks.length === 2 ? real[0].x + (ks[0] ? 0.5 : -0.5) : (real[0].x + real[real.length - 1].x) / 2;
    })(root, 0);
    const sx = Math.min(64, (CW - 120) / Math.max(leaf, 1)), sy = 54, r = 17;
    const H = Math.ceil((depth * sy + 2 * r + 14) / LINE) * LINE;
    const c = mk(CW, H);
    const ox = Math.max(30, (CW - sx * (leaf - 1)) / 2 - 40), px = n => ox + n.x * sx, py = n => r + 6 + n.d * sy;
    (function draw(n) {
      if (!n) return;
      n.kids.forEach(k => { if (k) { c.svg.appendChild(c.rc.line(px(n), py(n) + r - 2, px(k), py(k) - r + 2, RO())); draw(k); } });
      let lab = n.lab, star = false; if (/\*$/.test(lab)) { star = true; lab = lab.slice(0, -1); }
      const w = Math.max(2 * r, tw(lab, 15) + 14);
      c.svg.appendChild(c.rc.ellipse(px(n), py(n), w, 2 * r, RO(Object.assign({ fill: '#fbfaf3', fillStyle: 'solid' }, star ? hl : {}))));
      text(c, px(n), py(n) + 5, lab, { size: 15 });
    })(root);
    return c.svg;
  }

  function dGraph(arg) {
    const edges = [], names = [];
    arg.trim().split(/\s+/).forEach(tok => {
      const m = tok.match(/^([^->:]+)(-|>)([^->:]+)(?::(.+))?$/);
      if (!m) { if (!names.includes(tok)) names.push(tok); return; }
      [m[1], m[3]].forEach(v => { if (!names.includes(v)) names.push(v); });
      edges.push({ a: m[1], b: m[3], dir: m[2] === '>', w: m[4] });
    });
    const n = names.length, R = Math.min(150, 50 + n * 13), r = 17;
    const H = Math.ceil((2 * R + 2 * r + 20) / LINE) * LINE;
    const c = mk(CW, H); const cx = 250, cy = H / 2;
    const pos = {};
    names.forEach((v, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pos[v] = [cx + R * 1.35 * Math.cos(a), cy + R * Math.sin(a)]; });
    edges.forEach(e => {
      const [x1, y1] = pos[e.a], [x2, y2] = pos[e.b], a = Math.atan2(y2 - y1, x2 - x1);
      const sx = x1 + (r + 2) * Math.cos(a), sy = y1 + (r + 2) * Math.sin(a), ex = x2 - (r + 3) * Math.cos(a), ey = y2 - (r + 3) * Math.sin(a);
      arrow(c, sx, sy, ex, ey, { nohead: !e.dir });
      if (e.w) text(c, (sx + ex) / 2 + 9 * Math.sin(a), (sy + ey) / 2 - 9 * Math.cos(a) + 4, e.w, { size: 13, fill: BLACK });
    });
    names.forEach(v => {
      let lab = v, star = false; if (/\*$/.test(lab)) { star = true; lab = lab.slice(0, -1); }
      c.svg.appendChild(c.rc.ellipse(pos[v][0], pos[v][1], Math.max(2 * r, tw(lab, 15) + 14), 2 * r, RO(Object.assign({ fill: '#fbfaf3', fillStyle: 'solid' }, star ? hl : {}))));
      text(c, pos[v][0], pos[v][1] + 5, lab, { size: 15 });
    });
    return c.svg;
  }

  function dLayers(arg) {
    const rows = arg.split(/\s+\|\s+/).map(r => { const parts = r.split(/\s*,\s*/); const ww = Math.max(56, Math.min(130, (CW - 30) / parts.length - 48)); return parts.map(t => { const lines = wrap(t.trim(), ww, 15); return { lines, w: Math.max(...lines.map(l => tw(l, 15))) + 20, h: lines.length * 18 + 16 }; }); });
    let y = 6; const gap = 28;
    rows.forEach(r => { const h = Math.max(...r.map(b => b.h)); const tot = r.reduce((s, b) => s + b.w, 0) + (r.length - 1) * 22; const gp = Math.max(6, Math.min(22, (CW - 8 - r.reduce((s, b) => s + b.w, 0)) / Math.max(1, r.length - 1))); const tot2 = r.reduce((s, b) => s + b.w, 0) + (r.length - 1) * gp; let x = Math.max(4, (CW - 80 - tot2) / 2); r.forEach(b => { b.x = x; b.y = y; b.h = h; x += b.w + gp; }); r.y = y; r.h = h; y += h + gap; });
    const H = Math.ceil((y - gap + 8) / LINE) * LINE;
    const c = mk(CW, H);
    rows.forEach((r, i) => {
      r.forEach(b => { c.svg.appendChild(c.rc.rectangle(b.x, b.y, b.w, b.h, RO())); mtext(c, b.x + b.w / 2, b.y + b.h / 2, b.lines, { size: 15 }); });
      if (i < rows.length - 1) {
        const nx = rows[i + 1];
        if (r.length === 1) nx.forEach(b => arrow(c, r[0].x + r[0].w / 2, r.y + r.h + 3, b.x + b.w / 2, nx.y - 4));
        else if (nx.length === 1) r.forEach(b => arrow(c, b.x + b.w / 2, r.y + r.h + 3, nx[0].x + nx[0].w / 2, nx.y - 4));
        else { const m = Math.min(r.length, nx.length); for (let k = 0; k < Math.max(r.length, nx.length); k++) { const a = r[Math.min(k, r.length - 1)], b = nx[Math.min(k, nx.length - 1)]; arrow(c, a.x + a.w / 2, r.y + r.h + 3, b.x + b.w / 2, nx.y - 4); } }
      }
    });
    return c.svg;
  }

  const DIAG = { flow: dFlow, chain: dChain, array: a => dArray(a), cells: a => dArray(a, true), grid: dGrid, stack: dStack, tree: dTree, graph: dGraph, layers: dLayers };

  // ---------- markup -> blocks ----------
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sketchBox(node, opts) {
    // draw a rough border behind an absolutely measured element after layout
    node.dataset.box = JSON.stringify(opts || {});
    return node;
  }

  function parse(src) {
    const out = []; const lines = src.split('\n'); let h2 = 0, i = 0;
    while (i < lines.length) {
      const ln = lines[i];
      if (/^```/.test(ln)) {
        const lang = ln.slice(3).trim(); const code = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
        i++;
        const box = el('div', 'code split');
        box.dataset.lang = { cpp: 'C++', py: 'Python', python: 'Python', java: 'Java', js: 'JavaScript', sql: 'SQL', sh: 'Shell', bash: 'Shell', rust: 'Rust', yaml: 'YAML', json: 'JSON', ts: 'TypeScript', jsx: 'React', txt: '', '': '' }[lang] ?? lang;
        code.forEach(cl => { const d = el('div', 'cl'); d.textContent = cl.replace(/\t/g, '    ') || ' '; box.appendChild(d); });
        out.push(box); continue;
      }
      if (/^\|/.test(ln)) {
        const rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { if (!/^\|[\s:|-]+\|?\s*$/.test(lines[i])) rows.push(lines[i].replace(/^\||\|\s*$/g, '').split('|').map(s => s.trim())); i++; }
        const t = el('div', 'tbl split'); const n = Math.max(...rows.map(r => r.length));
        rows.forEach((r, ri) => { const tr = el('div', 'tr' + (ri === 0 ? ' th' : '')); tr.style.gridTemplateColumns = t.dataset.cols || (t.dataset.cols = colSpec(rows, n)); for (let k = 0; k < n; k++) tr.appendChild(el('div', 'td', inline(r[k] || ''))); t.appendChild(tr); });
        out.push(t); continue;
      }
      i++;
      if (!ln.trim()) continue;
      let m;
      if ((m = ln.match(/^# (.*)/))) { out.push(el('div', 'h1', inline(m[1]))); continue; }
      if ((m = ln.match(/^## (.*)/))) { h2++; const e = el('div', 'h2', `<span class="num">${h2}.</span><span class="u">${inline(m[1])}</span> :`); e.dataset.keep = 1; out.push(e); continue; }
      if ((m = ln.match(/^### (.*)/))) { const e = el('div', 'h3', '&#8226; ' + `<span class="u2">${inline(m[1])}</span>`); e.dataset.keep = 1; out.push(e); continue; }
      if ((m = ln.match(/^@(\w+)\s+(.*)/)) && DIAG[m[1]]) {
        let [body, cap] = m[2].split(/\s+::\s+/);
        const d = el('div', 'diag');
        try { d.appendChild(DIAG[m[1]](body)); } catch (err) { d.textContent = '[diagram error: ' + err.message + '] ' + body; d.classList.add('err'); }
        if (cap) d.appendChild(el('div', 'cap', 'Fig: ' + inline(cap)));
        out.push(d); continue;
      }
      if ((m = ln.match(/^> (.*)/))) { out.push(el('div', 'note', '<b>&#9733; Note:</b> ' + inline(m[1]))); continue; }
      if ((m = ln.match(/^Q: (.*)/))) { const e = el('div', 'q', 'Q. ' + inline(m[1])); e.dataset.keep = 1; out.push(e); continue; }
      if ((m = ln.match(/^A: (.*)/))) { out.push(el('div', 'p a', '<b>Ans:</b> ' + inline(m[1]))); continue; }
      if ((m = ln.match(/^(\s*)- (.*)/))) { out.push(el('div', 'li' + (m[1].length >= 2 ? ' sub' : ''), `<span class="dot">${m[1].length >= 2 ? '&#8211;' : '&#8226;'}</span>` + inline(m[2]))); continue; }
      if ((m = ln.match(/^(\d+)[.)] (.*)/))) { out.push(el('div', 'li', `<span class="dot">${m[1]}.</span>` + inline(m[2]))); continue; }
      if ((m = ln.match(/^(Case study|Scenario|Mnemonic|PYQ|Model answer|Structure|Facts|Value add|Significance|Causes|Impact|Timeline|Way forward|Solution|Intro|Body|Conclusion|Options|Decision|Stakeholders|Features|Criticism|Articles|Remember|Shortcut|Data|Issues|Schemes|Committee|Judgment|Location|TC|SC|Time|Space|Idea|Approach|Why|Dry run|Example|Output|Input|Steps|Tip|Trap|Rule|Formula|Definition|Use|Pros|Cons|Analogy|Result|Key|Intuition|Brute|Better|Optimal|Recurrence|Asked in): (.*)/))) { out.push(el('div', 'p', `<b>${m[1]}:</b> ` + inline(m[2]))); continue; }
      out.push(el('div', 'p', inline(ln)));
    }
    return out;
  }
  function colSpec(rows, n) {
    const w = []; for (let k = 0; k < n; k++) w.push(Math.min(46, Math.max(9, (rows[0][k] || '').length + 3, ...rows.map(r => Math.sqrt((r[k] || '').length) * 4.5))));
    return w.map(x => x + 'fr').join(' ');
  }

  // ---------- pagination ----------
  function newPage(doc, no, title) {
    const p = el('div', 'page');
    p.innerHTML = `<div class="holes"><i></i><i></i><i></i></div><div class="datebox"><div>Date : <u>${window.NOTE_DATE}</u></div><div>Page No. : <u>&nbsp;${no}&nbsp;</u></div></div><div class="runhead">${esc(title)}</div><div class="body"></div>`;
    doc.appendChild(p); return p.querySelector('.body');
  }
  function snap(e) { const h = e.offsetHeight; const t = Math.ceil((h - 0.5) / LINE) * LINE; if (t !== h) e.style.minHeight = t + 'px'; }

  async function run() {
    await document.fonts.ready;
    await document.fonts.load('400 16px Kalam'); await document.fonts.load('700 16px Kalam');
    const src = document.getElementById('src').textContent.replace(/<\\\/script/gi, '</script');
    const title = (src.match(/^# (.*)/m) || [, ''])[1].replace(/\*\*/g, '');
    const blocks = parse(src);
    const doc = document.getElementById('doc');
    let no = 1, body = newPage(doc, no, title);
    const limit = BOTTOM - TOP;
    const used = () => body.scrollHeight > body.clientHeight + 1 ? Infinity : (body.lastElementChild ? body.lastElementChild.offsetTop + body.lastElementChild.offsetHeight : 0);
    const next = () => { body = newPage(doc, ++no, title); };
    for (let bi = 0; bi < blocks.length; bi++) {
      const b = blocks[bi];
      b.style.transform = `rotate(${((rnd() - 0.5) * 0.35).toFixed(3)}deg)`;
      if (b.classList.contains('p') || b.classList.contains('li')) b.style.marginLeft = (rnd() * 3).toFixed(1) + 'px';
      body.appendChild(b); snap(b);
      if (used() <= limit) {
        // keep headings with following content
        if (b.dataset.keep && used() > limit - 2 * LINE) { body.removeChild(b); next(); body.appendChild(b); snap(b); }
        continue;
      }
      if (b.classList.contains('split')) {
        // move overflowing children to continuation blocks
        let cur = b;
        for (;;) {
          const kids = Array.from(cur.children);
          cur.style.minHeight = '';
          const cont = cur.cloneNode(false); cont.style.minHeight = '';
          const head = cur.classList.contains('tbl') ? kids[0].cloneNode(true) : null;
          while (cur.children.length > 1 && cur.offsetTop + cur.offsetHeight > limit) cont.insertBefore(cur.lastElementChild, cont.firstChild);
          if (cur.children.length <= 2 && cur.offsetTop > limit - 4 * LINE && !cur.dataset.moved) {
            // too little fits: move whole block
            while (cont.firstChild) cur.appendChild(cont.firstChild);
            body.removeChild(cur); next(); cur.dataset.moved = 1; body.appendChild(cur); snap(cur);
            if (used() <= limit) break; else continue;
          }
          snap(cur);
          if (!cont.children.length) break;
          if (head && cur.classList.contains('tbl')) cont.insertBefore(head, cont.firstChild);
          cont.dataset.cont = 1; cont.dataset.moved = 1;
          next(); body.appendChild(cont); snap(cont); cur = cont;
          if (used() <= limit) break;
        }
      } else {
        body.removeChild(b);
        // pull a dangling heading along
        const prev = body.lastElementChild; let carry = null;
        if (prev && prev.dataset.keep) { carry = prev; body.removeChild(prev); }
        next(); if (carry) body.appendChild(carry); body.appendChild(b); snap(b);
      }
    }
    // sketchy borders for boxes
    document.querySelectorAll('.code,.note,.tbl').forEach(e => {
      const w = e.offsetWidth, h = e.offsetHeight;
      const c = mk(w, h); c.svg.classList.add('frame');
      const isNote = e.classList.contains('note');
      c.svg.appendChild(c.rc.rectangle(2, 3, w - 4, h - 7, RO({ roughness: 0.9, stroke: isNote ? BLUE : BLACK, strokeWidth: 1.2 })));
      if (e.classList.contains('tbl')) {
        const rows = Array.from(e.children); rows.slice(1).forEach(r => c.svg.appendChild(c.rc.line(3, r.offsetTop, w - 3, r.offsetTop, RO({ roughness: 0.7, strokeWidth: 0.9 }))));
        const tds = Array.from(rows[0].children); tds.slice(1).forEach(td => c.svg.appendChild(c.rc.line(td.offsetLeft, 4, td.offsetLeft, h - 5, RO({ roughness: 0.7, strokeWidth: 0.9 }))));
      }
      e.appendChild(c.svg);
    });
    document.querySelectorAll('.u,.h1').forEach(e => {
      const w = e.offsetWidth; const c = mk(w + 8, 8); c.svg.classList.add('ul');
      c.svg.appendChild(c.rc.line(1, 4, w + 4, 3 + rnd() * 2, RO({ roughness: 1.2, strokeWidth: 1.5 })));
      if (e.classList.contains('h1')) c.svg.appendChild(c.rc.line(2, 7, w + 2, 6 + rnd() * 2, RO({ roughness: 1.2, strokeWidth: 1.2 })));
      e.appendChild(c.svg);
    });
    document.title = 'READY pages=' + no;
    document.body.dataset.ready = no;
  }
  window.addEventListener('load', () => run().catch(e => { document.title = 'ERROR ' + e.message; document.body.dataset.err = e.stack; }));
})();
