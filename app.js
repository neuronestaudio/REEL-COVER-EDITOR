/* Reel Cover Studio — single-page editor, grid preview, cutout & backgrounds */
(() => {
'use strict';
const W = 1080, H = 1920;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const fmtTime = t => { const d = new Date(t), now = new Date(); const tm = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); return d.toDateString() === now.toDateString() ? tm : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' + tm; };

/* ---------------- fonts ---------------- */
const FONTS = [
  { n: 'Fraunces', w: [300, 400, 600, 700, 900], i: true },
  { n: 'Cormorant Garamond', w: [400, 600, 700], i: true },
  { n: 'Playfair Display', w: [400, 700, 900], i: true },
  { n: 'Instrument Serif', w: [400], i: true },
  { n: 'Bebas Neue', w: [400], i: false },
  { n: 'Anton', w: [400], i: false },
  { n: 'Syne', w: [400, 600, 800], i: false },
  { n: 'Unbounded', w: [400, 700, 900], i: false },
  { n: 'Manrope', w: [400, 500, 600, 700, 800], i: false },
  { n: 'Caveat', w: [500, 700], i: false },
  { n: 'JetBrains Mono', w: [400, 500], i: false },
];
const fontReq = new Set();
function ensureFont(n, weight, italic) {
  const f = FONTS.find(x => x.n === n); if (!f) return;
  const w = f.w.reduce((a, b) => Math.abs(b - weight) < Math.abs(a - weight) ? b : a, f.w[0]);
  const key = `${italic && f.i ? 'italic ' : ''}${w} 40px "${n}"`;
  if (fontReq.has(key)) return; fontReq.add(key);
  document.fonts.load(key).then(() => renderAll()).catch(() => {});
}
function fontString(l) {
  const f = FONTS.find(x => x.n === l.font) || FONTS[0];
  const w = f.w.reduce((a, b) => Math.abs(b - l.weight) < Math.abs(a - l.weight) ? b : a, f.w[0]);
  return `${l.italic && f.i ? 'italic ' : ''}${w} ${l.size}px "${f.n}"`;
}

/* ---------------- assets ---------------- */
const BUILTIN = {
  photo: { id: 'photo', kind: 'photo', name: 'Tatami studio (photo)', url: 'assets/photo.jpg', builtin: true },
  cutout: { id: 'cutout', kind: 'cutout', name: 'Tatami studio (cutout)', url: 'assets/cutout.png', builtin: true },
};
let assets = { ...BUILTIN };
const imgCache = {};
function getImg(id) {
  if (!id || !assets[id]) return null;
  if (imgCache[id]) return imgCache[id].complete && imgCache[id].naturalWidth ? imgCache[id] : null;
  const im = new Image(); im.crossOrigin = 'anonymous'; im.src = assets[id].url;
  im.onload = () => renderAll(); imgCache[id] = im; return null;
}
function assetsOf(kind) { return Object.values(assets).filter(a => a.kind === kind); }

/* ---------------- procedural textures ---------------- */
function seeded(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const TEX = {
  aurora: 'Aurora', rings: 'Sound rings', wave: 'Waveform', mesh: 'Mesh', halftone: 'Halftone', paper: 'Paper',
};
const texCache = new Map();
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function texture(kind, c1, c2, seed) {
  const key = [kind, c1, c2, seed].join('|');
  if (texCache.has(key)) return texCache.get(key);
  const w = 540, h = 960, c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); const r = seeded(seed);
  x.fillStyle = c1; x.fillRect(0, 0, w, h);
  if (kind === 'aurora' || kind === 'mesh') {
    const n = kind === 'mesh' ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const g = x.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 250 + r() * 400);
      g.addColorStop(0, hexA(c2, kind === 'mesh' ? .95 : .8)); g.addColorStop(1, hexA(c2, 0));
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }
    if (kind === 'aurora') { x.filter = 'blur(40px)'; x.drawImage(c, 0, 0); x.filter = 'none'; }
  } else if (kind === 'rings') {
    const cx = w * (0.3 + r() * 0.4), cy = h * (0.35 + r() * 0.3);
    for (let i = 1; i < 26; i++) { x.beginPath(); x.arc(cx, cy, i * 34, 0, Math.PI * 2); x.strokeStyle = hexA(c2, 0.55 - i * 0.018); x.lineWidth = 1.2 + (i % 3 === 0 ? 1.5 : 0); x.stroke(); }
  } else if (kind === 'wave') {
    for (let j = 0; j < 46; j++) {
      const y0 = 40 + j * 20, amp = 6 + 60 * Math.pow(Math.sin(j / 46 * Math.PI), 2), ph = r() * 6;
      x.beginPath(); for (let i = 0; i <= w; i += 4) { const y = y0 + Math.sin(i / 70 + ph) * amp * Math.sin(i / w * Math.PI); i ? x.lineTo(i, y) : x.moveTo(i, y); }
      x.strokeStyle = hexA(c2, 0.35 + 0.4 * Math.sin(j / 46 * Math.PI)); x.lineWidth = 1.4; x.stroke();
    }
  } else if (kind === 'halftone') {
    for (let yy = 0; yy < h; yy += 18) for (let xx = 0; xx < w; xx += 18) {
      const t = clamp((yy / h) * 1.2 - 0.15 + (r() - .5) * .08, 0, 1); const rad = 8 * t;
      if (rad > 0.4) { x.beginPath(); x.arc(xx + 9, yy + 9, rad, 0, Math.PI * 2); x.fillStyle = c2; x.fill(); }
    }
  } else if (kind === 'paper') {
    const id = x.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { const v = (r() - .5) * 26; d[i] += v; d[i + 1] += v; d[i + 2] += v; }
    x.putImageData(id, 0, 0);
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, hexA(c2, .18)); g.addColorStop(1, hexA(c2, 0)); x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  texCache.set(key, c); return c;
}
let grainTile = null;
function grainPattern(ctx) {
  if (!grainTile) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const id = x.createImageData(256, 256); for (let i = 0; i < id.data.length; i += 4) { const v = 90 + Math.random() * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); grainTile = c; }
  return ctx.createPattern(grainTile, 'repeat');
}

/* ---------------- renderer ---------------- */
function roundRect(x, X, Y, w, h, r) { r = Math.min(r, w / 2, h / 2); x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
/* Wrapping records, for every character it lays down, the index that character
   came from in the layer's source text. That mapping is what lets a colour span
   survive word wrap — a run can start mid-line and the renderer still knows
   where it sits. Indices are UTF-16 code units, the same units a textarea's
   selectionStart/End use, so a selection maps straight onto a span.
   Returns [{ text, idx: [{ ch, i }] }]; i is -1 for a space wrapping inserted. */
function wrapLines(x, text, maxW) {
  const src = String(text), out = [];
  const chars = (s, at) => Array.from({ length: s.length }, (_, k) => ({ ch: s[k], i: at + k }));
  let pos = 0;
  for (const para of src.split('\n')) {
    const start = pos; pos += para.length + 1;
    const words = []; const re = /\S+/g; let m;
    while ((m = re.exec(para))) words.push({ t: m[0], at: start + m.index });
    if (!words.length) { out.push({ text: '', idx: [] }); continue; }
    let t = words[0].t, idx = chars(words[0].t, words[0].at);
    for (let i = 1; i < words.length; i++) {
      const w = words[i], cand = t + ' ' + w.t;
      if (x.measureText(cand).width <= maxW) { t = cand; idx.push({ ch: ' ', i: -1 }); idx = idx.concat(chars(w.t, w.at)); }
      else { out.push({ text: t, idx }); t = w.t; idx = chars(w.t, w.at); }
    }
    out.push({ text: t, idx });
  }
  return out;
}
/* Uppercase one code unit at a time so the string length never changes and the
   span indices still line up — plain toUpperCase turns 'ß' into 'SS'. */
function upperKeepLen(s) {
  let o = '';
  for (let i = 0; i < s.length; i++) { const c = s[i], u = c.toUpperCase(); o += u.length === 1 ? u : c; }
  return o;
}
/* Colour spans are half-open [s,e) ranges over the source text that override the
   layer colour. They are kept sorted and non-overlapping, so the last colour
   applied to a range is the one that shows. */
function normSpans(l) { return Array.isArray(l && l.spans) ? l.spans.filter(s => s && s.e > s.s) : []; }
function spanColorAt(spans, i, base) {
  for (const s of spans) if (i >= s.s && i < s.e) return s.color;
  return base;
}
/* Cut [s,e) out of every existing span, splitting any span that straddles it. */
function clipSpans(spans, s, e) {
  const out = [];
  for (const sp of spans) {
    if (sp.e <= s || sp.s >= e) { out.push(sp); continue; }
    if (sp.s < s) out.push({ ...sp, e: s });
    if (sp.e > e) out.push({ ...sp, s: e });
  }
  return out;
}
/* An edit to the text shifts every span after the edit point. Diff old against
   new by common prefix and suffix, then move the endpoints; a span whose whole
   range was typed over collapses and is dropped. */
function remapSpans(spans, oldT, newT) {
  spans = normSpans({ spans });
  if (!spans.length || oldT === newT) return spans;
  const lim = Math.min(oldT.length, newT.length);
  let p = 0; while (p < lim && oldT[p] === newT[p]) p++;
  let suf = 0; while (suf < lim - p && oldT[oldT.length - 1 - suf] === newT[newT.length - 1 - suf]) suf++;
  const tailStart = oldT.length - suf, insEnd = newT.length - suf, delta = newT.length - oldT.length;
  const map = i => i <= p ? i : i >= tailStart ? i + delta : Math.min(insEnd, Math.max(p, i));
  return spans.map(sp => ({ ...sp, s: map(sp.s), e: map(sp.e) })).filter(sp => sp.e > sp.s);
}
/* Group a wrapped line into the longest possible same-colour runs, so words are
   still drawn whole wherever the colour doesn't change. */
function colorRuns(ln, spans, base) {
  const runs = []; let prev = null;
  for (let k = 0; k < ln.idx.length; k++) {
    const e = ln.idx[k];
    const c = e.i < 0 ? (prev || base) : spanColorAt(spans, e.i, base);
    if (!runs.length || c !== prev) runs.push({ color: c, a: k, b: k + 1 });
    else runs[runs.length - 1].b = k + 1;
    prev = c;
  }
  return runs;
}
/* Placement of a background image: `fit` shows the whole image (letterboxed on
   the pad colour), the default covers the frame. Pan is a fraction of the
   overhang, so the slider range always means something at any zoom. */
function bgBox(b, im) {
  const base = b.fit === 'fit' ? Math.min(W / im.naturalWidth, H / im.naturalHeight) : Math.max(W / im.naturalWidth, H / im.naturalHeight);
  const s = base * b.scale * (1 + b.blur / 120);
  const w = im.naturalWidth * s, h = im.naturalHeight * s;
  return { x: (W - w) / 2 + b.x * Math.max((w - W) / 2, W * .25), y: (H - h) / 2 + b.y * Math.max((h - H) / 2, H * .25), w, h };
}
function drawBackground(x, doc) {
  const b = doc.bg;
  if (b.type === 'solid') { x.fillStyle = b.color; x.fillRect(0, 0, W, H); }
  else if (b.type === 'gradient') {
    const a = (b.angle - 90) * Math.PI / 180, L = Math.abs(W * Math.cos(a)) + Math.abs(H * Math.sin(a));
    const g = x.createLinearGradient(W / 2 - Math.cos(a) * L / 2, H / 2 - Math.sin(a) * L / 2, W / 2 + Math.cos(a) * L / 2, H / 2 + Math.sin(a) * L / 2);
    g.addColorStop(0, b.g1); g.addColorStop(1, b.g2); x.fillStyle = g; x.fillRect(0, 0, W, H);
  } else if (b.type === 'texture') { x.drawImage(texture(b.tex, b.tc1, b.tc2, b.seed), 0, 0, W, H); }
  else {
    const im = getImg(b.image);
    x.fillStyle = b.pad || '#1a1814'; x.fillRect(0, 0, W, H);
    if (im) {
      const box = bgBox(b, im);
      x.save(); x.filter = `blur(${b.blur}px) brightness(${b.bright}) saturate(${b.sat})`; x.drawImage(im, box.x, box.y, box.w, box.h); x.restore();
    }
  }
  if (doc.grain > 0) { x.save(); x.globalAlpha = doc.grain; x.globalCompositeOperation = 'overlay'; x.fillStyle = grainPattern(x); x.fillRect(0, 0, W, H); x.restore(); }
}
function subjectBox(doc) {
  const s = doc.subject, im = getImg(s.image); if (!im) return null;
  const dh = s.scale * H, dw = dh * im.naturalWidth / im.naturalHeight;
  return { x: s.x * W - dw / 2, y: s.y * H - dh, w: dw, h: dh, im };
}
function drawSubject(x, doc) {
  const s = doc.subject; if (!s.on) return; const bx = subjectBox(doc); if (!bx) return;
  x.save();
  if (s.shadow > 0) { x.shadowColor = `rgba(0,0,0,${s.shadow})`; x.shadowBlur = 90; x.shadowOffsetY = 40; }
  if (s.sat !== 1) x.filter = `saturate(${s.sat})`;
  if (s.flip) { x.translate(bx.x + bx.w, bx.y); x.scale(-1, 1); x.drawImage(bx.im, 0, 0, bx.w, bx.h); }
  else x.drawImage(bx.im, bx.x, bx.y, bx.w, bx.h);
  x.restore();
}
function drawOverlay(x, doc) {
  const o = doc.overlay; if (o.type === 'none' || o.opacity <= 0) return;
  x.save();
  if (o.type === 'tint') { x.globalAlpha = o.opacity; x.fillStyle = o.color; x.fillRect(0, 0, W, H); }
  else if (o.type === 'vignette') { const g = x.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75); g.addColorStop(0, hexA(o.color, 0)); g.addColorStop(1, hexA(o.color, o.opacity)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  else {
    if (o.type === 'bottom' || o.type === 'both') { const g = x.createLinearGradient(0, H * .4, 0, H); g.addColorStop(0, hexA(o.color, 0)); g.addColorStop(.55, hexA(o.color, o.opacity * .55)); g.addColorStop(1, hexA(o.color, o.opacity)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    if (o.type === 'top' || o.type === 'both') { const g = x.createLinearGradient(0, 0, 0, H * .5); g.addColorStop(0, hexA(o.color, o.opacity)); g.addColorStop(1, hexA(o.color, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  }
  x.restore();
}
function drawText(x, l) {
  x.save();
  x.font = fontString(l); x.letterSpacing = `${l.track * l.size}px`; x.textBaseline = 'alphabetic';
  const text = l.upper ? upperKeepLen(l.text) : l.text;
  const spans = normSpans(l);
  const maxW = l.width * W, lines = wrapLines(x, text, maxW), lh = l.size * l.line;
  const widths = lines.map(ln => x.measureText(ln.text).width);
  const bw = Math.max(...widths, 1), bh = lines.length * lh;
  const ax = l.x * W, top = l.y * H;
  const left = l.align === 'left' ? ax : l.align === 'right' ? ax - bw : ax - bw / 2;
  const box = { x: left, y: top, w: bw, h: bh };
  if (l.rot) { x.translate(left + bw / 2, top + bh / 2); x.rotate(l.rot * Math.PI / 180); x.translate(-(left + bw / 2), -(top + bh / 2)); }
  const pad = l.size * 0.22;
  // boxes
  if (l.box !== 'none') {
    x.fillStyle = hexA(l.boxColor, l.boxAlpha);
    if (l.box === 'block') { roundRect(x, left - pad * 1.6, top - pad, bw + pad * 3.2, bh + pad * 2, l.size * .12); x.fill(); }
    else lines.forEach((ln, i) => {
      const lw = widths[i]; const lx = l.align === 'left' ? left : l.align === 'right' ? left + bw - lw : left + (bw - lw) / 2;
      const ly = top + i * lh;
      if (l.box === 'pill') { roundRect(x, lx - pad * 1.4, ly + lh * .08, lw + pad * 2.8, lh * .92, lh); x.fill(); }
      else { roundRect(x, lx - pad * .5, ly + lh * .16, lw + pad, lh * .78, 4); x.fill(); }
    });
  }
  /* Runs are drawn left-aligned from the line's own left edge rather than from
     the layer's alignment anchor. For a single-colour line the two are the same
     position; doing it this way lets each run carry its own fill. */
  x.textAlign = 'left';
  const baseOff = lh * 0.5 + l.size * 0.34;
  lines.forEach((ln, i) => {
    const lw = widths[i];
    const lx = l.align === 'left' ? left : l.align === 'right' ? left + bw - lw : left + (bw - lw) / 2;
    const ty = top + i * lh + baseOff;
    for (const r of colorRuns(ln, spans, l.color)) {
      const seg = ln.text.slice(r.a, r.b); if (!seg) continue;
      const ox = lx + (r.a ? x.measureText(ln.text.slice(0, r.a)).width : 0);
      if (l.outline > 0) { x.save(); x.lineJoin = 'round'; x.lineWidth = l.outline * 2; x.strokeStyle = l.boxColor; x.strokeText(seg, ox, ty); x.restore(); }
      if (l.shadow > 0) { x.shadowColor = `rgba(0,0,0,${l.shadow})`; x.shadowBlur = l.size * .25; x.shadowOffsetY = l.size * .05; }
      x.fillStyle = r.color; x.fillText(seg, ox, ty); x.shadowColor = 'transparent';
    }
  });
  x.restore();
  return box;
}
function drawRule(x, l) {
  const w = l.width * W, X = l.x * W - w / 2, Y = l.y * H;
  x.save(); x.fillStyle = hexA(l.color, l.alpha); x.fillRect(X, Y - l.thick / 2, w, l.thick); x.restore();
  return { x: X, y: Y - Math.max(l.thick / 2, 14), w, h: Math.max(l.thick, 28) };
}
function drawLogo(x, l) {
  const im = getImg(l.image); const w = l.size * W; const h = im ? w * im.naturalHeight / im.naturalWidth : w * .35;
  const X = l.x * W - w / 2, Y = l.y * H - h / 2;
  x.save(); x.globalAlpha = l.alpha;
  if (im) { if (l.invert) x.filter = 'invert(1)'; x.drawImage(im, X, Y, w, h); }
  else { x.strokeStyle = 'rgba(255,255,255,.5)'; x.setLineDash([12, 10]); x.lineWidth = 3; x.strokeRect(X, Y, w, h); x.font = '500 28px "JetBrains Mono"'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText('LOGO', X + w / 2, Y + h / 2 + 10); }
  x.restore(); return { x: X, y: Y, w, h };
}
function render(ctx, doc, scale, boxes) {
  ctx.save(); ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, doc);
  const draw = l => { const b = l.type === 'text' ? drawText(ctx, l) : l.type === 'rule' ? drawRule(ctx, l) : drawLogo(ctx, l); if (boxes) boxes[l.id] = b; };
  doc.layers.filter(l => l.behind).forEach(draw);
  drawSubject(ctx, doc); if (boxes) { const sb = subjectBox(doc); if (sb && doc.subject.on) boxes.__subject = sb; }
  drawOverlay(ctx, doc);
  doc.layers.filter(l => !l.behind).forEach(draw);
  ctx.restore();
}
function renderTo(canvas, doc, cssW) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); const s = cssW / W;
  const pw = Math.round(cssW * dpr), ph = Math.round(cssW * H / W * dpr);
  if (canvas.width !== pw) { canvas.width = pw; canvas.height = ph; }
  render(canvas.getContext('2d'), doc, s * dpr, null);
}
function requestFonts(doc) { doc.layers.forEach(l => { if (l.type === 'text') ensureFont(l.font, l.weight, l.italic); }); }

/* ---------------- document model ---------------- */
const SWATCH = ['#ffffff', '#16150f', '#f1ecdf', '#d9a441', '#e9d9b5', '#7fb3a6', '#0f3b3a', '#2b2b6d', '#b8412e', '#f2c6b6', '#5b6b3a', '#8c8377'];
const GRADS = [['#0f3b3a', '#16150f'], ['#2b2b6d', '#0b0a1a'], ['#d9a441', '#7a4a12'], ['#e9d9b5', '#c9a27a'], ['#1d1d1d', '#4a4a4a'], ['#7fb3a6', '#16150f'], ['#f2c6b6', '#b8412e'], ['#ffffff', '#d7d2c4']];
function newText(o = {}) {
  return Object.assign({ id: uid(), type: 'text', text: 'Caption', font: 'Fraunces', weight: 600, italic: false, upper: false, size: 110, line: 1.02, track: -0.02, width: 0.86, align: 'left', color: '#ffffff', spans: [], x: 0.07, y: 0.62, box: 'none', boxColor: '#16150f', boxAlpha: 0.65, shadow: 0.35, outline: 0, rot: 0, behind: false }, o);
}
function newRule(o = {}) { return Object.assign({ id: uid(), type: 'rule', x: 0.5, y: 0.6, width: 0.86, thick: 4, color: '#ffffff', alpha: .8 }, o); }
function newLogo(o = {}) { return Object.assign({ id: uid(), type: 'logo', image: null, x: 0.5, y: 0.1, size: 0.22, alpha: 1, invert: false }, o); }
function baseDoc(name) {
  return {
    id: uid(), name: name || 'Untitled cover', createdAt: Date.now(), updatedAt: Date.now(),
    bg: { type: 'image', image: 'photo', fit: 'fill', pad: '#16150f', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1, color: '#e9d9b5', g1: '#0f3b3a', g2: '#16150f', angle: 160, tex: 'aurora', tc1: '#16150f', tc2: '#0f3b3a', seed: 7 },
    grain: 0,
    subject: { on: false, image: 'cutout', scale: 0.62, x: 0.5, y: 0.96, shadow: 0.5, sat: 1, flip: false },
    overlay: { type: 'bottom', color: '#000000', opacity: 0.65 },
    layers: [],
  };
}
const TEMPLATES = [
  { name: 'Quiet signal', make() { const d = baseDoc('Quiet signal'); d.bg.scale = 1.05; d.bg.y = -0.1; d.overlay = { type: 'bottom', color: '#0b0a07', opacity: 0.8 }; d.grain = 0.08;
    d.layers = [newText({ text: 'EPISODE 04', font: 'JetBrains Mono', weight: 500, size: 30, track: 0.18, upper: true, x: 0.08, y: 0.655, color: '#d9a441', shadow: 0 }),
      newText({ text: 'The thing nobody tells you about starting over', font: 'Fraunces', weight: 300, size: 118, line: 0.98, track: -0.03, x: 0.08, y: 0.69, width: 0.84 }),
      newText({ text: '3 min watch', font: 'Manrope', weight: 600, size: 32, x: 0.08, y: 0.905, color: '#f1ecdf', box: 'pill', boxColor: '#16150f', boxAlpha: .7, shadow: 0 })]; return d; } },
  { name: 'Amber cutout', make() { const d = baseDoc('Amber cutout'); d.bg = { ...d.bg, type: 'solid', color: '#e9d9b5' }; d.subject = { ...d.subject, on: true, scale: 0.66, y: 0.99, shadow: 0.45 }; d.overlay = { type: 'none', color: '#000', opacity: 0 };
    d.layers = [newText({ text: 'FOCUS', font: 'Bebas Neue', weight: 400, size: 520, line: 0.85, track: -0.01, align: 'center', x: 0.5, y: 0.19, color: '#16150f', shadow: 0, behind: true, width: 1 }),
      newText({ text: 'A question worth sitting with', font: 'Fraunces', weight: 600, italic: true, size: 64, align: 'center', x: 0.5, y: 0.88, color: '#16150f', shadow: 0 }),
      newText({ text: 'PART 01', font: 'JetBrains Mono', size: 28, track: 0.2, align: 'center', x: 0.5, y: 0.93, color: '#b8412e', shadow: 0 })]; return d; } },
  { name: 'Mono editorial', make() { const d = baseDoc('Mono editorial'); d.bg = { ...d.bg, sat: 0, bright: 0.9, scale: 1.1 }; d.overlay = { type: 'both', color: '#000000', opacity: 0.55 }; d.grain = 0.14;
    d.layers = [newRule({ y: 0.72, width: 0.3, x: 0.2, thick: 3 }),
      newText({ text: 'Stillness is a skill', font: 'Cormorant Garamond', weight: 400, italic: true, size: 136, line: 0.95, x: 0.06, y: 0.74, width: 0.9, color: '#f1ecdf', shadow: .2 }),
      newText({ text: 'No. 12 — On stillness', font: 'JetBrains Mono', size: 30, track: 0.12, upper: true, x: 0.06, y: 0.14, color: '#f1ecdf', shadow: 0 })]; return d; } },
  { name: 'Deep teal', make() { const d = baseDoc('Deep teal'); d.bg = { ...d.bg, type: 'gradient', g1: '#0f3b3a', g2: '#0a0c12', angle: 170 }; d.subject = { ...d.subject, on: true, scale: 0.6, y: 1.0, shadow: 0.7 }; d.overlay = { type: 'bottom', color: '#0a0c12', opacity: 0.5 }; d.grain = 0.1;
    d.layers = [newText({ text: 'Your nervous system has a volume knob', font: 'Syne', weight: 800, size: 112, line: 1.0, track: -0.03, upper: true, x: 0.07, y: 0.08, width: 0.86, color: '#f1ecdf', shadow: 0 }),
      newText({ text: 'here’s how to turn it down', font: 'Caveat', weight: 700, size: 76, x: 0.07, y: 0.4, color: '#7fb3a6', rot: -4, shadow: 0 }),
      newText({ text: '@YOURHANDLE', font: 'JetBrains Mono', size: 30, track: 0.28, align: 'center', x: 0.5, y: 0.94, color: '#7fb3a6', shadow: 0 })]; return d; } },
  { name: 'Poster stack', make() { const d = baseDoc('Poster stack'); d.bg = { ...d.bg, type: 'texture', tex: 'rings', tc1: '#16150f', tc2: '#d9a441', seed: 21 }; d.subject = { ...d.subject, on: true, scale: 0.58, x: 0.56, y: 1.02, shadow: 0.6 }; d.overlay = { type: 'none', color: '#000', opacity: 0 };
    d.layers = [newText({ text: 'START\nBEFORE\nYOU\u2019RE READY', font: 'Anton', weight: 400, size: 250, line: 0.88, track: 0, x: 0.06, y: 0.07, width: 0.9, color: '#f1ecdf', shadow: 0, behind: true }),
      newText({ text: '5 rules, ranked', font: 'Manrope', weight: 700, size: 40, x: 0.06, y: 0.9, color: '#16150f', box: 'highlight', boxColor: '#d9a441', boxAlpha: 1, shadow: 0 })]; return d; } },
  { name: 'Paper note', make() { const d = baseDoc('Paper note'); d.bg = { ...d.bg, type: 'texture', tex: 'paper', tc1: '#f1ecdf', tc2: '#d9a441', seed: 3 }; d.subject = { ...d.subject, on: true, scale: 0.5, x: 0.5, y: 0.7, shadow: 0.35 }; d.overlay = { type: 'none', color: '#000', opacity: 0 };
    d.layers = [newText({ text: 'field notes', font: 'Instrument Serif', weight: 400, italic: true, size: 96, align: 'center', x: 0.5, y: 0.1, color: '#16150f', shadow: 0 }),
      newText({ text: 'What actually changed (and what didn’t)', font: 'Fraunces', weight: 700, size: 78, line: 1.05, track: -0.02, align: 'center', x: 0.5, y: 0.74, width: 0.8, color: '#16150f', shadow: 0 }),
      newRule({ y: 0.705, width: 0.12, thick: 5, color: '#b8412e', alpha: 1 }),
      newText({ text: 'yoursite.com', font: 'JetBrains Mono', size: 28, track: 0.1, align: 'center', x: 0.5, y: 0.93, color: '#8c8377', shadow: 0 })]; return d; } },
];

/* ---------------- storage ----------------
   Everything lives in the visitor's own browser: cover documents and settings in
   localStorage, uploaded images and cutouts in IndexedDB (blobs are far too big
   for localStorage). Nothing is sent anywhere. "Back up library" writes the whole
   lot to a JSON file so it can move between machines or go to a teammate.        */
const store = {
  mode: 'local', KEY: 'rcs.covers', SKEY: 'rcs.settings',

  async init() { await this.loadAssets(); },

  // ---- covers ----
  async listCovers() { try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; } },
  async saveCover(rec) {
    const all = await this.listCovers(); const i = all.findIndex(c => c.id === rec.id);
    if (i >= 0) all[i] = rec; else all.push(rec);
    try { localStorage.setItem(this.KEY, JSON.stringify(all)); }
    catch { toast('Browser storage is full — delete old versions or covers'); }
  },
  async deleteCover(id) {
    const all = (await this.listCovers()).filter(c => c.id !== id);
    try { localStorage.setItem(this.KEY, JSON.stringify(all)); } catch {}
  },
  async getSettings() { try { return JSON.parse(localStorage.getItem(this.SKEY) || '{}'); } catch { return {}; } },
  async saveSettings(s) { try { localStorage.setItem(this.SKEY, JSON.stringify(s)); } catch {} },

  // ---- images (IndexedDB) ----
  idb() { return new Promise((res, rej) => { const r = indexedDB.open('rcs', 1); r.onupgradeneeded = () => r.result.createObjectStore('assets', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async rows() { const db = await this.idb(); return new Promise((res, rej) => { const t = db.transaction('assets').objectStore('assets').getAll(); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); },
  async loadAssets() {
    assets = { ...BUILTIN };
    try { (await this.rows()).forEach(r => assets[r.id] = { id: r.id, kind: r.kind, name: r.name, url: URL.createObjectURL(r.blob) }); }
    catch (e) { console.warn('IndexedDB unavailable', e); }
  },
  async putAsset(blob, kind, name, forceId) {
    const id = forceId || uid();
    const db = await this.idb();
    await new Promise((res, rej) => { const t = db.transaction('assets', 'readwrite'); t.objectStore('assets').put({ id, kind, name, blob }); t.oncomplete = res; t.onerror = () => rej(t.error); });
    const rec = { id, kind, name, url: URL.createObjectURL(blob) }; assets[id] = rec; return rec;
  },
  async deleteAsset(id) {
    if (assets[id]?.builtin) return;
    const db = await this.idb();
    await new Promise(res => { const t = db.transaction('assets', 'readwrite'); t.objectStore('assets').delete(id); t.oncomplete = res; t.onerror = res; });
    delete assets[id]; delete imgCache[id];
  },

  // ---- backup / restore ----
  async exportLibrary() {
    const blobToDataUrl = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
    const imgs = [];
    for (const r of await this.rows().catch(() => [])) imgs.push({ id: r.id, kind: r.kind, name: r.name, data: await blobToDataUrl(r.blob) });
    return { format: 'reel-cover-studio', version: 1, savedAt: new Date().toISOString(), covers: await this.listCovers(), settings: await this.getSettings(), images: imgs };
  },
  async importLibrary(json, mode) {
    if (json?.format !== 'reel-cover-studio') throw new Error('Not a Reel Cover Studio backup file');
    if (mode === 'replace') { localStorage.removeItem(this.KEY); for (const r of await this.rows().catch(() => [])) await this.deleteAsset(r.id); }
    for (const im of json.images || []) { const blob = await (await fetch(im.data)).blob(); await this.putAsset(blob, im.kind, im.name, im.id); }
    const mine = await this.listCovers(); const byId = new Map(mine.map(c => [c.id, c]));
    for (const c of json.covers || []) byId.set(c.id, c);
    try { localStorage.setItem(this.KEY, JSON.stringify([...byId.values()])); } catch { toast('Browser storage is full — import incomplete'); }
    const s = await this.getSettings(); await this.saveSettings(mode === 'replace' ? (json.settings || {}) : { ...s, ...(json.settings || {}) });
  },

  // ---- download ----
  async download(filename, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 8000); return true;
  },
};

/* ---------------- app state ---------------- */
let covers = [];           // [{id,name,updatedAt,createdAt,doc,versions:[{at,doc}]}]
let doc = null;            // live document
let sel = null;            // selected layer id | '__subject' | null
/* The profile mock defaults to the account these covers are being made for.
   Every field is editable, so the same tool works for any client. */
const PROFILE_DEFAULTS = {
  handle: 'harrison.saito',
  name: 'Harrison Saito | Men\u2019s Coach',
  category: 'Coach',
  bio: 'I help burnt out men feel seen & rebuild self-worth.\nFrom people pleaser to self-led\nTeacher \u2022 Buddhist \u2022 Karate (17+\u2026 more',
  link: 'www.harrisonsaito.com.au/return-to-self',
  posts: '72', followers: '414', following: '211',
  followedBy: 'harrison.saito.private, nattynatman, and takyumi99',
  avatar: null,
};
let settings = { gridOrder: [], shape: '916', ...PROFILE_DEFAULTS };
let undoStack = [], redoStack = [];
let zoomMul = 1, boxes = {};
let saveTimer = null;

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
function setStatus(txt, cls = '') { const s = $('#status'); s.textContent = txt; s.className = cls; }
function coverRec() { return covers.find(c => c.id === doc.id); }
function snapshot() { return JSON.stringify(doc); }
function pushUndo() { undoStack.push(snapshot()); if (undoStack.length > 80) undoStack.shift(); redoStack = []; updateUndoBtns(); }
function updateUndoBtns() { $('#btnUndo').disabled = !undoStack.length; $('#btnRedo').disabled = !redoStack.length; }
function commit() { scheduleSave(); renderAll(); }
function scheduleSave() {
  doc.updatedAt = Date.now(); setStatus('unsaved…', 'warn');
  clearTimeout(saveTimer); saveTimer = setTimeout(persistCurrent, 900);
}
async function persistCurrent(withVersion) {
  let rec = coverRec(); if (!rec) { rec = { id: doc.id, createdAt: doc.createdAt, versions: [] }; covers.push(rec); }
  rec.name = doc.name; rec.updatedAt = doc.updatedAt = Date.now(); rec.doc = JSON.parse(snapshot());
  if (withVersion) { rec.versions = [{ at: Date.now(), doc: rec.doc }, ...(rec.versions || [])].slice(0, 25); }
  try { await store.saveCover(rec); setStatus('saved · this browser', 'ok'); }
  catch (e) { console.warn(e); setStatus('save failed', 'warn'); }
  renderCoverList(); renderVersions(); renderGrid();
}

/* ---------------- editor UI ---------------- */
const preview = $('#preview'), pctx = preview.getContext('2d');
function stageZoom() {
  const st = $('#stage'); const z = Math.min((st.clientHeight - 40) / H, (st.clientWidth - 40) / W) * zoomMul;
  return Math.max(0.08, z);
}
function renderPreview() {
  const z = stageZoom(), cssW = Math.round(W * z), cssH = Math.round(H * z);
  preview.style.width = cssW + 'px'; preview.style.height = cssH + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (preview.width !== Math.round(cssW * dpr)) { preview.width = Math.round(cssW * dpr); preview.height = Math.round(cssH * dpr); }
  boxes = {}; render(pctx, doc, z * dpr, boxes);
  $('#zoomLbl').innerHTML = `<b>${Math.round(z * 100)}%</b>`;
  drawSelection(z);
}
function drawSelection(z) {
  const sb = $('#selBox'); const b = sel === '__subject' ? boxes.__subject : boxes[sel];
  if (!sel || !b) { sb.style.display = 'none'; return; }
  sb.style.display = 'block'; sb.style.left = b.x * z - 2 + 'px'; sb.style.top = b.y * z - 2 + 'px'; sb.style.width = b.w * z + 4 + 'px'; sb.style.height = b.h * z + 4 + 'px';
  const l = doc.layers.find(x => x.id === sel); sb.dataset.label = sel === '__subject' ? 'subject' : l ? l.type : '';
  sb.classList.toggle('tiny', b.w * z < 46 || b.h * z < 46);
}
let rafPending = false;
function renderAll() {
  if (rafPending || !doc) return; rafPending = true;
  requestAnimationFrame(() => { rafPending = false; requestFonts(doc); renderPreview(); });
}

// pointer interaction on the preview
let drag = null;
function canvasPoint(e) { const r = preview.getBoundingClientRect(); const z = stageZoom(); return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z }; }
function hitTest(p) {
  const inside = b => b && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  const front = doc.layers.filter(l => !l.behind).reverse(); for (const l of front) if (inside(boxes[l.id])) return l.id;
  if (doc.subject.on && boxes.__subject) { const b = boxes.__subject; if (inside(b)) { // alpha test
      const im = getImg(doc.subject.image); if (im) { const c = hitTest._c || (hitTest._c = document.createElement('canvas')); c.width = c.height = 1; const cx = c.getContext('2d'); cx.clearRect(0, 0, 1, 1);
        let sx = (p.x - b.x) / b.w; if (doc.subject.flip) sx = 1 - sx; cx.drawImage(im, sx * im.naturalWidth, (p.y - b.y) / b.h * im.naturalHeight, 1, 1, 0, 0, 1, 1); if (cx.getImageData(0, 0, 1, 1).data[3] > 20) return '__subject'; }
      else return '__subject'; } }
  const behind = doc.layers.filter(l => l.behind).reverse(); for (const l of behind) if (inside(boxes[l.id])) return l.id;
  return null;
}
preview.addEventListener('pointerdown', e => {
  const p = canvasPoint(e); const id = hitTest(p); select(id);
  const target = id === '__subject' ? doc.subject : id ? doc.layers.find(l => l.id === id) : doc.bg.type === 'image' ? doc.bg : null;
  if (!target) return;
  drag = { id: id || '__bg', p, x0: target.x, y0: target.y, moved: false, before: snapshot() };
  preview.setPointerCapture(e.pointerId); preview.classList.add('grabbing');
});
preview.addEventListener('pointermove', e => {
  if (!drag) { const id = hitTest(canvasPoint(e)); preview.classList.toggle('grab', !!id || doc.bg.type === 'image'); return; }
  const p = canvasPoint(e); const dx = (p.x - drag.p.x) / W, dy = (p.y - drag.p.y) / H; if (Math.abs(dx) + Math.abs(dy) < 0.001 && !drag.moved) return;
  drag.moved = true;
  const t = drag.id === '__bg' ? doc.bg : drag.id === '__subject' ? doc.subject : doc.layers.find(l => l.id === drag.id); if (!t) return;
  if (drag.id === '__bg') { // pan the background image within its overhang
    const im = getImg(doc.bg.image); if (!im) return;
    const bb = bgBox(doc.bg, im);
    t.x = clamp(drag.x0 + (p.x - drag.p.x) / Math.max((bb.w - W) / 2, W * .25), -1, 1);
    t.y = clamp(drag.y0 + (p.y - drag.p.y) / Math.max((bb.h - H) / 2, H * .25), -1, 1);
    t.x = +t.x.toFixed(4); t.y = +t.y.toFixed(4); renderAll(); ['bgX', 'bgY'].forEach(id => $('#' + id)._sync()); return;
  }
  t.x = +(drag.x0 + dx).toFixed(4); t.y = +(drag.y0 + dy).toFixed(4); renderAll(); syncPropsLite();
});
/* Corner grips resize the selected element. Each type has one scalar that means
   "size", captured when the drag starts so the whole gesture scales from the
   original rather than compounding. Text scales its wrap width alongside the
   font size, so the block grows as a block instead of re-wrapping as it grows. */
function resizeGrip() {
  if (sel === '__subject') { const s = doc.subject, s0 = s.scale; return { obj: s, apply: k => s.scale = +clamp(s0 * k, 0.3, 1.6).toFixed(3), sync: ['subjScale'] }; }
  const l = L(); if (!l) return null;
  if (l.type === 'text') { const z0 = l.size, w0 = l.width; return { obj: l, apply: k => { l.size = Math.round(clamp(z0 * k, 20, 400)); l.width = +clamp(w0 * k, 0.2, 1).toFixed(3); }, sync: ['tSize', 'tWidth'] }; }
  if (l.type === 'logo') { const z0 = l.size; return { obj: l, apply: k => l.size = +clamp(z0 * k, 0.05, 0.8).toFixed(3), sync: ['lSize'] }; }
  if (l.type === 'rule') { const w0 = l.width; return { obj: l, apply: k => l.width = +clamp(w0 * k, 0.05, 1).toFixed(3), sync: ['rWidth'] }; }
  return null;
}
const selBoxOf = () => sel === '__subject' ? boxes.__subject : boxes[sel];
let rz = null;
$$('#selBox .gr').forEach(h => {
  h.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    const g = resizeGrip(), b = selBoxOf(); if (!g || !b) return;
    const c = h.dataset.c;
    // anchor on the opposite corner, so that corner stays put while dragging
    const ax = c.includes('w') ? 1 : 0, ay = c.includes('n') ? 1 : 0;
    const anchor = { x: b.x + ax * b.w, y: b.y + ay * b.h };
    const p = canvasPoint(e);
    rz = { g, anchor, ax, ay, d0: Math.max(Math.hypot(p.x - anchor.x, p.y - anchor.y), 8), before: snapshot(), moved: false };
    h.setPointerCapture(e.pointerId);
  });
  h.addEventListener('pointermove', e => {
    if (!rz) return;
    const p = canvasPoint(e);
    rz.g.apply(Math.hypot(p.x - rz.anchor.x, p.y - rz.anchor.y) / rz.d0);
    rz.moved = true;
    renderPreview();                       // synchronous, so `boxes` is fresh below
    const b = selBoxOf();
    if (b) {                               // translate the element so the anchor corner holds
      const o = rz.g.obj;
      o.x = +(o.x + (rz.anchor.x - (b.x + rz.ax * b.w)) / W).toFixed(4);
      o.y = +(o.y + (rz.anchor.y - (b.y + rz.ay * b.h)) / H).toFixed(4);
      renderPreview();
    }
    rz.g.sync.forEach(id => $('#' + id)._sync());
  });
  const end = () => { if (rz) { if (rz.moved) { undoStack.push(rz.before); redoStack = []; updateUndoBtns(); scheduleSave(); } rz = null; } };
  h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
});
// wheel over the canvas zooms the background image
preview.addEventListener('wheel', e => {
  if (doc.bg.type !== 'image' || sel) return; e.preventDefault();
  doc.bg.scale = +clamp(doc.bg.scale * (e.deltaY > 0 ? 0.97 : 1.03), 0.4, 3).toFixed(3);
  $('#bgScale')._sync(); renderAll(); scheduleSave();
}, { passive: false });
preview.addEventListener('pointerup', e => { if (drag?.moved) { undoStack.push(drag.before); redoStack = []; updateUndoBtns(); scheduleSave(); } drag = null; preview.classList.remove('grabbing'); });
preview.addEventListener('dblclick', e => { const id = hitTest(canvasPoint(e)); if (id && id !== '__subject') { select(id); const l = doc.layers.find(x => x.id === id); if (l.type === 'text') { $('#tText').focus(); $('#tText').select(); } } });
window.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName; const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (typing) return; if (!$('#view-editor').classList.contains('active')) return;
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel && sel !== '__subject') { e.preventDefault(); deleteLayer(sel); }
  if (e.key.toLowerCase() === 'd' && sel && sel !== '__subject') { duplicateLayer(sel); }
  if (e.key.toLowerCase() === 'g') $('#btnGuides').click();
  if (e.key.toLowerCase() === 'b' && sel && sel !== '__subject') { const l = doc.layers.find(x => x.id === sel); if (l) { pushUndo(); l.behind = !l.behind; if (l.behind && !doc.subject.on) doc.subject.on = true; commit(); syncAll(); toast(l.behind ? 'Sent behind the subject' : 'Brought in front'); } }
  if (e.key === 'Escape') select(null);
  const l = doc.layers.find(x => x.id === sel) || (sel === '__subject' ? doc.subject : null);
  if (l && /^Arrow/.test(e.key)) { e.preventDefault(); const st = (e.shiftKey ? 10 : 2) / W; if (e.key === 'ArrowLeft') l.x -= st; if (e.key === 'ArrowRight') l.x += st; if (e.key === 'ArrowUp') l.y -= st * W / H; if (e.key === 'ArrowDown') l.y += st * W / H; pushUndo(); commit(); }
});
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); doc = JSON.parse(undoStack.pop()); updateUndoBtns(); syncAll(); scheduleSave(); renderAll(); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); doc = JSON.parse(redoStack.pop()); updateUndoBtns(); syncAll(); scheduleSave(); renderAll(); }
$('#btnUndo').onclick = undo; $('#btnRedo').onclick = redo;
$('#btnGuides').onclick = e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); $('#guides').classList.toggle('on', on); };
$('#btnZoomIn').onclick = () => { zoomMul = Math.min(3, zoomMul * 1.2); renderAll(); };
$('#btnZoomOut').onclick = () => { zoomMul = Math.max(0.3, zoomMul / 1.2); renderAll(); };
new ResizeObserver(() => renderAll()).observe($('#stage'));

// generic binding helpers
function bindRange(id, get, set, fmt = v => v) {
  const el = $('#' + id), lbl = $('#' + id + 'V');
  el.addEventListener('input', () => { set(+el.value); if (lbl) lbl.textContent = fmt(+el.value); renderAll(); });
  el.addEventListener('pointerdown', () => { el._before = snapshot(); });
  el.addEventListener('change', () => { if (el._before) { undoStack.push(el._before); redoStack = []; updateUndoBtns(); el._before = null; } scheduleSave(); });
  el._sync = () => { const v = get(); if (v === undefined) return; el.value = v; if (lbl) lbl.textContent = fmt(v); };
  return el;
}
function bindColor(id, get, set, textId) {
  const el = $('#' + id), t = textId ? $('#' + textId) : null;
  el.addEventListener('input', () => { set(el.value); if (t) t.value = el.value; renderAll(); });
  el.addEventListener('change', () => { pushUndo(); scheduleSave(); });
  if (t) t.addEventListener('change', () => { if (/^#[0-9a-f]{6}$/i.test(t.value)) { set(t.value); el.value = t.value; pushUndo(); commit(); } });
  el._sync = () => { const v = get(); if (v === undefined) return; el.value = v; if (t) t.value = v; };
  return el;
}
function bindChips(containerId, attr, get, set) {
  const c = $('#' + containerId);
  c.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b || !b.dataset[attr]) return; pushUndo(); set(b.dataset[attr]); commit(); syncAll(); });
  c._sync = () => { $$('.chip', c).forEach(b => b.setAttribute('aria-pressed', b.dataset[attr] === get())); };
  return c;
}
function bindToggle(id, get, set) { const b = $('#' + id); b.addEventListener('click', () => { pushUndo(); set(!get()); commit(); syncAll(); }); b._sync = () => b.setAttribute('aria-pressed', !!get()); return b; }
const bound = [];
const L = () => doc.layers.find(l => l.id === sel);
const T = () => { const l = L(); return l && l.type === 'text' ? l : null; };

// background
bound.push(bindChips('bgType', 'v', () => doc.bg.type, v => doc.bg.type = v));
bound.push(bindRange('bgScale', () => doc.bg.scale, v => doc.bg.scale = v, v => v.toFixed(2) + '×'));
bound.push(bindRange('bgX', () => doc.bg.x, v => doc.bg.x = v, v => v.toFixed(2)));
bound.push(bindRange('bgY', () => doc.bg.y, v => doc.bg.y = v, v => v.toFixed(2)));
bound.push(bindRange('bgBlur', () => doc.bg.blur, v => doc.bg.blur = v, v => v + 'px'));
bound.push(bindRange('bgBright', () => doc.bg.bright, v => doc.bg.bright = v, v => v.toFixed(2)));
bound.push(bindRange('bgSat', () => doc.bg.sat, v => doc.bg.sat = v, v => v.toFixed(2)));
bound.push(bindColor('bgColor', () => doc.bg.color, v => doc.bg.color = v, 'bgColorT'));
bound.push(bindColor('bgG1', () => doc.bg.g1, v => doc.bg.g1 = v, 'bgG1T'));
bound.push(bindColor('bgG2', () => doc.bg.g2, v => doc.bg.g2 = v, 'bgG2T'));
bound.push(bindRange('bgAngle', () => doc.bg.angle, v => doc.bg.angle = v, v => v + '°'));
bound.push(bindChips('texKind', 'v', () => doc.bg.tex, v => doc.bg.tex = v));
bound.push(bindColor('texC1', () => doc.bg.tc1, v => doc.bg.tc1 = v));
bound.push(bindColor('texC2', () => doc.bg.tc2, v => doc.bg.tc2 = v));
bound.push(bindRange('texSeed', () => doc.bg.seed, v => doc.bg.seed = v));
bound.push(bindRange('grain', () => doc.grain, v => doc.grain = v, v => Math.round(v * 200) + '%'));
$('#texKind').innerHTML = Object.entries(TEX).map(([k, n]) => `<button class="chip" data-v="${k}">${n}</button>`).join('');
$('#bgSwatches').innerHTML = SWATCH.map(c => `<button class="sw" style="background:${c}" data-c="${c}" title="${c}"></button>`).join('');
$('#bgSwatches').onclick = e => { const c = e.target.dataset.c; if (c) { pushUndo(); doc.bg.color = c; commit(); syncAll(); } };
$('#gradSwatches').innerHTML = GRADS.map(g => `<button class="sw" style="background:linear-gradient(160deg,${g[0]},${g[1]})" data-g="${g.join(',')}"></button>`).join('');
$('#gradSwatches').onclick = e => { const g = e.target.dataset.g; if (g) { pushUndo();[doc.bg.g1, doc.bg.g2] = g.split(','); commit(); syncAll(); } };
bound.push(bindColor('bgPad', () => doc.bg.pad || '#16150f', v => doc.bg.pad = v));
$('#bgFill').onclick = () => { pushUndo(); doc.bg.fit = 'fill'; doc.bg.scale = 1; doc.bg.x = doc.bg.y = 0; commit(); syncAll(); };
$('#bgFit').onclick = () => { pushUndo(); doc.bg.fit = 'fit'; doc.bg.scale = 1; doc.bg.x = doc.bg.y = 0; commit(); syncAll(); };
$('#bgReset').onclick = () => { pushUndo(); doc.bg.scale = 1; doc.bg.x = doc.bg.y = 0; doc.bg.blur = 0; doc.bg.bright = 1; doc.bg.sat = 1; commit(); syncAll(); };

/* Background picker — every photo, upload and generated backdrop as a tile. */
function renderBgPick() {
  const c = $('#bgPick'); if (!c) return; c.innerHTML = '';
  const add = document.createElement('button'); add.className = 'addtile'; add.title = 'Upload an image from your computer';
  add.innerHTML = '+<small>UPLOAD</small>'; add.onclick = () => bgUploadFlow(); c.appendChild(add);
  [...assetsOf('photo'), ...assetsOf('bg')].forEach(a => {
    const b = document.createElement('button'); b.title = a.name; b.setAttribute('aria-pressed', doc.bg.type === 'image' && doc.bg.image === a.id);
    const im = new Image(); im.src = a.url; im.alt = a.name; b.appendChild(im);
    if (!a.builtin) { const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.title = 'Remove'; x.onclick = async e => { e.stopPropagation(); if (!confirm(`Remove “${a.name}”?`)) return; await store.deleteAsset(a.id); if (doc.bg.image === a.id) { doc.bg.image = assetsOf('photo')[0]?.id || 'photo'; commit(); } renderBgPick(); refreshAssetSelects(); }; b.appendChild(x); }
    b.onclick = () => { pushUndo(); doc.bg.type = 'image'; doc.bg.image = a.id; commit(); syncAll(); };
    c.appendChild(b);
  });
}
function bgUploadFlow() { pickFile(f => setBackgroundFromFile(f)); }
async function setBackgroundFromFile(f) {
  if (!f.type.startsWith('image/')) return toast('That file isn’t an image');
  setStatus('adding image…');
  const rec = await store.putAsset(f, 'bg', f.name.replace(/\.[^.]+$/, '').slice(0, 40));
  await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = rec.url; imgCache[rec.id] = im; });
  pushUndo(); doc.bg.type = 'image'; doc.bg.image = rec.id; doc.bg.fit = 'fill'; doc.bg.scale = 1; doc.bg.x = doc.bg.y = 0;
  commit(); syncAll(); renderBgPick(); toast('Background set — drag the canvas to reposition');
}
$('#bgUpload').onclick = bgUploadFlow;
// drag a file straight onto the canvas
const dz = $('#dropZone'); let dzDepth = 0;
['dragenter', 'dragover'].forEach(ev => $('#stage').addEventListener(ev, e => { if (![...e.dataTransfer.types].includes('Files')) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; if (ev === 'dragenter') dzDepth++; dz.classList.add('on'); }));
$('#stage').addEventListener('dragleave', () => { if (--dzDepth <= 0) { dzDepth = 0; dz.classList.remove('on'); } });
$('#stage').addEventListener('drop', async e => {
  e.preventDefault(); dzDepth = 0; dz.classList.remove('on');
  // The first photo goes into the cover being edited; any others become covers
  // of their own, so a whole shoot can be dropped in one go.
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  const f = files[0]; if (!f) return toast('That isn’t an image file');
  const rest = files.slice(1);
  let done = false;
  if (f.type === 'image/png' || f.type === 'image/webp') { // transparency? treat as a cutout
    const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = URL.createObjectURL(f); });
    if (im && hasAlpha(im)) { const rec = await store.putAsset(f, 'cutout', f.name.replace(/\.[^.]+$/, '')); pushUndo(); doc.subject = { ...doc.subject, on: true, image: rec.id }; commit(); syncAll(); refreshAssetSelects(); toast('Added as a subject cutout'); done = true; }
  }
  if (!done) await setBackgroundFromFile(f);
  if (rest.length) await coversFromFiles(rest);
});
/* Dropping a photo on the profile grid turns it straight into an example cover:
   the picture as the background with a template's type over it. The shipped
   subject cutout is switched off — it is a different person's silhouette and
   would look wrong pasted over a new photo. Templates cycle, so dropping a
   batch gives a varied grid instead of the same caption nine times. */
const dtHasFiles = e => [...(e.dataTransfer ? e.dataTransfer.types : [])].includes('Files');
let tplCycle = 0;
async function coverFromImage(f, at) {
  const rec = await store.putAsset(f, 'bg', f.name.replace(/\.[^.]+$/, '').slice(0, 40));
  await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = rec.url; imgCache[rec.id] = im; });
  const d = TEMPLATES[tplCycle++ % TEMPLATES.length].make();
  d.id = uid(); d.createdAt = d.updatedAt = Date.now(); d.name = rec.name || 'Dropped cover';
  d.bg = { ...d.bg, type: 'image', image: rec.id, fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1 };
  d.subject = { ...d.subject, on: false };
  const cr = { id: d.id, name: d.name, createdAt: d.createdAt, updatedAt: d.updatedAt, doc: d, versions: [] };
  covers.push(cr);
  try { await store.saveCover(cr); } catch (e) { console.warn(e); }
  if (!Array.isArray(settings.gridOrder)) settings.gridOrder = [];
  const o = settings.gridOrder;
  o.splice(at == null ? o.length : clamp(at, 0, o.length), 0, d.id);
  saveSettingsSoon();
  return cr;
}
async function coversFromFiles(files, at) {
  const imgs = [...files].filter(f => f.type.startsWith('image/'));
  if (!imgs.length) return toast('That isn’t an image file');
  setStatus('building covers…');
  for (let i = 0; i < imgs.length; i++) await coverFromImage(imgs[i], at == null ? null : at + i);
  renderGrid(); renderCoverList(); setStatus('saved · this browser', 'ok');
  toast(imgs.length === 1 ? 'Added as a cover — double-click it to open' : `Added ${imgs.length} covers — double-click one to open`);
}
/* Mark an element as a place photos can be dropped to become covers. getAt()
   says where in the grid order the first one lands. */
function wireCoverDrop(el, getAt) {
  el.addEventListener('dragover', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; el.classList.add('filedrop'); });
  el.addEventListener('dragleave', () => el.classList.remove('filedrop'));
  el.addEventListener('drop', e => {
    if (!dtHasFiles(e)) return;
    e.preventDefault(); e.stopPropagation(); el.classList.remove('filedrop');
    coversFromFiles(e.dataTransfer.files, getAt());
  });
}
// Drops in the gaps between tiles land at the end of the grid.
wireCoverDrop($('#igrid'), () => null);
// A file dropped anywhere else would otherwise make the browser navigate to it.
['dragover', 'drop'].forEach(ev => window.addEventListener(ev, e => { if (dtHasFiles(e)) e.preventDefault(); }));
function hasAlpha(im) {
  const c = document.createElement('canvas'); const n = 64; c.width = c.height = n; const x = c.getContext('2d'); x.drawImage(im, 0, 0, n, n);
  const d = x.getImageData(0, 0, n, n).data; let clear = 0; for (let i = 3; i < d.length; i += 4) if (d[i] < 24) clear++;
  return clear > n * n * 0.06;
}
// subject
bound.push(bindToggle('subjOn', () => doc.subject.on, v => doc.subject.on = v));
$('#subjImage').addEventListener('change', e => { pushUndo(); doc.subject.image = e.target.value; commit(); });
bound.push(bindRange('subjScale', () => doc.subject.scale, v => doc.subject.scale = v, v => Math.round(v * 100) + '%'));
bound.push(bindRange('subjX', () => doc.subject.x, v => doc.subject.x = v, v => v.toFixed(2)));
bound.push(bindRange('subjY', () => doc.subject.y, v => doc.subject.y = v, v => v.toFixed(2)));
bound.push(bindRange('subjShadow', () => doc.subject.shadow, v => doc.subject.shadow = v, v => Math.round(v * 100) + '%'));
bound.push(bindRange('subjSat', () => doc.subject.sat, v => doc.subject.sat = v, v => v.toFixed(2)));
bound.push(bindToggle('subjFlip', () => doc.subject.flip, v => doc.subject.flip = v));
// overlay
bound.push(bindChips('ovType', 'v', () => doc.overlay.type, v => doc.overlay.type = v));
bound.push(bindColor('ovColor', () => doc.overlay.color, v => doc.overlay.color = v));
bound.push(bindRange('ovOpacity', () => doc.overlay.opacity, v => doc.overlay.opacity = v, v => Math.round(v * 100) + '%'));
// text props
$('#tFont').innerHTML = FONTS.map(f => `<option value="${f.n}" style="font-family:'${f.n}'">${f.n}</option>`).join('');
$('#tText').addEventListener('input', () => { const l = T(); if (l) { const was = l.text; l.text = $('#tText').value; l.spans = remapSpans(l.spans, was, l.text); renderAll(); renderLayers(); } });
$('#tText').addEventListener('focus', () => { $('#tText')._before = snapshot(); });
$('#tText').addEventListener('blur', () => { const b = $('#tText')._before; if (b && b !== snapshot()) { undoStack.push(b); redoStack = []; updateUndoBtns(); scheduleSave(); } });
$('#tFont').addEventListener('change', () => { const l = T(); if (l) { pushUndo(); l.font = $('#tFont').value; const f = FONTS.find(x => x.n === l.font); if (!f.w.includes(l.weight)) l.weight = f.w.includes(700) ? 700 : f.w[f.w.length - 1]; commit(); syncAll(); } });
bound.push(bindToggle('tWeight', () => T()?.weight >= 600, v => { const l = T(); if (l) { const f = FONTS.find(x => x.n === l.font); l.weight = v ? (f.w.filter(w => w >= 600)[0] || f.w[f.w.length - 1]) : f.w[0]; } }));
bound.push(bindToggle('tItalic', () => T()?.italic, v => { const l = T(); if (l) l.italic = v; }));
bound.push(bindToggle('tUpper', () => T()?.upper, v => { const l = T(); if (l) l.upper = v; }));
bound.push(bindRange('tSize', () => T()?.size, v => { const l = T(); if (l) l.size = v; }));
bound.push(bindRange('tLine', () => T()?.line, v => { const l = T(); if (l) l.line = v; }, v => v.toFixed(2)));
bound.push(bindRange('tTrack', () => T()?.track, v => { const l = T(); if (l) l.track = v; }, v => (v * 100).toFixed(0)));
bound.push(bindRange('tWidth', () => T()?.width, v => { const l = T(); if (l) l.width = v; }, v => Math.round(v * 100) + '%'));
const alChips = $('[data-al]').parentElement; bound.push(bindChips(alChips.id || (alChips.id = 'alChips'), 'al', () => T()?.align, v => { const l = T(); if (l) l.align = v; }));
bound.push(bindColor('tColor', () => T()?.color, v => { const l = T(); if (l) l.color = v; }));
$('#tSwatches').innerHTML = SWATCH.slice(0, 8).map(c => `<button class="sw" style="background:${c};width:16px;height:16px" data-c="${c}"></button>`).join('');
$('#tSwatches').onclick = e => { const c = e.target.dataset.c, l = T(); if (c && l) { pushUndo(); l.color = c; commit(); syncAll(); } };
/* Part colour — recolour just the words selected in the text box, so one
   heading can carry an accent without being split into separate layers. The
   selection is mirrored into `tSel` because clicking a swatch moves focus, and
   it is reset whenever the inspector switches to a different layer. */
let tSel = null, tSelFor = null, tSpanBefore = null;
const tTextEl = $('#tText');
function captureSel() {
  const a = tTextEl.selectionStart, b = tTextEl.selectionEnd;
  tSel = b > a ? { s: a, e: b } : null;
  syncSpanUI();
}
['keyup', 'mouseup', 'select', 'focus', 'click', 'input'].forEach(ev => tTextEl.addEventListener(ev, captureSel));
document.addEventListener('selectionchange', () => { if (document.activeElement === tTextEl) captureSel(); });
function syncSpanUI() {
  const l = T(), live = !!(l && tSel);
  $('#tSpanRow').style.opacity = live ? 1 : .45;
  $('#tSpanColor').disabled = !live; $('#tSpanSwatches').style.pointerEvents = live ? '' : 'none';
  const n = normSpans(l).length;
  $('#tSpanClear').disabled = !l || (!live && !n);
  $('#tSpanHint').textContent = live
    ? `Colouring “${(l.upper ? upperKeepLen(l.text) : l.text).slice(tSel.s, tSel.e)}”.`
    : n ? `${n} coloured ${n === 1 ? 'part' : 'parts'} on this layer. Select words above to change them, or Clear to reset all.`
      : 'Select words in the box above, then pick a colour to accent just that part.';
}
function applySpan(c) {
  const l = T(); if (!l || !tSel) return;
  l.spans = clipSpans(normSpans(l), tSel.s, tSel.e).concat([{ s: tSel.s, e: tSel.e, color: c }]).sort((a, b) => a.s - b.s);
  renderAll(); renderLayers(); syncSpanUI();
  tTextEl.focus(); tTextEl.setSelectionRange(tSel.s, tSel.e);
}
$('#tSpanSwatches').innerHTML = SWATCH.slice(0, 8).map(c => `<button class="sw" style="background:${c};width:16px;height:16px" data-c="${c}" title="${c}"></button>`).join('');
// Hold the selection: a mousedown on these controls would otherwise blur the textarea.
['#tSpanSwatches', '#tSpanClear'].forEach(s => $(s).addEventListener('mousedown', e => e.preventDefault()));
$('#tSpanSwatches').onclick = e => { const c = e.target.dataset.c; if (c && tSel) { pushUndo(); applySpan(c); scheduleSave(); } };
$('#tSpanColor').addEventListener('input', e => { if (!tSpanBefore) tSpanBefore = snapshot(); applySpan(e.target.value); });
$('#tSpanColor').addEventListener('change', () => { if (tSpanBefore) { undoStack.push(tSpanBefore); redoStack = []; updateUndoBtns(); tSpanBefore = null; scheduleSave(); } });
$('#tSpanClear').onclick = () => {
  const l = T(); if (!l) return;
  pushUndo();
  l.spans = tSel ? clipSpans(normSpans(l), tSel.s, tSel.e) : [];
  commit(); renderLayers(); syncSpanUI();
  if (tSel) { tTextEl.focus(); tTextEl.setSelectionRange(tSel.s, tSel.e); }
};
const boxChips = $('[data-box]').parentElement; bound.push(bindChips(boxChips.id || (boxChips.id = 'boxChips'), 'box', () => T()?.box, v => { const l = T(); if (l) l.box = v; }));
bound.push(bindColor('tBoxColor', () => T()?.boxColor, v => { const l = T(); if (l) l.boxColor = v; }));
bound.push(bindRange('tBoxAlpha', () => T()?.boxAlpha, v => { const l = T(); if (l) l.boxAlpha = v; }));
bound.push(bindRange('tShadow', () => T()?.shadow, v => { const l = T(); if (l) l.shadow = v; }, v => Math.round(v * 100) + '%'));
bound.push(bindRange('tOutline', () => T()?.outline, v => { const l = T(); if (l) l.outline = v; }));
bound.push(bindRange('tRot', () => T()?.rot, v => { const l = T(); if (l) l.rot = v; }, v => v + '°'));
bound.push(bindToggle('tBehind', () => T()?.behind, v => { const l = T(); if (l) { l.behind = v; if (v && !doc.subject.on) doc.subject.on = true; } }));
// rule props
const R = () => { const l = L(); return l && l.type === 'rule' ? l : null; };
bound.push(bindRange('rWidth', () => R()?.width, v => { const l = R(); if (l) l.width = v; }, v => Math.round(v * 100) + '%'));
bound.push(bindRange('rThick', () => R()?.thick, v => { const l = R(); if (l) l.thick = v; }));
bound.push(bindColor('rColor', () => R()?.color, v => { const l = R(); if (l) l.color = v; }));
bound.push(bindRange('rAlpha', () => R()?.alpha, v => { const l = R(); if (l) l.alpha = v; }));
// logo props
const G = () => { const l = L(); return l && l.type === 'logo' ? l : null; };
$('#lImage').addEventListener('change', () => { const l = G(); if (l) { pushUndo(); l.image = $('#lImage').value || null; commit(); } });
$('#lUpload').onclick = () => pickFile(async f => { const rec = await store.putAsset(f, 'logo', f.name); const l = G(); if (l) { pushUndo(); l.image = rec.id; commit(); } syncAll(); refreshAssetSelects(); });
bound.push(bindRange('lSize', () => G()?.size, v => { const l = G(); if (l) l.size = v; }, v => Math.round(v * 100) + '%'));
bound.push(bindRange('lAlpha', () => G()?.alpha, v => { const l = G(); if (l) l.alpha = v; }, v => Math.round(v * 100) + '%'));
bound.push(bindToggle('lInvert', () => G()?.invert, v => { const l = G(); if (l) l.invert = v; }));
// name
$('#docName').addEventListener('change', () => { doc.name = $('#docName').value || 'Untitled cover'; scheduleSave(); });
// layer actions
$('#addText').onclick = () => addLayer(newText({ y: 0.5 + Math.random() * 0.2 }));
$('#addBadge').onclick = () => addLayer(newText({ text: 'NEW EPISODE', font: 'JetBrains Mono', weight: 500, size: 30, track: 0.16, upper: true, box: 'pill', boxColor: '#d9a441', boxAlpha: 1, color: '#16150f', shadow: 0, y: 0.12, x: 0.07 }));
$('#addRule').onclick = () => addLayer(newRule());
$('#addLogo').onclick = () => addLayer(newLogo({ image: assetsOf('logo')[0]?.id || null }));
$('#dupLayer').onclick = () => duplicateLayer(sel);
$('#delLayer').onclick = $('#delRule').onclick = $('#delLogo').onclick = () => deleteLayer(sel);
function addLayer(l) { pushUndo(); doc.layers.push(l); select(l.id); commit(); }
function duplicateLayer(id) { const l = doc.layers.find(x => x.id === id); if (!l) return; pushUndo(); const c = { ...l, id: uid(), y: l.y + 0.04 }; doc.layers.splice(doc.layers.indexOf(l) + 1, 0, c); select(c.id); commit(); }
function deleteLayer(id) { const i = doc.layers.findIndex(x => x.id === id); if (i < 0) return; pushUndo(); doc.layers.splice(i, 1); select(null); commit(); }
function moveLayer(id, dir) { const i = doc.layers.findIndex(x => x.id === id); const j = i + dir; if (i < 0 || j < 0 || j >= doc.layers.length) return; pushUndo();[doc.layers[i], doc.layers[j]] = [doc.layers[j], doc.layers[i]]; commit(); renderLayers(); }
function select(id) { sel = id; renderLayers(); syncProps(); drawSelection(stageZoom()); }
function renderLayers() {
  const c = $('#layerList'); c.innerHTML = '';
  const items = [...doc.layers].reverse();
  if (!items.length) c.innerHTML = '<div class="empty">No layers yet — add a caption.</div>';
  items.forEach(l => {
    const d = document.createElement('div'); d.className = 'layer'; d.setAttribute('aria-selected', l.id === sel);
    const name = l.type === 'text' ? (l.text.split('\n')[0] || '(empty)') : l.type === 'rule' ? 'Rule' : 'Logo';
    d.innerHTML = `<span class="k">${l.type === 'text' ? 'T' : l.type === 'rule' ? '—' : 'IMG'}</span><span class="nm">${escapeHtml(name)}</span><span class="acts"><button class="depth" aria-pressed="${!!l.behind}" title="${l.behind ? 'Behind the subject — click to bring in front' : 'In front — click to send behind the subject'}">${l.behind ? 'BHD' : 'FRT'}</button><button class="icon small" title="Up">▲</button><button class="icon small" title="Down">▼</button></span>`;
    d.onclick = () => select(l.id);
    const [dp, up, dn] = $$('button', d);
    dp.onclick = e => { e.stopPropagation(); pushUndo(); l.behind = !l.behind; if (l.behind && !doc.subject.on) { doc.subject.on = true; toast('Subject cutout switched on so the layer sits behind it'); } commit(); syncAll(); };
    up.onclick = e => { e.stopPropagation(); moveLayer(l.id, +1); }; dn.onclick = e => { e.stopPropagation(); moveLayer(l.id, -1); };
    c.appendChild(d);
  });
  const sd = document.createElement('div'); sd.className = 'layer'; sd.setAttribute('aria-selected', sel === '__subject');
  sd.innerHTML = `<span class="k">CUT</span><span class="nm">Subject cutout${doc.subject.on ? '' : ' (off)'}</span><span class="acts"><button class="depth" aria-pressed="${doc.subject.on}" title="Toggle the cutout">${doc.subject.on ? 'ON' : 'OFF'}</button></span>`;
  $('button', sd).onclick = e => { e.stopPropagation(); pushUndo(); doc.subject.on = !doc.subject.on; commit(); syncAll(); };
  sd.onclick = () => select('__subject'); c.appendChild(sd);
  const note = document.createElement('div'); note.className = 'empty'; note.style.fontStyle = 'normal';
  note.innerHTML = `<span class="mono" style="color:var(--teal)">BHD</span> layers draw behind the cutout · <span class="mono">FRT</span> in front. Shortcut <kbd>B</kbd>.`;
  c.appendChild(note);
}
function syncProps() {
  const l = L(); $('#propText').hidden = !(l && l.type === 'text'); $('#propRule').hidden = !(l && l.type === 'rule'); $('#propLogo').hidden = !(l && l.type === 'logo');
  if (l && l.type === 'text') {
    $('#tText').value = l.text; $('#tFont').value = l.font;
    if (tSelFor !== l.id) { tSel = null; tSelFor = l.id; }   // a stale selection belongs to the old layer
    syncSpanUI();
  }
  if (l && l.type === 'logo') $('#lImage').value = l.image || '';
  bound.forEach(b => b._sync());
  focusPropPanel();
}
/* Lift the selected layer's panel (and Layers under it) to the top of the
   inspector, so editing a caption never means scrolling past Background and
   Overlay to reach it. Only re-scrolls and flashes when the selection actually
   changes — syncProps also runs on every slider tick. */
let poppedFor = null;
function focusPropPanel() {
  const insp = $('#inspector'); if (!insp) return;
  const active = sel === '__subject' ? $('#secSubject') : [$('#propText'), $('#propRule'), $('#propLogo')].find(p => !p.hidden);
  $$('#inspector > .sec').forEach(s => s.style.order = active ? '3' : '');
  if (!active) { poppedFor = null; return; }
  active.style.order = '0';
  $('#secLayers').style.order = '1';
  if (poppedFor !== sel) {
    poppedFor = sel;
    insp.scrollTop = 0;
    active.classList.remove('popped'); void active.offsetWidth; active.classList.add('popped');
  }
}
function syncPropsLite() { ['subjX', 'subjY'].forEach(id => $('#' + id)._sync()); }
function syncAll() {
  $('#docName').value = doc.name;
  $('#bgImageCtl').hidden = doc.bg.type !== 'image'; $('#bgSolidCtl').hidden = doc.bg.type !== 'solid'; $('#bgGradCtl').hidden = doc.bg.type !== 'gradient'; $('#bgTexCtl').hidden = doc.bg.type !== 'texture';
  $('#subjCtl').style.opacity = doc.subject.on ? 1 : .45;
  refreshAssetSelects(); renderBgPick(); $('#subjImage').value = doc.subject.image;
  renderLayers(); syncProps();
}
function refreshAssetSelects() {
  const opt = list => list.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  $('#subjImage').innerHTML = opt(assetsOf('cutout'));
  $('#lImage').innerHTML = '<option value="">— none —</option>' + opt(assetsOf('logo'));
}
function pickFile(cb, accept = 'image/*') { const fi = $('#fileInput'); fi.accept = accept; fi.value = ''; fi.onchange = () => { if (fi.files[0]) cb(fi.files[0]); }; fi.click(); }

/* ---------------- covers library ---------------- */
function loadDoc(d) { clearTimeout(saveTimer); doc = JSON.parse(JSON.stringify(d)); sel = null; undoStack = []; redoStack = []; updateUndoBtns(); syncAll(); renderAll(); renderCoverList(); renderVersions(); setStatus('saved · this browser', 'ok'); }
function thumbCanvas(d, cssW) { const c = document.createElement('canvas'); renderTo(c, d, cssW); return c; }
function renderCoverList() {
  const c = $('#coverList'); c.innerHTML = '';
  const list = [...covers].sort((a, b) => b.updatedAt - a.updatedAt);
  if (!list.length) c.innerHTML = '<div class="empty">No covers yet.</div>';
  list.forEach(r => {
    const d = document.createElement('div'); d.className = 'cover-item'; d.setAttribute('aria-current', r.id === doc?.id);
    const th = thumbCanvas(r.id === doc?.id ? doc : r.doc, 38 * 2); th.style.width = '38px'; th.style.height = '68px';
    d.appendChild(th);
    const info = document.createElement('div'); info.innerHTML = `<div class="nm">${escapeHtml(r.name)}</div><div class="meta">${fmtTime(r.updatedAt)} · ${(r.versions || []).length} ver</div>`; d.appendChild(info);
    const acts = document.createElement('div'); acts.innerHTML = `<button class="icon small ghost" title="Duplicate">⧉</button><button class="icon small ghost" title="Delete">✕</button>`;
    const [dup, del] = $$('button', acts);
    dup.onclick = async e => { e.stopPropagation(); const nd = JSON.parse(JSON.stringify(r.id === doc.id ? doc : r.doc)); nd.id = uid(); nd.name = r.name + ' copy'; nd.createdAt = Date.now(); loadDoc(nd); await persistCurrent(); };
    del.onclick = async e => { e.stopPropagation(); if (!confirm(`Delete “${r.name}” and its history?`)) return; await store.deleteCover(r.id); covers = covers.filter(x => x.id !== r.id); settings.gridOrder = (settings.gridOrder || []).filter(x => x !== r.id); await store.saveSettings(settings); if (r.id === doc.id) { if (covers[0]) loadDoc(covers[0].doc); else newCover(); } renderCoverList(); renderGrid(); };
    d.appendChild(acts); d.onclick = () => { if (r.id !== doc.id) loadDoc(r.doc); }; c.appendChild(d);
  });
}
function renderVersions() {
  const c = $('#versionList'); c.innerHTML = ''; const r = coverRec(); const vs = r?.versions || [];
  if (!vs.length) { c.innerHTML = '<div class="empty">Press “Save version” to snapshot this cover. Autosave keeps the latest state.</div>'; return; }
  vs.forEach((v, i) => { const d = document.createElement('div'); d.className = 'ver'; d.innerHTML = `<span class="t">${fmtTime(v.at)}</span><span><button class="small ghost">Restore</button></span>`; $('button', d).onclick = () => { pushUndo(); const cur = doc.id; doc = JSON.parse(JSON.stringify(v.doc)); doc.id = cur; syncAll(); commit(); toast('Version restored'); }; c.appendChild(d); });
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function newCover(tpl) { const d = tpl ? tpl.make() : baseDoc(); d.id = uid(); if (!tpl) d.layers = [newText({ text: 'Your caption here', y: 0.7 })]; loadDoc(d); persistCurrent(); }
$('#btnNew').onclick = () => newCover();
$('#btnBackup').onclick = async () => {
  setStatus('packing library…');
  const data = await store.exportLibrary();
  await store.download(`reel-covers-library-${new Date().toISOString().slice(0, 10)}.json`, new Blob([JSON.stringify(data)], { type: 'application/json' }));
  setStatus('saved in this browser', 'ok'); toast(`Backed up ${data.covers.length} covers and ${data.images.length} images`);
};
$('#btnRestore').onclick = () => pickFile(async f => {
  let json; try { json = JSON.parse(await f.text()); } catch { return toast('That file isn’t valid JSON'); }
  const replace = confirm('OK = replace everything currently in this browser.\nCancel = merge the backup into what’s already here.');
  setStatus('restoring…');
  try { await store.importLibrary(json, replace ? 'replace' : 'merge'); } catch (e) { setStatus('restore failed', 'warn'); return toast(e.message); }
  await store.loadAssets(); covers = await store.listCovers(); settings = { ...settings, ...(await store.getSettings()) }; settings.gridOrder = settings.gridOrder || [];
  refreshAssetSelects(); renderCoverList(); renderGrid();
  const first = [...covers].sort((x, y) => y.updatedAt - x.updatedAt)[0]; if (first) loadDoc(first.doc);
  toast(`Restored ${(json.covers || []).length} covers`);
}, 'application/json,.json');
$('#btnSaveVersion').onclick = async () => { await persistCurrent(true); toast('Version saved'); };
function renderTemplates() {
  const c = $('#tplGrid'); c.innerHTML = '';
  TEMPLATES.forEach(t => { const d = t.make(); requestFonts(d); const b = document.createElement('button'); b.className = 'tpl'; b.title = t.name; const cv = thumbCanvas(d, 140); b.appendChild(cv); const s = document.createElement('span'); s.textContent = t.name; b.appendChild(s); b.onclick = () => newCover(t); c.appendChild(b); });
}

/* ---------------- export ---------------- */
async function renderBlob(d, scale, type = 'png') {
  await Promise.allSettled([...fontReq].map(k => document.fonts.load(k)));
  const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale; render(c.getContext('2d'), d, scale, null);
  return new Promise(res => c.toBlob(res, type === 'jpg' ? 'image/jpeg' : 'image/png', 0.94));
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
$('#btnExport').onclick = async () => {
  const v = $('#exportScale').value; const scale = v === 'jpg' ? 1 : +v; const type = v === 'jpg' ? 'jpg' : 'png';
  setStatus('rendering…'); const blob = await renderBlob(doc, scale, type);
  const ok = await store.download(`${slug(doc.name)}-${W * scale}x${H * scale}.${type}`, blob); toast(ok ? 'Exported' : 'Export cancelled'); setStatus('saved', 'ok');
};
$('#btnExportAll').onclick = async () => {
  if (!covers.length) return toast('Nothing to export');
  toast('Rendering ' + covers.length + ' covers…'); const zip = new JSZip(); const order = gridOrdered();
  for (let i = 0; i < order.length; i++) { const r = order[i]; const d = r.id === doc.id ? doc : r.doc; zip.file(`${String(i + 1).padStart(2, '0')}-${slug(r.name)}.png`, await renderBlob(d, 1)); }
  const blob = await zip.generateAsync({ type: 'blob' }); await store.download('reel-covers.zip', blob);
};

/* ---------------- grid view ---------------- */
function gridOrdered() { const inGrid = (settings.gridOrder || []).map(id => covers.find(c => c.id === id)).filter(Boolean); const rest = covers.filter(c => !settings.gridOrder?.includes(c.id)).sort((a, b) => b.updatedAt - a.updatedAt); return [...inGrid, ...rest]; }
let gridDrag = null;
function renderGrid() {
  if (!$('#view-grid').classList.contains('active')) return;
  $('#phHandle').textContent = settings.handle;
  $('#phName').textContent = settings.name;
  $('#phCat').textContent = settings.category || '';
  $('#phCat').hidden = !settings.category;
  $('#phBio').innerHTML = escapeHtml(settings.bio || '').replace(/\n/g, '<br>');
  const lk = $('#phLink'); lk.textContent = settings.link || ''; lk.hidden = !settings.link;
  const fb = $('#phFollowedBy');
  if (settings.followedBy) fb.innerHTML = `<span class="faces"><i style="background:#5b6b3a"></i><i style="background:#b8412e"></i><i style="background:#2b2b6d"></i></span><span>Followed by <b>${escapeHtml(settings.followedBy)}</b></span>`;
  else fb.innerHTML = '';
  const av = $('#phAvatar'), avAsset = settings.avatar && assets[settings.avatar];
  av.innerHTML = ''; if (avAsset) { const i = new Image(); i.src = avAsset.url; i.alt = ''; av.appendChild(i); } else av.textContent = (settings.name || '?').trim()[0].toUpperCase();
  $('#phFollowers').textContent = settings.followers || '0';
  $('#phFollowing').textContent = settings.following || '0';
  PROFILE_FIELDS.forEach(([id, key]) => { const el = $('#' + id); if (el && document.activeElement !== el) el.value = settings[key] || ''; });
  $('#gShape916').setAttribute('aria-pressed', settings.shape !== '34'); $('#gShape34').setAttribute('aria-pressed', settings.shape === '34');
  const ig = $('#igrid'); ig.className = 'igrid' + (settings.shape === '34' ? ' crop34' : ''); ig.innerHTML = '';
  const order = (settings.gridOrder || []).map(id => covers.find(c => c.id === id)).filter(Boolean);
  $('#phPosts').textContent = settings.posts || order.length;
  const n = Math.max(9, Math.ceil(order.length / 3) * 3);
  for (let i = 0; i < n; i++) {
    const t = document.createElement('div'); t.className = 'tile'; const r = order[i];
    if (r) { const d = r.id === doc?.id ? doc : r.doc; t.innerHTML = `<div class="play"></div><div class="views">▶ ${(3.1 + (i * 7 % 11)).toFixed(1)}K</div>`; t.prepend(thumbCanvas(d, 130 * 2)); t.draggable = true; t.dataset.id = r.id; t.title = r.name;
      t.addEventListener('dragstart', e => { gridDrag = r.id; e.dataTransfer.effectAllowed = 'move'; }); t.addEventListener('dragover', e => { if (dtHasFiles(e)) return; e.preventDefault(); t.classList.add('drop'); }); t.addEventListener('dragleave', () => t.classList.remove('drop'));
      t.addEventListener('drop', e => { if (dtHasFiles(e)) return; e.preventDefault(); t.classList.remove('drop'); reorderGrid(gridDrag, r.id); });
      t.addEventListener('dblclick', () => { loadDoc(d); switchView('editor'); });
      wireCoverDrop(t, () => i);                       // a photo dropped here lands in this slot
    } else {
      t.classList.add('ph'); t.textContent = i === order.length ? 'drop a photo' : '';
      t.addEventListener('dragover', e => { if (dtHasFiles(e)) return; e.preventDefault(); });
      t.addEventListener('drop', e => { if (dtHasFiles(e)) return; e.preventDefault(); if (gridDrag && !settings.gridOrder.includes(gridDrag)) { settings.gridOrder.push(gridDrag); saveSettingsSoon(); renderGrid(); } });
      wireCoverDrop(t, () => Math.min(i, order.length));
    }
    ig.appendChild(t);
  }
  const gl = $('#gridList'); gl.innerHTML = ''; $('#gridEmpty').hidden = order.length > 0;
  order.forEach(r => gl.appendChild(gridRow(r, true)));
  const pool = $('#gridPool'); pool.innerHTML = ''; covers.filter(c => !settings.gridOrder.includes(c.id)).sort((a, b) => b.updatedAt - a.updatedAt).forEach(r => pool.appendChild(gridRow(r, false)));
  if (!pool.children.length) pool.innerHTML = '<div class="empty">Every cover is placed.</div>';
}
function gridRow(r, inGrid) {
  const d = document.createElement('div'); d.className = 'gl'; d.draggable = true;
  d.innerHTML = `<span>${escapeHtml(r.name)}</span><span class="acts">${inGrid ? '<button class="icon small ghost" title="Earlier (down)">▼</button><button class="icon small ghost" title="Later (up)">▲</button><button class="icon small ghost" title="Remove">✕</button>' : '<button class="small">Add</button>'}</span>`;
  d.prepend(thumbCanvas(r.id === doc?.id ? doc : r.doc, 26 * 2));
  d.addEventListener('dragstart', () => { gridDrag = r.id; d.classList.add('dragging'); }); d.addEventListener('dragend', () => d.classList.remove('dragging'));
  d.addEventListener('dragover', e => e.preventDefault()); d.addEventListener('drop', e => { e.preventDefault(); if (inGrid) reorderGrid(gridDrag, r.id); });
  const bs = $$('button', d);
  if (inGrid) { bs[0].onclick = () => shiftGrid(r.id, +1); bs[1].onclick = () => shiftGrid(r.id, -1); bs[2].onclick = () => { settings.gridOrder = settings.gridOrder.filter(x => x !== r.id); saveSettingsSoon(); renderGrid(); }; }
  else bs[0].onclick = () => { settings.gridOrder.push(r.id); saveSettingsSoon(); renderGrid(); };
  return d;
}
function reorderGrid(fromId, toId) { if (!fromId || fromId === toId) return; const o = settings.gridOrder.filter(x => x !== fromId); const i = o.indexOf(toId); o.splice(i < 0 ? o.length : i, 0, fromId); settings.gridOrder = o; saveSettingsSoon(); renderGrid(); }
function shiftGrid(id, dir) { const o = settings.gridOrder; const i = o.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= o.length) return;[o[i], o[j]] = [o[j], o[i]]; saveSettingsSoon(); renderGrid(); }
let settingsTimer; function saveSettingsSoon() { clearTimeout(settingsTimer); settingsTimer = setTimeout(() => store.saveSettings(settings).catch(() => {}), 600); }
$('#gAddAll').onclick = () => { settings.gridOrder = [...new Set([...settings.gridOrder, ...covers.sort((a, b) => b.updatedAt - a.updatedAt).map(c => c.id)])]; saveSettingsSoon(); renderGrid(); };
$('#gClear').onclick = () => { settings.gridOrder = []; saveSettingsSoon(); renderGrid(); };
const PROFILE_FIELDS = [['gHandle', 'handle'], ['gName', 'name'], ['gCat', 'category'], ['gBio', 'bio'], ['gLink', 'link'], ['gPosts', 'posts'], ['gFollowers', 'followers'], ['gFollowing', 'following'], ['gFollowedBy', 'followedBy']];
PROFILE_FIELDS.forEach(([id, key]) => $('#' + id).addEventListener('input', e => { settings[key] = e.target.value; saveSettingsSoon(); renderGrid(); }));
$('#gAvatar').onclick = () => pickFile(async f => { const rec = await store.putAsset(f, 'avatar', 'profile picture'); settings.avatar = rec.id; saveSettingsSoon(); renderGrid(); });
$('#gAvatarClear').onclick = async () => { const id = settings.avatar; settings.avatar = null; saveSettingsSoon(); renderGrid(); if (id) await store.deleteAsset(id); };
$('#gShape916').onclick = () => { settings.shape = '916'; saveSettingsSoon(); renderGrid(); };
$('#gShape34').onclick = () => { settings.shape = '34'; saveSettingsSoon(); renderGrid(); };

/* ---------------- cutout view ---------------- */
const cut = { photo: 'photo', cutout: 'cutout', bg: null, candidate: null, candidateMask: null, seg: null };
const CUT_BGS = {
  solids: SWATCH.map(c => ({ type: 'solid', color: c })),
  grads: GRADS.map(g => ({ type: 'gradient', g1: g[0], g2: g[1], angle: 160 })),
  tex: Object.keys(TEX).map((k, i) => ({ type: 'texture', tex: k, tc1: ['#16150f', '#0f3b3a', '#e9d9b5', '#2b2b6d', '#f1ecdf', '#f1ecdf'][i], tc2: ['#d9a441', '#7fb3a6', '#b8412e', '#7fb3a6', '#16150f', '#d9a441'][i], seed: 11 + i * 7 })),
};
function bgDocFrom(b) { const d = baseDoc(''); d.bg = { ...d.bg, ...b }; d.subject.on = false; d.overlay.type = 'none'; return d; }
function renderCutoutView() {
  if (!$('#view-cutout').classList.contains('active')) return;
  const mk = (list, sel, on) => { const c = document.createElement('div'); list.forEach(a => { const b = document.createElement('button'); b.className = 'th'; b.setAttribute('aria-pressed', a.id === sel); const im = new Image(); im.src = a.url; im.alt = a.name; b.appendChild(im); if (!a.builtin) { const x = document.createElement('button'); x.className = 'del'; x.textContent = '✕'; x.title = 'Delete'; x.onclick = async e => { e.stopPropagation(); if (confirm('Delete this image?')) { await store.deleteAsset(a.id); renderCutoutView(); refreshAssetSelects(); } }; b.appendChild(x); } b.onclick = () => on(a.id); c.appendChild(b); }); return [...c.children]; };
  const pt = $('#photoThumbs'); pt.innerHTML = ''; mk([...assetsOf('photo'), ...assetsOf('bg')], cut.photo, id => { cut.photo = id; cut.candidate = null; $('#btnKeepCutout').disabled = true; renderCutoutView(); }).forEach(el => pt.appendChild(el));
  const ct = $('#cutThumbs'); ct.innerHTML = ''; mk(assetsOf('cutout'), cut.cutout, id => { cut.cutout = id; cut.candidate = null; $('#btnKeepCutout').disabled = true; renderCutoutView(); }).forEach(el => ct.appendChild(el));
  const bgBtn = (b, parent, key) => { const btn = document.createElement('button'); btn.className = 'bg'; btn.setAttribute('aria-pressed', cut.bg && JSON.stringify(cut.bg) === JSON.stringify(b)); btn.appendChild(thumbCanvas(bgDocFrom(b), 68 * 2)); btn.onclick = () => { cut.bg = b; renderCutoutView(); }; parent.appendChild(btn); };
  const s = $('#bgSolids'); s.innerHTML = ''; CUT_BGS.solids.forEach(b => bgBtn(b, s)); const g = $('#bgGrads'); g.innerHTML = ''; CUT_BGS.grads.forEach(b => bgBtn(b, g)); const t = $('#bgTex'); t.innerHTML = ''; CUT_BGS.tex.forEach(b => bgBtn(b, t));
  const p = $('#bgPhotos'); p.innerHTML = ''; [...assetsOf('photo'), ...assetsOf('bg')].forEach(a => bgBtn({ type: 'image', image: a.id, scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1 }, p));
  drawCutStage();
}
function drawCutStage() {
  const src = $('#cutSrc'), out = $('#cutOut');
  const sd = baseDoc(''); sd.bg = { ...sd.bg, type: 'image', image: cut.photo }; sd.subject.on = false; sd.overlay.type = 'none'; renderTo(src, sd, 540);
  const od = cut.bg ? bgDocFrom(cut.bg) : baseDoc(''); if (!cut.bg) { od.bg.type = 'solid'; od.bg.color = '#2a2718'; od.overlay.type = 'none'; }
  od.subject = { on: true, image: cut.candidate ? '__candidate' : cut.cutout, scale: +$('#cSubjScale').value, x: 0.5, y: +$('#cSubjY').value, shadow: +$('#cSubjShadow').value, sat: 1, flip: false };
  if (cut.candidate) { assets.__candidate = { id: '__candidate', kind: 'tmp', url: cut.candidate.toDataURL() }; imgCache.__candidate = cut.candidate.img; }
  renderTo(out, od, 540);
  $('#cutOutCap').textContent = cut.candidate ? 'New cutout (unsaved) on background' : 'Cutout on background';
  ['cSubjScale', 'cSubjY', 'cSubjShadow'].forEach(id => $('#' + id + 'V').textContent = (+$('#' + id).value).toFixed(2));
}
['cSubjScale', 'cSubjY', 'cSubjShadow', 'cutThresh', 'cutFeather', 'cutErode'].forEach(id => $('#' + id).addEventListener('input', () => { $('#' + id + 'V').textContent = $('#' + id).value; if (id.startsWith('cut') && cut.candidateMask) buildCandidate(); else drawCutStage(); }));
$('#btnUploadPhoto').onclick = () => pickFile(async f => { const rec = await store.putAsset(f, 'photo', f.name.replace(/\.[^.]+$/, '')); cut.photo = rec.id; renderCutoutView(); refreshAssetSelects(); toast('Photo added'); });
$('#btnUploadBg').onclick = () => pickFile(async f => { const rec = await store.putAsset(f, 'bg', f.name.replace(/\.[^.]+$/, '')); cut.bg = { type: 'image', image: rec.id, scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1 }; renderCutoutView(); refreshAssetSelects(); });
$('#btnUploadCutout').onclick = () => pickFile(async f => { if (f.type !== 'image/png' && f.type !== 'image/webp') return toast('Use a transparent PNG or WebP'); const rec = await store.putAsset(f, 'cutout', f.name.replace(/\.[^.]+$/, '')); cut.cutout = rec.id; renderCutoutView(); refreshAssetSelects(); toast('Cutout added'); }, 'image/png,image/webp');
$('#btnRunCutout').onclick = runCutout;
$('#btnKeepCutout').onclick = async () => {
  if (!cut.candidate) return; const blob = await new Promise(r => cut.candidate.toBlob(r, 'image/png'));
  const rec = await store.putAsset(blob, 'cutout', (assets[cut.photo]?.name || 'photo') + ' cutout'); cut.cutout = rec.id; cut.candidate = null; $('#btnKeepCutout').disabled = true; renderCutoutView(); refreshAssetSelects(); toast('Cutout saved');
};
async function runCutout() {
  const im = imgCache[cut.photo]; if (!im || !im.naturalWidth) return toast('Photo still loading');
  const prog = $('#cutProg'), bar = $('i', prog); prog.style.display = 'block'; bar.style.width = '15%'; $('#btnRunCutout').disabled = true;
  try {
    if (!cut.seg) {
      if (typeof SelfieSegmentation === 'undefined') throw new Error('model unavailable');
      cut.seg = new SelfieSegmentation({ locateFile: f => 'mp/' + f }); cut.seg.setOptions({ modelSelection: 1, selfieMode: false });
      await withTimeout(cut.seg.initialize(), 25000);
    }
    bar.style.width = '55%';
    // downscale for the model, keep full-res image for compositing
    const mw = 1024, sc = Math.min(1, mw / Math.max(im.naturalWidth, im.naturalHeight));
    const inC = document.createElement('canvas'); inC.width = Math.round(im.naturalWidth * sc); inC.height = Math.round(im.naturalHeight * sc); inC.getContext('2d').drawImage(im, 0, 0, inC.width, inC.height);
    const res = await withTimeout(new Promise(r => { cut.seg.onResults(r); cut.seg.send({ image: inC }); }), 30000);
    const mc = document.createElement('canvas'); mc.width = im.naturalWidth; mc.height = im.naturalHeight; mc.getContext('2d').drawImage(res.segmentationMask, 0, 0, mc.width, mc.height);
    cut.candidateMask = mc; bar.style.width = '90%'; buildCandidate(); toast('Cutout ready — tune the edge, then Keep');
  } catch (e) { console.warn(e); toast('On-device cutout didn’t run here — upload a PNG cutout instead'); }
  finally { $('#btnRunCutout').disabled = false; bar.style.width = '100%'; setTimeout(() => { prog.style.display = 'none'; bar.style.width = '0'; }, 600); }
}
function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]); }
function buildCandidate() {
  const im = imgCache[cut.photo], mask = cut.candidateMask; if (!im || !mask) return;
  const th = +$('#cutThresh').value, feather = +$('#cutFeather').value, erode = +$('#cutErode').value;
  const w = im.naturalWidth, h = im.naturalHeight;
  const m2 = document.createElement('canvas'); m2.width = w; m2.height = h; const mx = m2.getContext('2d');
  mx.filter = `blur(${Math.max(0, feather + Math.abs(erode)) * 0.6}px)`; mx.drawImage(mask, 0, 0); mx.filter = 'none';
  const md = mx.getImageData(0, 0, w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const cx = c.getContext('2d'); cx.drawImage(im, 0, 0);
  const id = cx.getImageData(0, 0, w, h), d = id.data, m = md.data;
  const t = clamp(th + erode * 0.03, 0.02, 0.98), soft = 0.08 + feather * 0.02;
  let minx = w, miny = h, maxx = 0, maxy = 0;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = m[i] / 255; let a = clamp((v - (t - soft)) / (2 * soft), 0, 1); a = a * a * (3 - 2 * a);
    d[i + 3] = Math.round(d[i + 3] * a);
    if (d[i + 3] > 8) { const xx = p % w, yy = (p / w) | 0; if (xx < minx) minx = xx; if (xx > maxx) maxx = xx; if (yy < miny) miny = yy; if (yy > maxy) maxy = yy; }
  }
  if (maxx <= minx) return toast('No subject found');
  cx.putImageData(id, 0, 0);
  const pad = 6, bx = Math.max(0, minx - pad), by = Math.max(0, miny - pad), bw = Math.min(w, maxx + pad) - bx, bh = Math.min(h, maxy + pad) - by;
  const out = document.createElement('canvas'); out.width = bw; out.height = bh; out.getContext('2d').drawImage(c, bx, by, bw, bh, 0, 0, bw, bh);
  out.img = new Image(); out.img.src = out.toDataURL(); out.img.onload = () => drawCutStage(); cut.candidate = out; $('#btnKeepCutout').disabled = false;
}
$('#btnCutToEditor').onclick = () => { if (cut.candidate) return toast('Keep the cutout first'); pushUndo(); if (cut.bg) doc.bg = { ...doc.bg, ...cut.bg }; doc.subject = { ...doc.subject, on: true, image: cut.cutout, scale: +$('#cSubjScale').value, y: +$('#cSubjY').value, shadow: +$('#cSubjShadow').value }; if (doc.bg.type !== 'image') doc.overlay.type = 'none'; syncAll(); commit(); switchView('editor'); toast('Applied to ' + doc.name); };
$('#btnCutNewCover').onclick = () => { if (cut.candidate) return toast('Keep the cutout first'); const d = baseDoc('Cutout cover'); if (cut.bg) d.bg = { ...d.bg, ...cut.bg }; d.subject = { ...d.subject, on: true, image: cut.cutout, scale: +$('#cSubjScale').value, y: +$('#cSubjY').value, shadow: +$('#cSubjShadow').value }; d.overlay.type = 'none'; d.layers = [newText({ text: 'Caption goes here', y: 0.1, color: d.bg.type === 'solid' && isLight(d.bg.color) ? '#16150f' : '#ffffff', shadow: 0 })]; loadDoc(d); persistCurrent(); switchView('editor'); };
function isLight(h) { const n = parseInt(h.slice(1), 16); return ((n >> 16 & 255) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) > 150; }

/* ---------------- views ---------------- */
function switchView(v) {
  $$('nav.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.view === v));
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  if (v === 'grid') renderGrid(); if (v === 'cutout') renderCutoutView(); if (v === 'editor') renderAll();
}
$$('nav.tabs button').forEach(b => b.onclick = () => switchView(b.dataset.view));
document.fonts.addEventListener('loadingdone', () => { renderAll(); renderCoverList(); renderTemplates(); if ($('#view-grid').classList.contains('active')) renderGrid(); });

/* ---------------- boot ---------------- */
(async () => {
  setStatus('connecting…');
  await store.init();
  try {
    settings = { ...settings, ...(await store.getSettings()) }; settings.gridOrder = settings.gridOrder || [];
    if (settings.handle === 'neuronesthub' && !settings.profileEdited) Object.assign(settings, PROFILE_DEFAULTS); // drop the old placeholder profile
    settings.profileEdited = true;
  } catch {}
  try { covers = await store.listCovers(); } catch (e) { console.warn(e); covers = []; }
  refreshAssetSelects(); renderTemplates();
  if (covers.length) loadDoc([...covers].sort((a, b) => b.updatedAt - a.updatedAt)[0].doc);
  else { // seed a first set from the templates so the studio opens with something to look at
    for (const t of TEMPLATES.slice(0, 3)) { const d = t.make(); d.id = uid(); covers.push({ id: d.id, name: d.name, createdAt: d.createdAt, updatedAt: d.updatedAt - 1000, doc: d, versions: [] }); }
    for (const r of covers) { try { await store.saveCover(r); } catch {} }
    settings.gridOrder = covers.map(c => c.id); store.saveSettings(settings).catch(() => {});
    loadDoc(covers[0].doc);
  }
  setStatus('saved in this browser', 'ok');
  getImg('photo'); getImg('cutout');
})();
})();
