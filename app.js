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
  { n: 'Fraunces', w: [300, 400, 500, 600, 700, 900], i: true },
  { n: 'Cormorant Garamond', w: [400, 600, 700], i: true },
  { n: 'Playfair Display', w: [400, 700, 900], i: true },
  { n: 'Instrument Serif', w: [400], i: true },
  { n: 'Bebas Neue', w: [400], i: false },
  { n: 'Anton', w: [400], i: false },
  { n: 'Poppins', w: [500, 600, 700, 800, 900], i: true },
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
  mosaic: { id: 'mosaic', kind: 'photo', name: 'Candlelight (mosaic)', url: 'assets/mosaic.jpg', builtin: true },
  mosaicMatch: { id: 'mosaicMatch', kind: 'photo', name: 'Match, slowing down time (mosaic)', url: 'assets/mosaic-match.jpg', builtin: true },
  // stand-in plate for the reel to-do set; versioned name because /assets is cached immutable
  reelDummy: { id: 'reelDummy', kind: 'photo', name: 'Placeholder, swap photo', url: 'assets/placeholder-swap-photo-v1.jpg', builtin: true },
  // Day-1 REEL COVER stills — the default photo set for the batch
  still01: { id: 'still01', kind: 'photo', name: 'Seated, looking away', url: 'assets/stills/still-01.jpg', builtin: true, still: true },
  still02: { id: 'still02', kind: 'photo', name: 'Behind camera, softbox', url: 'assets/stills/still-02.jpg', builtin: true, still: true },
  still03: { id: 'still03', kind: 'photo', name: 'Empty chair, shoji', url: 'assets/stills/still-03.jpg', builtin: true, still: true },
  still04: { id: 'still04', kind: 'photo', name: 'Laughing at phone', url: 'assets/stills/still-04.jpg', builtin: true, still: true },
  still05: { id: 'still05', kind: 'photo', name: 'Chin raised, looking up', url: 'assets/stills/still-05.jpg', builtin: true, still: true },
  still06: { id: 'still06', kind: 'photo', name: 'Reading phone', url: 'assets/stills/still-06.jpg', builtin: true, still: true },
  still07: { id: 'still07', kind: 'photo', name: 'Arms raised, laughing', url: 'assets/stills/still-07.jpg', builtin: true, still: true },
  still08: { id: 'still08', kind: 'photo', name: 'Hands together, smiling', url: 'assets/stills/still-08.jpg', builtin: true, still: true },
  still09: { id: 'still09', kind: 'photo', name: 'Seated, low light', url: 'assets/stills/still-09.jpg', builtin: true, still: true },
  still10: { id: 'still10', kind: 'photo', name: 'Seated, hands in lap', url: 'assets/stills/still-10.jpg', builtin: true, still: true },
  still11: { id: 'still11', kind: 'photo', name: 'Empty chair, cushion', url: 'assets/stills/still-11.jpg', builtin: true, still: true },
  still12: { id: 'still12', kind: 'photo', name: 'Candlelight, match', url: 'assets/stills/still-12.jpg', builtin: true, still: true },
  // Return to Self static set (16 Sep 2026): the plate from each of Nathan's 18 videos, photo top, ink below. Not in the 72-batch pool.
  rtsA11: { id: 'rtsA11', kind: 'photo', name: 'Static A1.1, puppet', url: 'assets/statics/rts-a1-1.jpg', builtin: true, rts: true },
  rtsA12: { id: 'rtsA12', kind: 'photo', name: 'Static A1.2, balcony close', url: 'assets/statics/rts-a1-2.jpg', builtin: true, rts: true },
  rtsA13: { id: 'rtsA13', kind: 'photo', name: 'Static A1.3, mask', url: 'assets/statics/rts-a1-3.jpg', builtin: true, rts: true },
  rtsA14: { id: 'rtsA14', kind: 'photo', name: 'Static A1.4, balcony', url: 'assets/statics/rts-a1-4.jpg', builtin: true, rts: true },
  rtsA21: { id: 'rtsA21', kind: 'photo', name: 'Static A2.1, bedside', url: 'assets/statics/rts-a2-1.jpg', builtin: true, rts: true },
  rtsA22: { id: 'rtsA22', kind: 'photo', name: 'Static A2.2, dojo close', url: 'assets/statics/rts-a2-2.jpg', builtin: true, rts: true },
  rtsA23: { id: 'rtsA23', kind: 'photo', name: 'Static A2.3, father photo', url: 'assets/statics/rts-a2-3.jpg', builtin: true, rts: true },
  rtsA31: { id: 'rtsA31', kind: 'photo', name: 'Static A3.1, dojo', url: 'assets/statics/rts-a3-1.jpg', builtin: true, rts: true },
  rtsA32: { id: 'rtsA32', kind: 'photo', name: 'Static A3.2, dojo', url: 'assets/statics/rts-a3-2.jpg', builtin: true, rts: true },
  rtsA33: { id: 'rtsA33', kind: 'photo', name: 'Static A3.3, dojo', url: 'assets/statics/rts-a3-3.jpg', builtin: true, rts: true },
  rtsC1: { id: 'rtsC1', kind: 'photo', name: 'Static C1, dojo close', url: 'assets/statics/rts-c1.jpg', builtin: true, rts: true },
  rtsC2: { id: 'rtsC2', kind: 'photo', name: 'Static C2, bedside band', url: 'assets/statics/rts-c2.jpg', builtin: true, rts: true },
  rtsC3: { id: 'rtsC3', kind: 'photo', name: 'Static C3, glass room', url: 'assets/statics/rts-c3.jpg', builtin: true, rts: true },
  rtsC4: { id: 'rtsC4', kind: 'photo', name: 'Static C4, balcony close', url: 'assets/statics/rts-c4.jpg', builtin: true, rts: true },
  rtsC5: { id: 'rtsC5', kind: 'photo', name: 'Static C5, dojo', url: 'assets/statics/rts-c5.jpg', builtin: true, rts: true },
  rtsC6: { id: 'rtsC6', kind: 'photo', name: 'Static C6, dojo', url: 'assets/statics/rts-c6.jpg', builtin: true, rts: true },
  rtsC7: { id: 'rtsC7', kind: 'photo', name: 'Static C7, temple ink', url: 'assets/statics/rts-c7.jpg', builtin: true, rts: true },
  rtsC8: { id: 'rtsC8', kind: 'photo', name: 'Static C8, glass room', url: 'assets/statics/rts-c8.jpg', builtin: true, rts: true },
  // static set v2 — the 26 Aug production-day stills (shoji room, the match), scrim baked in
  rtsA41: { id: 'rtsA41', kind: 'photo', name: 'Static A4.1, shoji frontal', url: 'assets/statics/rts-a4-1.jpg', builtin: true, rts: true },
  rtsA42: { id: 'rtsA42', kind: 'photo', name: 'Static A4.2, match and smoke', url: 'assets/statics/rts-a4-2.jpg', builtin: true, rts: true },
  rtsA43: { id: 'rtsA43', kind: 'photo', name: 'Static A4.3, looking down', url: 'assets/statics/rts-a4-3.jpg', builtin: true, rts: true },
  rtsA44: { id: 'rtsA44', kind: 'photo', name: 'Static A4.4, flame at the eye', url: 'assets/statics/rts-a4-4.jpg', builtin: true, rts: true },
  rtsA45: { id: 'rtsA45', kind: 'photo', name: 'Static A4.5, match held up', url: 'assets/statics/rts-a4-5.jpg', builtin: true, rts: true },
  rtsA46: { id: 'rtsA46', kind: 'photo', name: 'Static A4.6, shoji frontal warm', url: 'assets/statics/rts-a4-6.jpg', builtin: true, rts: true },
  rtsA48: { id: 'rtsA48', kind: 'photo', name: 'Static A4.8, the chair wide', url: 'assets/statics/rts-a4-8.jpg', builtin: true, rts: true },
  rtsC9: { id: 'rtsC9', kind: 'photo', name: 'Static C9, small flame', url: 'assets/statics/rts-c9.jpg', builtin: true, rts: true },
  rtsC10: { id: 'rtsC10', kind: 'photo', name: 'Static C10, shoji frontal', url: 'assets/statics/rts-c10.jpg', builtin: true, rts: true },
  rtsC11: { id: 'rtsC11', kind: 'photo', name: 'Static C11, match struck, black and white', url: 'assets/statics/rts-c11.jpg', builtin: true, rts: true },
  rtsC12: { id: 'rtsC12', kind: 'photo', name: 'Static C12, shoji frontal', url: 'assets/statics/rts-c12.jpg', builtin: true, rts: true },
  rtsC13: { id: 'rtsC13', kind: 'photo', name: 'Static C13, flame at the mouth', url: 'assets/statics/rts-c13.jpg', builtin: true, rts: true },
  rtsC14: { id: 'rtsC14', kind: 'photo', name: 'Static C14, match, contemplative', url: 'assets/statics/rts-c14.jpg', builtin: true, rts: true },
  rtsC15: { id: 'rtsC15', kind: 'photo', name: 'Static C15, flame at the eye', url: 'assets/statics/rts-c15.jpg', builtin: true, rts: true },
  rtsC17: { id: 'rtsC17', kind: 'photo', name: 'Static C17, shoji frontal', url: 'assets/statics/rts-c17.jpg', builtin: true, rts: true },
  rtsC18: { id: 'rtsC18', kind: 'photo', name: 'Static C18, the chair', url: 'assets/statics/rts-c18.jpg', builtin: true, rts: true },
  // static set v3 — the "if this is you" mosaic: one 3240x4800 picture (the match at the mouth, sorter set once) sliced into nine tiles
  rtsMosaic: { id: 'rtsMosaic', kind: 'photo', name: 'Static M, if this is you (3x3 mosaic picture)', url: 'assets/statics/rts-mosaic-if-this-is-you.jpg', builtin: true, rts: true },
  // the empty shoji room from the hero film (10.72 s), 4x upscale, scrim baked in — kept as a background to remix
  rtsRoom: { id: 'rtsRoom', kind: 'photo', name: 'The room (hero film, 10.72 s)', url: 'assets/statics/rts-room.jpg', builtin: true, rts: true },
  // Harrison's marks, for the signature strip
  rtsMark: { id: 'rtsMark', kind: 'logo', name: 'Harrison ensō mark, white', url: 'assets/brand/mark-s-white.png', builtin: true },
  rtsShinbukan: { id: 'rtsShinbukan', kind: 'logo', name: 'Shinbukan crest', url: 'assets/brand/mark-shinbukan.png', builtin: true },
  rtsSeizanji: { id: 'rtsSeizanji', kind: 'logo', name: 'Seizanji crests', url: 'assets/brand/mark-seizanji.png', builtin: true },
};
let assets = { ...BUILTIN };
const imgCache = {};
function getImg(id) {
  if (!id || !assets[id]) return null;
  if (imgCache[id]) return imgCache[id].complete && imgCache[id].naturalWidth ? imgCache[id] : null;
  const im = new Image(); im.crossOrigin = 'anonymous'; im.src = assets[id].url;
  im.onload = () => { renderAll(); if (document.getElementById('view-grid')?.classList.contains('active')) renderMosaicPreview(); };
  imgCache[id] = im; return null;
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
  if (b.rect) return b.rect; // exact placement (mosaic tiles)
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
function drawText(x, l, hi) {
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
  /* Preview only: the range selected in the text box, painted behind the glyphs
     like an OS text selection so the part about to be coloured reads on the
     poster. A wrap-inserted space (i < 0) counts only between two selected
     characters. Exports never receive `hi`, so they are untouched. */
  if (hi && hi.e > hi.s) {
    x.save(); x.fillStyle = 'rgba(72,140,255,.6)';
    lines.forEach((ln, i) => {
      const lw = widths[i]; const lx = l.align === 'left' ? left : l.align === 'right' ? left + bw - lw : left + (bw - lw) / 2;
      const ty = top + i * lh + lh * 0.5 + l.size * 0.34;
      const inSel = e => e.i >= hi.s && e.i < hi.e;
      const on = ln.idx.map((e, k) => e.i < 0 ? (k > 0 && k + 1 < ln.idx.length && inSel(ln.idx[k - 1]) && inSel(ln.idx[k + 1])) : inSel(e));
      for (let a = 0; a < on.length;) {
        if (!on[a]) { a++; continue; }
        let b = a; while (b < on.length && on[b]) b++;
        const ox = lx + (a ? x.measureText(ln.text.slice(0, a)).width : 0), w = x.measureText(ln.text.slice(a, b)).width;
        roundRect(x, ox - l.size * 0.04, ty - l.size * 0.76, w + l.size * 0.08, l.size * 0.98, l.size * 0.06); x.fill();
        a = b;
      }
    });
    x.restore();
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
function render(ctx, doc, scale, boxes, ui) {
  ctx.save(); ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, doc);
  const draw = l => { const b = l.type === 'text' ? drawText(ctx, l, ui && ui.id === l.id ? ui : null) : l.type === 'rule' ? drawRule(ctx, l) : drawLogo(ctx, l); if (boxes) boxes[l.id] = b; };
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
  { name: 'Return to Self static', make() { const d = buildStaticDoc({ id: 'RTS', name: 'static', layout: 'cover', bg: 'rtsA32', kicker: 'Return to Self',
      head: 'Willpower. Discipline. Starting over. And it still doesn\u2019t stick.', sub: 'You\u2019re not weak. You\u2019re fighting the wrong thing.', cta: 'Message me' });
    d.name = 'Return to Self static'; delete d.rts; return d; } },
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
  /* Bulk write for the 72-cover batch — one storage write, not 72. */
  async saveCovers(list, onProgress) {
    const all = await this.listCovers(); const map = new Map(all.map(c => [c.id, c]));
    list.forEach(r => map.set(r.id, r));
    try { localStorage.setItem(this.KEY, JSON.stringify([...map.values()])); }
    catch { toast('Browser storage is full — export what you need, then clear old covers'); }
    onProgress && onProgress(list.length);
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
/* The preview alone paints the text box's live selection onto the poster, so
   the words about to be part-coloured can be seen on the cover itself. The
   accessor is filled in by the part-colour code further down. */
let uiHi = () => null;
function renderPreview() {
  const z = stageZoom(), cssW = Math.round(W * z), cssH = Math.round(H * z);
  preview.style.width = cssW + 'px'; preview.style.height = cssH + 'px';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (preview.width !== Math.round(cssW * dpr)) { preview.width = Math.round(cssW * dpr); preview.height = Math.round(cssH * dpr); }
  boxes = {}; render(pctx, doc, z * dpr, boxes, uiHi());
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
  const target = id === '__subject' ? doc.subject : id ? doc.layers.find(l => l.id === id) : (doc.bg.type === 'image' && !doc.bg.rect) ? doc.bg : null;
  if (!target) return;
  drag = { id: id || '__bg', p, x0: target.x, y0: target.y, moved: false, before: snapshot() };
  preview.setPointerCapture(e.pointerId); preview.classList.add('grabbing');
});
preview.addEventListener('pointermove', e => {
  if (!drag) { const id = hitTest(canvasPoint(e)); preview.classList.toggle('grab', !!id || (doc.bg.type === 'image' && !doc.bg.rect)); return; }
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
  if (sel === '__subject') { const s = doc.subject, s0 = s.scale; return { obj: s, apply: k => s.scale = +clamp(s0 * k, 0.3, doc.span ? 8 : 1.6).toFixed(3), sync: ['subjScale'] }; }
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
  if (doc.bg.type !== 'image' || doc.bg.rect || sel) return; e.preventDefault();
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
function wireCoverDrop(el, getAt, getRec) {
  el.addEventListener('dragover', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; el.classList.add('filedrop'); });
  el.addEventListener('dragleave', () => el.classList.remove('filedrop'));
  el.addEventListener('drop', e => {
    if (!dtHasFiles(e)) return;
    e.preventDefault(); e.stopPropagation(); el.classList.remove('filedrop');
    const rec = getRec && getRec();
    if (rec?.doc?.reel) photoIntoCover(rec, e.dataTransfer.files); else coversFromFiles(e.dataTransfer.files, getAt());
  });
}
/* A photo dropped on a reel to-do tile becomes that cover's photo — the text and
   the grid slot stay put, so the queue can be worked straight from the grid. */
async function photoIntoCover(rec, files) {
  const f = [...files].find(x => x.type.startsWith('image/')); if (!f) return toast('That isn’t an image file');
  setStatus('adding photo…');
  const a = await store.putAsset(f, 'bg', f.name.replace(/\.[^.]+$/, '').slice(0, 40));
  await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = a.url; imgCache[a.id] = im; });
  const set = d => { d.bg = { ...d.bg, type: 'image', image: a.id, fit: 'fill', scale: 1, x: 0, y: 0 }; };
  if (rec.id === doc?.id) { pushUndo(); set(doc); commit(); syncAll(); }
  else { set(rec.doc); try { await store.saveCover(rec); } catch (e) { console.warn(e); } }
  renderBgPick(); renderGrid(); renderCoverList(); setStatus('saved · this browser', 'ok');
  toast(`Photo set on ${rec.name.split(' · ')[0]} — double-click to reposition`);
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
let tSel = null, tSelFor = null, tSpanBefore = null, tHiKey = '';
const tTextEl = $('#tText'), tHiEl = $('#tTextHi');
function captureSel() {
  const a = tTextEl.selectionStart, b = tTextEl.selectionEnd;
  tSel = b > a ? { s: a, e: b } : null;
  syncSpanUI();
}
['keyup', 'mouseup', 'select', 'focus', 'click', 'input'].forEach(ev => tTextEl.addEventListener(ev, captureSel));
document.addEventListener('selectionchange', () => { if (document.activeElement === tTextEl) captureSel(); });
/* Chrome stops painting a textarea's selection the moment it loses focus, so
   opening the colour picker (which takes focus) made the chosen words vanish.
   A mirror behind the transparent box repaints the held range instead. */
function syncTextHi() {
  const v = tTextEl.value, live = !!(T() && tSel);
  if (live) tHiEl.innerHTML = escapeHtml(v.slice(0, tSel.s)) + '<mark>' + escapeHtml(v.slice(tSel.s, tSel.e)) + '</mark>' + escapeHtml(v.slice(tSel.e));
  else tHiEl.textContent = '';
  tHiEl.style.paddingRight = (8 + Math.max(0, tTextEl.offsetWidth - tTextEl.clientWidth - 2)) + 'px'; // wrap in step with the scrollbar
  tHiEl.scrollTop = tTextEl.scrollTop;
}
tTextEl.addEventListener('scroll', () => { tHiEl.scrollTop = tTextEl.scrollTop; });
uiHi = () => { const l = T(); return l && tSel ? { id: l.id, s: tSel.s, e: tSel.e } : null; };
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
  syncTextHi();
  const key = live ? `${l.id}:${tSel.s}:${tSel.e}` : '';
  if (key !== tHiKey) { tHiKey = key; renderAll(); }   // the poster highlights the same range
}
/* Named apart from the tile-span `applySpan` below: both sit in the same scope,
   and a second `function applySpan` silently replaced this one, which is how
   part colour stopped working. Never pull focus back to the box from here: the
   native colour picker closes the moment its input loses focus, which cut every
   pick off at its first tick. */
function applyPartColor(c) {
  const l = T(); if (!l || !tSel) return;
  l.spans = clipSpans(normSpans(l), tSel.s, tSel.e).concat([{ s: tSel.s, e: tSel.e, color: c }]).sort((a, b) => a.s - b.s);
  renderAll(); renderLayers(); syncSpanUI();
}
$('#tSpanSwatches').innerHTML = SWATCH.slice(0, 8).map(c => `<button class="sw" style="background:${c};width:16px;height:16px" data-c="${c}" title="${c}"></button>`).join('');
// Hold the selection: a mousedown on these controls would otherwise blur the textarea.
['#tSpanSwatches', '#tSpanClear'].forEach(s => $(s).addEventListener('mousedown', e => e.preventDefault()));
$('#tSpanSwatches').onclick = e => { const c = e.target.dataset.c; if (c && tSel) { pushUndo(); applyPartColor(c); scheduleSave(); } };
$('#tSpanColor').addEventListener('input', e => { if (!tSpanBefore) tSpanBefore = snapshot(); applyPartColor(e.target.value); });
$('#tSpanColor').addEventListener('change', () => { if (tSpanBefore) { undoStack.push(tSpanBefore); redoStack = []; updateUndoBtns(); tSpanBefore = null; scheduleSave(); } });
$('#tSpanClear').onclick = () => {
  const l = T(); if (!l) return;
  pushUndo();
  l.spans = tSel ? clipSpans(normSpans(l), tSel.s, tSel.e) : [];
  commit(); renderLayers(); syncSpanUI();
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
  $('#secBlocks').style.order = '2'; // blocks stay in reach, so several can be pasted in a row
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
  if ($('#mosImage')?._fill) $('#mosImage')._fill();
  if ($('#spanImage')) renderSpanPanel();
  const opt = list => list.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  $('#subjImage').innerHTML = opt(assetsOf('cutout'));
  $('#lImage').innerHTML = '<option value="">— none —</option>' + opt(assetsOf('logo'));
}
function pickFiles(cb, accept = 'image/*') { const fi = $('#fileInput'); fi.accept = accept; fi.multiple = true; fi.value = '';
  fi.onchange = () => { const f = [...fi.files]; fi.multiple = false; if (f.length) cb(f); }; fi.click(); }
function pickFile(cb, accept = 'image/*') { const fi = $('#fileInput'); fi.accept = accept; fi.multiple = false; fi.value = ''; fi.onchange = () => { if (fi.files[0]) cb(fi.files[0]); }; fi.click(); }

/* ---------------- covers library ---------------- */
function loadDoc(d) { clearTimeout(saveTimer); doc = JSON.parse(JSON.stringify(d)); sel = null; undoStack = []; redoStack = []; updateUndoBtns(); syncAll(); renderAll(); renderCoverList(); renderVersions(); setStatus('saved · this browser', 'ok'); }
function thumbCanvas(d, cssW) { const c = document.createElement('canvas'); renderTo(c, d, cssW); return c; }
/* With 80+ covers, drawing every thumbnail up front locks the page for seconds.
   Tiles paint as they come into view instead. */
const lazyIO = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => {
  es.forEach(e => { if (!e.isIntersecting) return; lazyIO.unobserve(e.target); lazyDraw(e.target); });
}, { rootMargin: '400px' }) : null;
async function lazyDraw(c) {
  if (!c._doc || c._drawn) return; c._drawn = true;
  await preloadAssets([c._doc.bg?.image, c._doc.subject?.on && c._doc.subject.image, ...(c._doc.layers || []).map(l => l.image)]);
  renderTo(c, c._doc, c._w);
}
function lazyCanvas(d, cssW) {
  const c = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = Math.round(cssW * dpr); c.height = Math.round(cssW * H / W * dpr);
  c._doc = d; c._w = cssW;
  if (lazyIO) lazyIO.observe(c); else lazyDraw(c);
  return c;
}
function renderCoverList() {
  const c = $('#coverList'); c.innerHTML = '';
  const list = [...covers].sort((a, b) => b.updatedAt - a.updatedAt);
  if (!list.length) c.innerHTML = '<div class="empty">No covers yet.</div>';
  list.forEach(r => {
    const d = document.createElement('div'); d.className = 'cover-item'; d.setAttribute('aria-current', r.id === doc?.id); d.dataset.id = r.id; d.classList.toggle('picked', picked.has(r.id));
    const th = lazyCanvas(r.id === doc?.id ? doc : r.doc, 38 * 2); th.style.width = '38px'; th.style.height = '68px';
    d.appendChild(th);
    const info = document.createElement('div'); info.innerHTML = `<div class="nm">${escapeHtml(r.name)}</div><div class="meta">${fmtTime(r.updatedAt)} · ${(r.versions || []).length} ver</div>`; d.appendChild(info);
    const acts = document.createElement('div'); acts.innerHTML = `<input type="checkbox" class="pick" title="Select for export"><button class="icon small ghost" title="Duplicate">⧉</button><button class="icon small ghost" title="Delete">✕</button>`;
    const cb = $('input', acts); cb.checked = picked.has(r.id); cb.onclick = e => { e.stopPropagation(); togglePick(r.id, cb.checked); };
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
  $$('#phTabs [data-shape]').forEach(t => t.classList.toggle('on', (t.dataset.shape === '34') === (settings.shape === '34')));
  const ig = $('#igrid'); ig.className = 'igrid' + (settings.shape === '34' ? ' crop34' : ''); ig.innerHTML = '';
  const order = (settings.gridOrder || []).map(id => covers.find(c => c.id === id)).filter(Boolean);
  $('#phPosts').textContent = settings.posts || order.length;
  const n = Math.max(9, Math.ceil(order.length / 3) * 3);
  const pv = spanPreviewDocs(); ig.classList.toggle('pick', spanPick);
  for (let i = 0; i < n; i++) {
    const t = document.createElement('div'); t.className = 'tile'; const r = order[i];
    if (r) { const d = pv?.get(r.id) || (r.id === doc?.id ? doc : r.doc); t.innerHTML = `<div class="play"></div><div class="views">▶ ${(3.1 + (i * 7 % 11)).toFixed(1)}K</div>`; t.prepend(lazyCanvas(d, 130 * 2)); t.draggable = true; t.dataset.id = r.id; t.title = r.name;
      t.classList.toggle('picked', picked.has(r.id)); t.classList.toggle('span', !!pv?.has(r.id));
      t.addEventListener('click', () => { if (spanPick) setSpanAt(i); else togglePick(r.id); });
      t.addEventListener('dragstart', e => { gridDrag = r.id; e.dataTransfer.effectAllowed = 'move'; }); t.addEventListener('dragover', e => { if (dtHasFiles(e)) return; e.preventDefault(); t.classList.add('drop'); }); t.addEventListener('dragleave', () => t.classList.remove('drop'));
      t.addEventListener('drop', e => { if (dtHasFiles(e)) return; e.preventDefault(); t.classList.remove('drop'); reorderGrid(gridDrag, r.id); });
      t.addEventListener('dblclick', () => { loadDoc(d); switchView('editor'); });
      wireCoverDrop(t, () => i, () => r);              // a photo dropped here lands in this slot, or in the to-do cover already there
    } else {
      t.classList.add('ph'); t.textContent = i === order.length ? 'drop a photo' : '';
      t.addEventListener('click', () => { if (spanPick) setSpanAt(i); });
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
  d.prepend(lazyCanvas(r.id === doc?.id ? doc : r.doc, 26 * 2));
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
/* ---------------- picking covers for export ----------------
   Click tiles on the profile grid, or tick covers in the Covers panel, to
   collect a set; "Export selected" renders just those, in grid order. One
   cover comes down as a PNG, more as a ZIP. */
const picked = new Set();
function togglePick(id, on) { if (on === undefined) on = !picked.has(id); if (on) picked.add(id); else picked.delete(id); renderPickState(); }
function renderPickState() {
  const n = picked.size;
  $$('#igrid .tile[data-id]').forEach(t => t.classList.toggle('picked', picked.has(t.dataset.id)));
  $$('#coverList .cover-item[data-id]').forEach(el => { const on = picked.has(el.dataset.id); el.classList.toggle('picked', on); const cb = $('input.pick', el); if (cb) cb.checked = on; });
  $$('.pickCount').forEach(el => el.textContent = n ? `${n} selected` : 'none selected');
  $$('.btnExportPicked').forEach(b => b.disabled = !n);
}
async function exportPicked() {
  const list = gridOrdered().filter(c => picked.has(c.id));
  if (!list.length) return toast('Click covers on the grid, or tick them in the Covers panel, to select them first');
  const scale = +$('#exportScale').value || 1;
  if (list.length === 1) { const r = list[0], d = r.id === doc?.id ? doc : r.doc; await store.download(`${slug(r.name)}-${W * scale}x${H * scale}.png`, await renderBlob(d, scale)); return toast('Exported'); }
  toast(`Rendering ${list.length} covers…`); const zip = new JSZip();
  for (let i = 0; i < list.length; i++) { const r = list[i]; const d = r.id === doc?.id ? doc : r.doc; zip.file(`${String(i + 1).padStart(2, '0')}-${slug(r.name)}.png`, await renderBlob(d, scale)); }
  const blob = await zip.generateAsync({ type: 'blob' }); await store.download(`reel-covers-selected-${list.length}.zip`, blob); toast(`${list.length} covers exported`);
}
$$('.btnExportPicked').forEach(b => b.onclick = exportPicked);
$('#gPickAll').onclick = () => { (settings.gridOrder || []).forEach(id => picked.add(id)); renderPickState(); };
$$('.btnPickNone').forEach(b => b.onclick = () => { picked.clear(); renderPickState(); });

$('#gAddAll').onclick = () => { settings.gridOrder = [...new Set([...settings.gridOrder, ...covers.sort((a, b) => b.updatedAt - a.updatedAt).map(c => c.id)])]; saveSettingsSoon(); renderGrid(); };
$('#gClear').onclick = () => { settings.gridOrder = []; saveSettingsSoon(); renderGrid(); };
const PROFILE_FIELDS = [['gHandle', 'handle'], ['gName', 'name'], ['gCat', 'category'], ['gBio', 'bio'], ['gLink', 'link'], ['gPosts', 'posts'], ['gFollowers', 'followers'], ['gFollowing', 'following'], ['gFollowedBy', 'followedBy']];
PROFILE_FIELDS.forEach(([id, key]) => $('#' + id).addEventListener('input', e => { settings[key] = e.target.value; saveSettingsSoon(); renderGrid(); }));
$('#gAvatar').onclick = () => pickFile(async f => { const rec = await store.putAsset(f, 'avatar', 'profile picture'); settings.avatar = rec.id; saveSettingsSoon(); renderGrid(); });
$('#gAvatarClear').onclick = async () => { const id = settings.avatar; settings.avatar = null; saveSettingsSoon(); renderGrid(); if (id) await store.deleteAsset(id); };
$('#gShape916').onclick = () => { settings.shape = '916'; saveSettingsSoon(); renderGrid(); };
$('#gShape34').onclick = () => { settings.shape = '34'; saveSettingsSoon(); renderGrid(); };
// the phone's own GRID / REELS tabs switch the tile shape too, like the real app
$('#phTabs').onclick = e => { const s = e.target.closest('[data-shape]')?.dataset.shape; if (s && s !== (settings.shape === '34' ? '34' : '916')) { settings.shape = s; saveSettingsSoon(); renderGrid(); } };

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
/* Runs the on-device model over one image and returns its mask at full size. */
async function segmentMask(im) {
  if (!cut.seg) {
    if (typeof SelfieSegmentation === 'undefined') throw new Error('model unavailable');
    cut.seg = new SelfieSegmentation({ locateFile: f => 'mp/' + f }); cut.seg.setOptions({ modelSelection: 1, selfieMode: false });
    await withTimeout(cut.seg.initialize(), 25000);
  }
  // downscale for the model, keep full-res image for compositing
  const mw = 1024, sc = Math.min(1, mw / Math.max(im.naturalWidth, im.naturalHeight));
  const inC = document.createElement('canvas'); inC.width = Math.round(im.naturalWidth * sc); inC.height = Math.round(im.naturalHeight * sc); inC.getContext('2d').drawImage(im, 0, 0, inC.width, inC.height);
  const res = await withTimeout(new Promise(r => { cut.seg.onResults(r); cut.seg.send({ image: inC }); }), 30000);
  const mc = document.createElement('canvas'); mc.width = im.naturalWidth; mc.height = im.naturalHeight; mc.getContext('2d').drawImage(res.segmentationMask, 0, 0, mc.width, mc.height);
  return mc;
}
async function runCutout() {
  const im = imgCache[cut.photo]; if (!im || !im.naturalWidth) return toast('Photo still loading');
  const prog = $('#cutProg'), bar = $('i', prog); prog.style.display = 'block'; bar.style.width = '15%'; $('#btnRunCutout').disabled = true;
  try {
    bar.style.width = '55%';
    cut.candidateMask = await segmentMask(im); bar.style.width = '90%'; buildCandidate(); toast('Cutout ready — tune the edge, then Keep');
  } catch (e) { console.warn(e); toast('On-device cutout didn’t run here — upload a PNG cutout instead'); }
  finally { $('#btnRunCutout').disabled = false; bar.style.width = '100%'; setTimeout(() => { prog.style.display = 'none'; bar.style.width = '0'; }, 600); }
}
function withTimeout(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]); }
/* Image + mask → the subject on transparency, cropped to its bounds. */
function cutoutCanvas(im, mask, th, feather, erode) {
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
  if (maxx <= minx) return null;
  cx.putImageData(id, 0, 0);
  const pad = 6, bx = Math.max(0, minx - pad), by = Math.max(0, miny - pad), bw = Math.min(w, maxx + pad) - bx, bh = Math.min(h, maxy + pad) - by;
  const out = document.createElement('canvas'); out.width = bw; out.height = bh; out.getContext('2d').drawImage(c, bx, by, bw, bh, 0, 0, bw, bh);
  return out;
}
function buildCandidate() {
  const im = imgCache[cut.photo], mask = cut.candidateMask; if (!im || !mask) return;
  const out = cutoutCanvas(im, mask, +$('#cutThresh').value, +$('#cutFeather').value, +$('#cutErode').value);
  if (!out) return toast('No subject found');
  out.img = new Image(); out.img.src = out.toDataURL(); out.img.onload = () => drawCutStage(); cut.candidate = out; $('#btnKeepCutout').disabled = false;
}
/* A file → a cutout asset. A transparent PNG or WebP is kept as it is; any
   other picture goes through the on-device segmentation first. */
async function cutoutFromFile(f) {
  const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = URL.createObjectURL(f); });
  if (!im) { toast('Couldn’t read that image'); return null; }
  const name = f.name.replace(/\.[^.]+$/, '').slice(0, 40);
  if (/png|webp/.test(f.type) && hasAlpha(im)) { const rec = await store.putAsset(f, 'cutout', name); imgCache[rec.id] = im; return rec; }
  try {
    const mask = await segmentMask(im);
    const out = cutoutCanvas(im, mask, +$('#cutThresh').value, +$('#cutFeather').value, +$('#cutErode').value);
    if (!out) { toast('No subject found in that photo'); return null; }
    const blob = await new Promise(r => out.toBlob(r, 'image/png'));
    const rec = await store.putAsset(blob, 'cutout', name + ' cutout');
    await preloadAssets([rec.id]);
    return rec;
  } catch (e) { console.warn(e); toast('On-device cutout didn’t run here — upload a transparent PNG instead'); return null; }
}
$('#btnCutToEditor').onclick = () => { if (cut.candidate) return toast('Keep the cutout first'); pushUndo(); if (cut.bg) doc.bg = { ...doc.bg, ...cut.bg }; doc.subject = { ...doc.subject, on: true, image: cut.cutout, scale: +$('#cSubjScale').value, y: +$('#cSubjY').value, shadow: +$('#cSubjShadow').value }; if (doc.bg.type !== 'image') doc.overlay.type = 'none'; syncAll(); commit(); switchView('editor'); toast('Applied to ' + doc.name); };
$('#btnCutNewCover').onclick = () => { if (cut.candidate) return toast('Keep the cutout first'); const d = baseDoc('Cutout cover'); if (cut.bg) d.bg = { ...d.bg, ...cut.bg }; d.subject = { ...d.subject, on: true, image: cut.cutout, scale: +$('#cSubjScale').value, y: +$('#cSubjY').value, shadow: +$('#cSubjShadow').value }; d.overlay.type = 'none'; d.layers = [newText({ text: 'Caption goes here', y: 0.1, color: d.bg.type === 'solid' && isLight(d.bg.color) ? '#16150f' : '#ffffff', shadow: 0 })]; loadDoc(d); persistCurrent(); switchView('editor'); };
function isLight(h) { const n = parseInt(h.slice(1), 16); return ((n >> 16 & 255) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) > 150; }


/* ================= cutout across tiles =================
   A subject cutout laid over a block of profile-grid tiles — up to three wide,
   as many rows as wanted — so one figure runs across several reels. Nothing
   new in the renderer: each tile just gets ordinary subject settings (size, x,
   bottom) that put its slice of the cutout in place, so opening any tile in
   the editor shows its piece and it exports like any other cover. The block
   is laid over the tiles' 3:4 crop windows, so it lines up in the grid view,
   like the mosaic. */
const spanOpts = { image: null, cols: 3, rows: 2, at: 0, scale: 1, offX: 0, offY: 0, shadow: 0.35, flip: false };
let spanPick = false;   // the next click on a grid tile sets the block's top-left tile
let spanLive = false;   // show the block over the grid while it is being placed

/* Geometry over the block's crop windows (cols×1080 by rows×1440): the cutout
   fitted inside, standing on the bottom edge, then scaled and panned. */
function spanGeometry(im, o = spanOpts) {
  const SW = MOS.W * o.cols, SH = MOS.H * o.rows;
  const s = Math.min(SW / im.naturalWidth, SH / im.naturalHeight) * o.scale;
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  return { dw, dh, ox: (SW - dw) / 2 + o.offX * SW / 2, oy: (SH - dh) + o.offY * SH / 2 };
}
/* Subject settings that draw this tile's slice: the renderer's box is scale×H
   tall, centred on x, standing on y — so any placement is expressible. */
function spanSubject(g, r, c, o, prev) {
  const x = g.ox - c * MOS.W, y = g.oy - r * MOS.H + (H - MOS.H) / 2;
  return { ...(prev || baseDoc('').subject), on: true, image: o.image, scale: +(g.dh / H).toFixed(4), x: +((x + g.dw / 2) / W).toFixed(4), y: +((y + g.dh) / H).toFixed(4), shadow: o.shadow, sat: 1, flip: o.flip };
}
function spanCol0(o = spanOpts) { return Math.min(o.at % 3, 3 - o.cols); }
function spanTiles(o = spanOpts) {
  const order = settings.gridOrder || [], list = [], col0 = spanCol0(o), row0 = Math.floor(o.at / 3);
  for (let r = 0; r < o.rows; r++) for (let c = 0; c < o.cols; c++) { const i = (row0 + r) * 3 + col0 + c; list.push({ r, c, i, id: order[i] || null }); }
  return list;
}
const liveDoc = c => c.id === doc?.id ? doc : c.doc;
const spanOnTiles = id => covers.filter(c => liveDoc(c).span?.id === id);
function spanPreviewDocs() {
  if (!spanLive || !spanOpts.image) return null;
  const im = getImg(spanOpts.image); if (!im) return null;
  const g = spanGeometry(im), m = new Map();
  for (const t of spanTiles()) {
    if (!t.id) continue; const rec = covers.find(c => c.id === t.id); if (!rec) continue;
    const src = liveDoc(rec), d = JSON.parse(JSON.stringify(src));
    d.subject = spanSubject(g, t.r, t.c, spanOpts, src.span?.prev || src.subject); m.set(t.id, d);
  }
  return m;
}
let gridRaf = 0;
function renderGridSoon() { if (gridRaf) return; gridRaf = requestAnimationFrame(() => { gridRaf = 0; renderGrid(); }); }
function setSpanAt(i) { spanOpts.at = i; spanPick = false; spanLive = true; renderSpanPanel(); renderGrid(); }
/* Writes the changed docs back — the open cover through the editor's own
   save (so undo works), the rest in one storage write. */
async function saveChanged(list) {
  const live = list.find(c => c.id === doc?.id);
  const rest = list.filter(c => c.id !== doc?.id); rest.forEach(c => c.updatedAt = c.doc.updatedAt);
  if (rest.length) await store.saveCovers(rest);
  if (live) { syncAll(); commit(); }
}
async function applySpan() {
  const id = spanOpts.image; if (!id) return toast('Pick or drop a cutout first');
  await preloadAssets([id]); const im = getImg(id); if (!im) return toast('Cutout still loading — try again in a second');
  const g = spanGeometry(im), changed = new Set(), now = Date.now();
  if (covers.some(c => c.id === doc?.id && (liveDoc(c).span?.id === id || spanTiles().some(t => t.id === c.id)))) pushUndo();
  // this cutout's old slices come off first, then the block is laid fresh
  for (const c of spanOnTiles(id)) { const d = liveDoc(c); d.subject = d.span.prev ? { ...d.span.prev } : { ...d.subject, on: false }; delete d.span; d.updatedAt = now; changed.add(c); }
  let n = 0;
  for (const t of spanTiles()) {
    if (!t.id) continue; const c = covers.find(x => x.id === t.id); if (!c) continue;
    const d = liveDoc(c), prev = d.span?.prev || d.subject;
    d.span = { id, col: t.c, row: t.r, cols: spanOpts.cols, rows: spanOpts.rows, at: spanOpts.at, scale: spanOpts.scale, offX: spanOpts.offX, offY: spanOpts.offY, shadow: spanOpts.shadow, flip: spanOpts.flip, prev: JSON.parse(JSON.stringify(prev)) };
    d.subject = spanSubject(g, t.r, t.c, spanOpts, prev); d.updatedAt = now; changed.add(c); n++;
  }
  if (!n) return toast('No covers under that block — move it onto the grid');
  await saveChanged([...changed]);
  spanLive = false; renderGrid(); renderCoverList(); renderSpanPanel();
  toast(`Cutout laid across ${n} tile${n > 1 ? 's' : ''} — open any of them to see its slice`);
}
async function removeSpan() {
  const id = spanOpts.image, on = spanOnTiles(id); if (!on.length) return toast('This cutout isn’t on any tile');
  if (on.some(c => c.id === doc?.id)) pushUndo();
  const now = Date.now();
  for (const c of on) { const d = liveDoc(c); d.subject = d.span.prev ? { ...d.span.prev } : { ...d.subject, on: false }; delete d.span; d.updatedAt = now; }
  await saveChanged(on);
  spanLive = true; renderGrid(); renderCoverList(); renderSpanPanel(); toast(`Cutout taken off ${on.length} tile${on.length > 1 ? 's' : ''}`);
}
async function chooseSpanImage(id) {
  spanOpts.image = id || null;
  const t = spanOnTiles(id)[0]; // a cutout already on the grid brings its block and framing back
  if (t) { const sp = liveDoc(t).span; Object.assign(spanOpts, { cols: sp.cols, rows: sp.rows, at: sp.at, scale: sp.scale, offX: sp.offX, offY: sp.offY, shadow: sp.shadow, flip: sp.flip }); }
  spanLive = !!id; if (id) await preloadAssets([id]);
  renderSpanPanel(); renderGrid();
}
function renderSpanPanel() {
  const sel = $('#spanImage'); if (!sel) return;
  sel.innerHTML = '<option value="">— pick a cutout —</option>' + assetsOf('cutout').map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join(''); sel.value = spanOpts.image || '';
  $('#spanCols').value = spanOpts.cols; $('#spanRows').value = spanOpts.rows;
  SPAN_SLIDERS.forEach(([id, key, fmt]) => { $('#' + id).value = spanOpts[key]; $('#' + id + 'V').textContent = fmt(spanOpts[key]); });
  $('#spanFlip').setAttribute('aria-pressed', spanOpts.flip); $('#spanPickBtn').setAttribute('aria-pressed', spanPick);
  $('#spanWhere').textContent = `row ${Math.floor(spanOpts.at / 3) + 1}, column ${spanCol0() + 1} · ${spanOpts.cols} wide × ${spanOpts.rows} tall`;
  const on = spanOnTiles(spanOpts.image).length;
  $('#btnSpanApply').textContent = on ? 'Re-lay across the tiles' : 'Lay across the tiles';
  $('#btnSpanApply').disabled = !spanOpts.image; $('#btnSpanRemove').disabled = !on;
}
const SPAN_SLIDERS = [['spanScale', 'scale', v => v.toFixed(2) + '×'], ['spanX', 'offX', v => v.toFixed(2)], ['spanY', 'offY', v => v.toFixed(2)], ['spanShadow', 'shadow', v => Math.round(v * 100) + '%']];
async function addSpanImage(f) {
  if (!f?.type.startsWith('image/')) return toast('That isn’t an image file');
  setStatus('cutting out the subject…');
  const rec = await cutoutFromFile(f);
  setStatus('saved · this browser', 'ok'); if (!rec) return;
  refreshAssetSelects(); if ($('#view-cutout').classList.contains('active')) renderCutoutView();
  Object.assign(spanOpts, { scale: 1, offX: 0, offY: 0 });
  await chooseSpanImage(rec.id);
  toast('Cutout ready and laid over the block — set the block and framing, then press Lay across the tiles');
}
function bindSpan() {
  $('#spanImage').addEventListener('change', e => chooseSpanImage(e.target.value));
  const upd = () => { spanLive = true; renderSpanPanel(); renderGrid(); };
  $('#spanCols').addEventListener('change', e => { spanOpts.cols = clamp(+e.target.value | 0, 1, 3); upd(); });
  $('#spanRows').addEventListener('change', e => { spanOpts.rows = clamp(+e.target.value | 0, 1, 8); upd(); });
  SPAN_SLIDERS.forEach(([id, key, fmt]) => { const e = $('#' + id), l = $('#' + id + 'V'); e.addEventListener('input', () => { spanOpts[key] = +e.value; l.textContent = fmt(+e.value); spanLive = true; renderGridSoon(); }); });
  $('#spanFlip').onclick = () => { spanOpts.flip = !spanOpts.flip; upd(); };
  $('#spanPickBtn').onclick = () => { spanPick = !spanPick; renderSpanPanel(); $('#igrid').classList.toggle('pick', spanPick); if (spanPick) toast('Click the tile that should be the top-left of the block'); };
  $('#spanLeft').onclick = () => { if (spanCol0() > 0) { spanOpts.at = Math.floor(spanOpts.at / 3) * 3 + spanCol0() - 1; upd(); } };
  $('#spanRight').onclick = () => { if (spanCol0() + spanOpts.cols < 3) { spanOpts.at = Math.floor(spanOpts.at / 3) * 3 + spanCol0() + 1; upd(); } };
  $('#spanUp').onclick = () => { if (spanOpts.at >= 3) { spanOpts.at -= 3; upd(); } };
  $('#spanDown').onclick = () => { spanOpts.at += 3; upd(); };
  $('#btnSpanApply').onclick = applySpan; $('#btnSpanRemove').onclick = removeSpan;
  $('#spanUpload').onclick = () => pickFile(addSpanImage);
  const dz = $('#spanDrop');
  dz.onclick = () => pickFile(addSpanImage);
  dz.addEventListener('dragover', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; dz.classList.add('filedrop'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('filedrop'));
  dz.addEventListener('drop', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); dz.classList.remove('filedrop'); addSpanImage(e.dataTransfer.files[0]); });
  renderSpanPanel();
}

/* ================= batch: the 72-cover set =================
   Captions come from the cover-text index (captions.js). Each cover is an
   ordinary document afterwards — nothing about it is locked or special. */
const COVER_TEXT = (window.__COVER_TEXT__ || []).slice();
const batchOpts = { pool: [], tint: 0.3, size: 112, pos: 0.36, mono: false, replace: true, shuffle: true, seq: null };

function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; }
/* Even spread: each pass uses every photo once, and a photo never follows itself
   across the seam between passes. */
function assort(pool, count, doShuffle) {
  if (!pool.length) return [];
  const out = [];
  while (out.length < count) {
    let bag = doShuffle ? shuffled(pool) : pool.slice();
    if (out.length && bag.length > 1 && bag[0] === out[out.length - 1]) [bag[0], bag[1]] = [bag[1], bag[0]];
    for (const p of bag) { if (out.length < count) out.push(p); }
  }
  return out;
}

/* Stills are dealt by GRID position, not post number. The profile shows newest
   first in rows of three, so a cover's neighbours are the one before it and the
   one above it; neither may share its still. Every still gets an equal share,
   and picks favour the stills with the most left so the tail never runs out of
   legal options. `rand` is seeded for the demo so every browser that opens the
   link sees the same grid. Returns one still per grid slot, slot 0 = newest. */
function assortGrid(pool, count, cols, rand) {
  if (!pool.length) return [];
  const quota = Math.ceil(count / pool.length);
  for (let attempt = 0; attempt < 200; attempt++) {
    const left = new Map(pool.map(p => [p, quota])), out = [];
    for (let i = 0; i < count; i++) {
      const ok = pool.filter(p => left.get(p) > 0 && p !== out[i - 1] && p !== out[i - cols]);
      if (!ok.length) break;
      const most = Math.max(...ok.map(p => left.get(p)));
      const top = ok.filter(p => left.get(p) >= most - 1);
      const pick = top[Math.floor(rand() * top.length)];
      out.push(pick); left.set(pick, left.get(pick) - 1);
    }
    if (out.length === count) return out;
  }
  return assort(pool, count, true);
}
function seededRand(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* Still for each entry of COVER_TEXT (oldest first), dealt across the grid. */
function batchStills(o, rand) {
  const n = COVER_TEXT.length;
  if (!o.shuffle) return assort(o.pool, n, false);
  const grid = assortGrid(o.pool, n, 3, rand || Math.random);
  return COVER_TEXT.map((c, i) => grid[n - 1 - i]);
}
function coverRecord(d) { return { id: d.id, name: d.name, createdAt: d.createdAt, updatedAt: d.updatedAt, doc: d, versions: [] }; }
function buildBatchRecs(o, stills) {
  const now = Date.now();
  return COVER_TEXT.map((c, i) => { const d = buildBatchDoc(c, stills[i], o); d.createdAt = d.updatedAt = now + i; return coverRecord(d); });
}
/* The headline is measured to fit, so the face has to be real before layout. */
function loadCoverFonts() {
  return Promise.allSettled(['600 100px', 'italic 400 100px', '400 100px'].map(f => document.fonts.load(`${f} "${COVER_FONT}"`)));
}
/* Profile order is newest first: the 72 run 72 → 01, then the mosaic sits under
   them as the nine oldest posts. Its last-posted tile is the top-left one, so
   tiles go in reverse posting order — in posting order the picture lands
   rotated 180°. */
function mosaicGridIds(recs) {
  const sets = [...new Set(recs.map(r => mosaicSetOf(r.doc)))];
  return sets.flatMap(s => recs.filter(r => mosaicSetOf(r.doc) === s).sort((a, b) => b.doc.mosaic.postOrder - a.doc.mosaic.postOrder).map(r => r.id));
}
function batchGridIds(recs) { return [...recs].sort((a, b) => b.doc.batch.n - a.doc.batch.n).map(r => r.id); }

/* getImg is lazy, so anything that RENDERS (rather than just schedules a
   repaint) has to wait for the decode first. */
function preloadAssets(ids) {
  return Promise.all([...new Set(ids)].filter(Boolean).map(id => new Promise(res => {
    if (getImg(id)) return res();
    const a = assets[id]; if (!a) return res();
    const im = imgCache[id] || new Image();
    if (im.complete && im.naturalWidth) return res();
    im.addEventListener('load', res, { once: true });
    im.addEventListener('error', res, { once: true });
    if (!im.src) { im.crossOrigin = 'anonymous'; im.src = a.url; imgCache[id] = im; }
    setTimeout(res, 8000);
  })));
}
let _mctx;
function measureCtx() { if (!_mctx) _mctx = document.createElement('canvas').getContext('2d'); return _mctx; }
function measureLayer(l) {
  const x = measureCtx(); x.font = fontString(l); x.letterSpacing = `${l.track * l.size}px`;
  const lines = wrapLines(x, l.upper ? l.text.toUpperCase() : l.text, l.width * W);
  return { lines, height: lines.length * l.size * l.line };
}
/* Shrink the headline until it fits in at most `maxLines` lines. */
function fitMain(l, maxLines) {
  for (let s = l.size; s >= 54; s -= 4) { l.size = s; if (measureLayer(l).lines.length <= maxLines) return l; }
  return l;
}
/* Cover look: the editor's own caption face — white Fraunces 600, tight tracking,
   a soft shadow instead of an outline — centred, no box. A tracked-caps label
   above and an italic sub-line below, both Fraunces, so the set stays one family.
   The block is vertically centred on `pos` so kicker/headline/sub stay together. */
const COVER_FONT = 'Fraunces';
function coverLayers(c, o) {
  const layers = [];
  const mk = (over) => newText(Object.assign({
    font: COVER_FONT, align: 'center', x: 0.5, color: '#ffffff', box: 'none',
    boxColor: '#0d0b08', outline: 0, behind: false,
  }, over));
  const kicker = c.kicker ? mk({ text: c.kicker, weight: 600, size: 32, track: 0.16, line: 1.2, width: 0.86, upper: true, shadow: 0.7, color: '#f2efe8' }) : null;
  const main = fitMain(mk({ text: c.main, weight: 600, size: o.size, track: -0.02, line: 1.02, width: 0.86, shadow: 0.62 }), 4);
  const sub = c.sub ? mk({ text: c.sub, weight: 400, italic: true, size: Math.round(o.size * 0.42), track: 0, line: 1.18, width: 0.8, shadow: 0.7, color: '#ece7dc' }) : null;

  const gap = main.size * 0.34;
  const kH = kicker ? measureLayer(kicker).height : 0;
  const mH = measureLayer(main).height;
  const sH = sub ? measureLayer(sub).height : 0;
  const total = kH + (kicker ? gap * 0.6 : 0) + mH + (sub ? gap : 0) + sH;
  let y = o.pos * H - total / 2;
  if (kicker) { kicker.y = y / H; y += kH + gap * 0.6; layers.push(kicker); }
  main.y = y / H; y += mH; layers.push(main);
  if (sub) { sub.y = (y + gap) / H; layers.push(sub); }
  return layers;
}
function batchDocName(c) {
  const n = String(c.n).padStart(2, '0');
  if (c.empty) return `${n} · needs copy`;
  const t = (c.kicker ? c.kicker + ' — ' : '') + c.main.replace(/\n/g, ' ');
  return `${n} · ${t.length > 46 ? t.slice(0, 45).trimEnd() + '…' : t}`;
}
function buildBatchDoc(c, photoId, o) {
  const d = baseDoc(batchDocName(c));
  d.id = uid();
  d.bg = { ...d.bg, type: 'image', image: photoId, fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: o.mono ? 0 : 1, pad: '#0d0b08' };
  d.subject = { ...d.subject, on: false };
  d.overlay = { type: 'vignette', color: '#000000', opacity: o.tint };
  d.grain = 0.05;
  d.layers = c.empty ? [] : coverLayers(c, o);
  d.batch = { n: c.n, date: c.date, era: c.era, source: c.source, flag: c.flag, empty: c.empty };
  return d;
}

function renderPool() {
  const g = $('#poolGrid'); if (!g) return; g.innerHTML = '';
  const add = document.createElement('button'); add.className = 'addtile'; add.title = 'Add photos (you can select several at once)';
  add.textContent = '+'; add.onclick = () => pickFiles(async files => {
    setStatus('adding photos…');
    for (const f of files) { if (!f.type.startsWith('image/')) continue; const rec = await store.putAsset(f, 'photo', f.name.replace(/\.[^.]+$/, '').slice(0, 40)); batchOpts.pool.push(rec.id); }
    setStatus('saved', 'ok'); refreshAssetSelects(); renderBgPick(); renderPool(); toast(`${files.length} photo${files.length > 1 ? 's' : ''} added`);
  });
  g.appendChild(add);
  const all = [...assetsOf('photo'), ...assetsOf('bg')];
  all.forEach(a => {
    const b = document.createElement('button'); b.title = a.name;
    b.setAttribute('aria-pressed', batchOpts.pool.includes(a.id));
    const im = new Image(); im.src = a.url; im.alt = a.name; b.appendChild(im);
    const t = document.createElement('span'); t.className = 'tick'; t.textContent = '✓'; b.appendChild(t);
    b.onclick = () => { const i = batchOpts.pool.indexOf(a.id); i < 0 ? batchOpts.pool.push(a.id) : batchOpts.pool.splice(i, 1); renderPool(); };
    g.appendChild(b);
  });
  const n = batchOpts.pool.length;
  $('#poolCount').textContent = n ? `${n} of ${all.length} selected.` : 'None selected yet.';
  $('#stepPhotos').querySelector('h4').classList.toggle('done', n > 0);
  $('#btnGenerate').disabled = n === 0;
  $('#btnGenerate').title = n ? '' : 'Add at least one photo first';
}
function renderCapsTable() {
  const b = $('#capsBody'); if (!b || b.children.length) return;
  COVER_TEXT.forEach(c => {
    const tr = document.createElement('tr');
    const text = c.empty ? '<span class="blank">blank — new copy required</span>'
      : (c.kicker ? `<div class="kick">${escapeHtml(c.kicker)}</div>` : '') +
        `<div class="mn">${escapeHtml(c.main)}</div>` +
        (c.sub ? `<div class="sb">${escapeHtml(c.sub)}</div>` : '');
    tr.innerHTML = `<td class="num">${String(c.n).padStart(2, '0')}</td><td class="era">${c.date}</td><td>${text}</td><td class="era">${c.era.replace(' era', '')}</td>`;
    b.appendChild(tr);
  });
}
function renderBatchPreviews(docs) {
  const p = $('#batchPreviews'); p.innerHTML = '';
  docs.slice(0, 12).forEach(d => {
    const f = document.createElement('figure');
    const cv = lazyCanvas(d, 110 * 2); cv.title = 'Open in the editor';
    cv.onclick = () => { const rec = covers.find(c => c.id === d.id); if (rec) { loadDoc(rec.doc); switchView('editor'); } };
    f.appendChild(cv);
    const cap = document.createElement('figcaption'); cap.textContent = d.name; f.appendChild(cap);
    p.appendChild(f);
  });
}

async function generateBatch() {
  if (!batchOpts.pool.length) return toast('Add at least one photo first');
  const btn = $('#btnGenerate'), prog = $('#batchProg'), bar = $('i', prog);
  btn.disabled = true; prog.classList.add('on'); bar.style.width = '2%';
  $('#batchMsg').textContent = 'loading fonts…';
  await loadCoverFonts();
  $('#batchMsg').textContent = 'loading photos…';
  await preloadAssets(batchOpts.pool);

  if (batchOpts.replace) {
    const old = covers.filter(c => c.doc?.batch && !c.doc.reel); // the reel to-do set is hand-finished work, never regenerated
    for (const o of old) { await store.deleteCover(o.id).catch(() => {}); }
    covers = covers.filter(c => !c.doc?.batch || c.doc.reel);
    settings.gridOrder = (settings.gridOrder || []).filter(id => covers.some(c => c.id === id));
  }
  batchOpts.seq = batchStills(batchOpts);
  const recs = buildBatchRecs(batchOpts, batchOpts.seq), docs = recs.map(r => r.doc);

  $('#batchMsg').textContent = 'saving…';
  await store.saveCovers(recs, n => { bar.style.width = Math.round(4 + n / recs.length * 96) + '%'; $('#batchMsg').textContent = `${n} of ${recs.length} saved`; });
  covers = covers.concat(recs);
  // newest-first on a profile grid, so the set reads 72 → 01 top-left
  settings.gridOrder = batchGridIds(recs).concat(settings.gridOrder || []);
  await store.saveSettings(settings).catch(() => {});

  renderBatchPreviews(docs); renderCoverList();
  const blanks = COVER_TEXT.filter(c => c.empty).length;
  $('#batchMsg').textContent = `${recs.length} covers · ${blanks} blank`;
  $('#stepRun').querySelector('h4').classList.add('done');
  btn.disabled = false; setTimeout(() => { prog.classList.remove('on'); bar.style.width = '0'; }, 800);
  toast(`${recs.length} covers generated — ${blanks} left blank for new copy`);
  loadDoc(docs[0]);
}

async function exportBatchZip() {
  // one cover per post number: a reel to-do cover stands in for the generated one,
  // and one still on the placeholder plate is left out so it can never be posted
  const byN = new Map();
  for (const r of covers.filter(c => c.doc?.batch)) { const cur = byN.get(r.doc.batch.n); if (!cur || (r.doc.reel && !cur.doc.reel)) byN.set(r.doc.batch.n, r); }
  const live = r => r.id === doc?.id ? doc : r.doc;
  const all = [...byN.values()].sort((a, b) => a.doc.batch.n - b.doc.batch.n);
  const set = all.filter(r => !onPlaceholder(live(r))), held = all.length - set.length;
  if (!set.length) return toast(all.length ? 'Every cover is still on the placeholder photo' : 'Generate the set first');
  const prog = $('#batchProg'), bar = $('i', prog); prog.classList.add('on');
  const zip = new JSZip();
  for (let i = 0; i < set.length; i++) {
    const d = live(set[i]);
    zip.file(`${String(d.batch.n).padStart(2, '0')}-${slug(d.name.replace(/^\d+ · (TODO · )?/, ''))}.png`, await renderBlob(d, 1));
    bar.style.width = Math.round((i + 1) / set.length * 100) + '%'; $('#batchMsg').textContent = `rendering ${i + 1} of ${set.length}`;
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  await store.download('harrison-reel-covers-72.zip', blob);
  $('#batchMsg').textContent = held ? `exported ${set.length} · ${held} left out, still on the placeholder photo` : 'exported'; prog.classList.remove('on'); bar.style.width = '0';
  if (held) toast(`${held} cover${held > 1 ? 's' : ''} left out — still on the placeholder photo`);
}

function bindBatch() {
  const rng = (id, key, fmt) => { const e = $('#' + id), l = $('#' + id + 'V'); e.addEventListener('input', () => { batchOpts[key] = +e.value; if (l) l.textContent = fmt(+e.value); }); l.textContent = fmt(+e.value); };
  rng('bTint', 'tint', v => Math.round(v * 100) + '%');
  rng('bSize', 'size', v => v);
  rng('bPos', 'pos', v => v.toFixed(2));
  $('#bMono').onclick = e => { batchOpts.mono = !batchOpts.mono; e.currentTarget.setAttribute('aria-pressed', batchOpts.mono); };
  $('#bReplace').onclick = () => { batchOpts.replace = true; $('#bReplace').setAttribute('aria-pressed', true); $('#bKeep').setAttribute('aria-pressed', false); };
  $('#bKeep').onclick = () => { batchOpts.replace = false; $('#bKeep').setAttribute('aria-pressed', true); $('#bReplace').setAttribute('aria-pressed', false); };
  $('#bShuffle').onclick = () => { batchOpts.shuffle = true; $('#bShuffle').setAttribute('aria-pressed', true); $('#bSeq').setAttribute('aria-pressed', false); };
  $('#bSeq').onclick = () => { batchOpts.shuffle = false; $('#bSeq').setAttribute('aria-pressed', true); $('#bShuffle').setAttribute('aria-pressed', false); };
  $('#poolAll').onclick = () => { batchOpts.pool = [...assetsOf('photo'), ...assetsOf('bg')].map(a => a.id); renderPool(); };
  $('#poolNone').onclick = () => { batchOpts.pool = []; renderPool(); };
  $('#btnGenerate').onclick = generateBatch;
  $('#btnReshuffle').onclick = generateBatch;
  $('#btnBatchZip').onclick = exportBatchZip;
  const blanks = COVER_TEXT.filter(c => c.empty).length;
  $('#batchState').textContent = `${COVER_TEXT.length - blanks} captioned covers and ${blanks} left blank for new copy. Existing covers are untouched unless you replace a previous batch.`;
}
async function renderBatchView() {
  renderCapsTable(); renderPool();
  await preloadAssets(batchOpts.pool.slice(0, 12));
  const existing = covers.filter(c => c.doc?.batch).sort((a, b) => a.doc.batch.n - b.doc.batch.n);
  if (existing.length && !$('#batchPreviews').children.length) {
    renderBatchPreviews(existing.map(r => r.doc));
    $('#batchMsg').textContent = `${existing.length} covers in your library`;
    $('#stepRun').querySelector('h4').classList.add('done');
  }
}


/* ================= 3x3 grid mosaic =================
   Nine reels whose PROFILE-GRID CROP reassembles into one picture. Instagram
   crops a reel to 3:4 from the centre, so the mosaic is laid out across nine
   1080x1440 crop windows (3240 x 4320 overall) and each tile is rendered
   full-bleed 1080x1920 around its own window — the reel still looks whole when
   opened, and the grid shows the mosaic. Lives on the profile-grid tab: upload
   or drop a photo there and it is cut straight onto the foot of the grid. */
const MOS = { W: 1080, H: 1440, COLS: 3, ROWS: 3 };
const mosaicOpts = { image: 'mosaic', zoom: 1, offX: 0, offY: 0 };

function mosaicRect(im, r, c, o) {
  const MW = MOS.W * MOS.COLS, MH = MOS.H * MOS.ROWS;
  // cover the mosaic box, with 240px of overscan so full-bleed tiles never show a gap
  const s = Math.max(MW / im.naturalWidth, (MH + 480) / im.naturalHeight) * o.zoom;
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  const ox = (MW - dw) / 2 + o.offX * (Math.abs(dw - MW) / 2 + MOS.W * 0.5);
  const oy = (MH - dh) / 2 + o.offY * (Math.abs(dh - MH) / 2 + MOS.H * 0.5);
  return { x: ox - c * MOS.W, y: oy - r * MOS.H + (H - MOS.H) / 2, w: dw, h: dh };
}
/* Instagram puts the newest post top-left, so the tiles are posted in reverse
   reading order: bottom-right first, top-left last. */
function mosaicOrder() {
  const t = [];
  for (let r = MOS.ROWS - 1; r >= 0; r--) for (let c = MOS.COLS - 1; c >= 0; c--) t.push({ r, c });
  return t; // index 0 = post first
}
const POSNAME = [['top-left', 'top-centre', 'top-right'], ['middle-left', 'centre', 'middle-right'], ['bottom-left', 'bottom-centre', 'bottom-right']];

/* Each mosaic is keyed by the photo it was cut from, so several can sit on the
   grid at once and re-cutting one leaves the others alone. Tiles cut before
   sets existed carry no key; their background photo stands in. */
const mosaicSetOf = d => d?.mosaic ? (d.mosaic.set || d.bg?.image) : null;
const mosaicTiles = set => covers.filter(c => mosaicSetOf(c.doc) === set);
const mosaicLabel = id => (assets[id]?.name || 'photo').replace(/\s*\(mosaic\)\s*$/i, '');

function buildMosaicDocs(silent, o = mosaicOpts) {
  const im = getImg(o.image);
  if (!im) { if (!silent) toast('Photo still loading — try again in a second'); return null; }
  return mosaicOrder().map((t, i) => {
    const d = baseDoc(`Mosaic ${i + 1}/9 · ${POSNAME[t.r][t.c]} · ${mosaicLabel(o.image)}`);
    d.id = uid();
    d.bg = { ...d.bg, type: 'image', image: o.image, rect: mosaicRect(im, t.r, t.c, o), bright: 1, sat: 1, blur: 0, pad: '#0b0906' };
    d.subject = { ...d.subject, on: false };
    d.overlay = { type: 'none', color: '#000000', opacity: 0 };
    d.grain = 0;
    d.layers = [];
    d.mosaic = { set: o.image, index: i, row: t.r, col: t.c, postOrder: i + 1, zoom: o.zoom, offX: o.offX, offY: o.offY };
    return d;
  });
}
function renderMosaicPreview() {
  const wrap = $('#mosPreview'); if (!wrap) return;
  $('#btnMosaic').textContent = mosaicTiles(mosaicOpts.image).length === 9 ? 'Re-cut the 9 tiles on the grid' : 'Add 9 tiles to the grid';
  const docs = buildMosaicDocs(true); if (!docs) return;
  wrap.innerHTML = '';
  // shown in reading order so it reads as the finished grid, not the posting order
  const byPos = {}; docs.forEach(d => byPos[d.mosaic.row + ',' + d.mosaic.col] = d);
  for (let r = 0; r < MOS.ROWS; r++) for (let c = 0; c < MOS.COLS; c++) {
    const d = byPos[r + ',' + c];
    const cv = document.createElement('canvas');
    const cssW = 96, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = cssW * dpr; cv.height = cssW * 4 / 3 * dpr;
    // draw only the 3:4 crop window — what the profile grid actually shows
    const x = cv.getContext('2d'); const s = cssW * dpr / MOS.W;
    x.save(); x.translate(0, -(H - MOS.H) / 2 * s); render(x, d, s, null); x.restore();
    cv.title = `${POSNAME[r][c]} · post ${d.mosaic.postOrder} of 9`;
    wrap.appendChild(cv);
  }
  $('#mosPostOrder').textContent = mosaicOrder().map(t => POSNAME[t.r][t.c]).join(' → ');
}
/* Cuts the chosen photo into nine tiles on the grid. A photo that already has
   a mosaic there is re-cut in place; a new one goes to the foot of the grid. */
async function generateMosaic() {
  await preloadAssets([mosaicOpts.image]);
  const docs = buildMosaicDocs(); if (!docs) return false;
  const btn = $('#btnMosaic'); btn.disabled = true;
  const set = mosaicOpts.image, old = mosaicTiles(set), oldIds = new Set(old.map(c => c.id));
  const order = settings.gridOrder || [];
  let at = order.findIndex(id => oldIds.has(id));
  for (const o of old) await store.deleteCover(o.id).catch(() => {});
  covers = covers.filter(c => !oldIds.has(c.id));
  const now = Date.now();
  const recs = docs.map((d, i) => { d.createdAt = d.updatedAt = now + i; return coverRecord(d); });
  await store.saveCovers(recs);
  covers = covers.concat(recs);
  const kept = order.filter(id => !oldIds.has(id));
  if (at < 0) at = kept.length;
  kept.splice(at, 0, ...mosaicGridIds(recs));
  settings.gridOrder = kept;
  await store.saveSettings(settings).catch(() => {});
  renderCoverList(); renderGrid(); renderMosaicPreview(); btn.disabled = false;
  const off = at % 3;
  toast(off ? `9 tiles cut, but they start ${off} tile${off > 1 ? 's' : ''} into a row — move a cover so the mosaic starts a row`
    : old.length ? '9 tiles re-cut in place — post bottom-right first' : '9 tiles added at the foot of the grid — post bottom-right first');
  return true;
}
/* The nine tiles as PNGs, numbered in posting order so file 01 is the first
   post. Exports what is on the grid for the chosen photo when its nine tiles
   are there; otherwise cuts a fresh set from the panel's framing. */
async function exportMosaicZip() {
  const set = mosaicOpts.image;
  let docs = mosaicTiles(set).map(c => c.id === doc?.id ? doc : c.doc);
  if (docs.length !== 9) { await preloadAssets([set]); docs = buildMosaicDocs(); if (!docs) return; }
  docs = [...docs].sort((a, b) => a.mosaic.postOrder - b.mosaic.postOrder);
  const btn = $('#btnMosaicZip'); btn.disabled = true; toast('Rendering 9 tiles…');
  const zip = new JSZip(); const name = d => `${String(d.mosaic.postOrder).padStart(2, '0')}-${slug(POSNAME[d.mosaic.row][d.mosaic.col])}`;
  for (const d of docs) zip.file(name(d) + '.png', await renderBlob(d, 1));
  zip.file('POST-ORDER.txt', ['Post in file order, 01 first, back to back with nothing in between.', '',
    ...docs.map(d => `${name(d)}.png`), '',
    'Each tile is a full 1080x1920 reel cover. The picture only lines up in the profile grid (3:4 crop).'].join('\n'));
  const blob = await zip.generateAsync({ type: 'blob' });
  await store.download(`mosaic-${slug(mosaicLabel(set))}.zip`, blob);
  btn.disabled = false; toast('9 tiles exported');
}
function bindMosaic() {
  const sel = $('#mosImage');
  const fill = () => { sel.innerHTML = [...assetsOf('photo'), ...assetsOf('bg')].map(a => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join(''); sel.value = mosaicOpts.image; };
  sel._fill = fill; fill();
  const sliders = [['mosZoom', 'zoom', v => v.toFixed(2) + '×'], ['mosX', 'offX', v => v.toFixed(2)], ['mosY', 'offY', v => v.toFixed(2)]];
  const syncSliders = () => sliders.forEach(([id, key, fmt]) => { $('#' + id).value = mosaicOpts[key]; $('#' + id + 'V').textContent = fmt(mosaicOpts[key]); });
  const choose = id => {
    mosaicOpts.image = id; sel.value = id;
    const t = mosaicTiles(id)[0]?.doc.mosaic; // a photo already on the grid brings its framing back
    if (t && t.zoom != null) Object.assign(mosaicOpts, { zoom: t.zoom, offX: t.offX, offY: t.offY });
    syncSliders(); renderMosaicPreview();
  };
  sel.addEventListener('change', () => choose(sel.value));
  // an uploaded or dropped photo is cut into nine straight away
  const addPhoto = async f => {
    if (!f?.type.startsWith('image/')) return toast('That isn’t an image file');
    const rec = await store.putAsset(f, 'photo', f.name.replace(/\.[^.]+$/, '').slice(0, 40));
    await preloadAssets([rec.id]);
    Object.assign(mosaicOpts, { image: rec.id, zoom: 1, offX: 0, offY: 0 });
    fill(); refreshAssetSelects(); renderBgPick(); renderPool(); syncSliders(); renderMosaicPreview();
    await generateMosaic();
  };
  $('#mosUpload').onclick = () => pickFile(addPhoto);
  const dz = $('#mosDrop');
  dz.onclick = () => pickFile(addPhoto);
  dz.addEventListener('dragover', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; dz.classList.add('filedrop'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('filedrop'));
  dz.addEventListener('drop', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); dz.classList.remove('filedrop'); addPhoto(e.dataTransfer.files[0]); });
  sliders.forEach(([id, key, fmt]) => { const e = $('#' + id), l = $('#' + id + 'V'); e.addEventListener('input', () => { mosaicOpts[key] = +e.value; l.textContent = fmt(+e.value); renderMosaicPreview(); }); });
  syncSliders();
  $('#btnMosaic').onclick = () => generateMosaic();
  $('#btnMosaicZip').onclick = exportMosaicZip;
  $('#btnGoGrid').onclick = () => switchView('grid');
}

/* The match photo behind the "slowing down time" cover (C14, DSC08885 from
   the 26 Aug shoot) ships cut as a second mosaic under the candlelight one, so
   the two read side by side on the profile. Given to every browser once; bump
   MOSAIC_SET to push a changed cut. */
const MOSAIC_SET = 'rts-match-1';
async function seedMosaicSet() {
  const o = { image: 'mosaicMatch', zoom: 1, offX: 0, offY: 0 };
  await preloadAssets([o.image]);
  const docs = buildMosaicDocs(true, o); if (!docs) return false;
  const old = mosaicTiles(o.image), oldIds = new Set(old.map(c => c.id));
  for (const c of old) await store.deleteCover(c.id).catch(() => {});
  covers = covers.filter(c => !oldIds.has(c.id));
  const oldest = Date.now() - 120000; // the oldest posts, so the set sits at the foot of every list
  const tiles = docs.map((d, i) => { d.createdAt = d.updatedAt = oldest + i; return coverRecord(d); });
  await store.saveCovers(tiles);
  covers = covers.concat(tiles);
  settings.gridOrder = (settings.gridOrder || []).filter(id => !oldIds.has(id)).concat(mosaicGridIds(tiles));
  settings.mosaicSet = MOSAIC_SET;
  await store.saveSettings(settings).catch(() => {});
  return true;
}

/* ---------------- demo set ----------------
   This link gets shown to clients, and covers only exist in the browser that
   made them, so a first visit would otherwise open on an empty studio. Every
   browser is given the full Return to Self set once: the 72 covers and the 3x3
   mosaic, placed on the profile grid with the mosaic at its foot. Bump DEMO_SET
   to push a changed set to browsers that already hold one. Covers already in
   the library are kept — they only come off the grid, so nothing sits under the
   mosaic or shifts it out of line. */
const DEMO_SET = 'rts-72-fraunces-1';
/* How the demo is shown is gated separately from DEMO_SET, so the view can change
   without regenerating the covers and wiping edits made to them. The mosaic is
   built for the 3:4 profile-grid crop — in the 9:16 reels view each tile also
   shows the 240px above and below its crop window, which repeats across the
   seams — so the demo opens on the 3:4 grid. */
const DEMO_VIEW = 'grid-34-1';
async function seedDemoSet() {
  setStatus('loading the 72 covers…');
  await loadCoverFonts();
  const o = { ...batchOpts, shuffle: true };
  await preloadAssets([mosaicOpts.image, ...o.pool]);
  const mos = buildMosaicDocs(true); if (!mos || !o.pool.length) return false;
  const batch = buildBatchRecs(o, batchStills(o, seededRand(72)));
  const oldest = Date.now() - 60000;
  const tiles = mos.map((d, i) => { d.createdAt = d.updatedAt = oldest + i; return coverRecord(d); });
  // replace an earlier generated set rather than stacking a second copy; the
  // statics stay on top and mosaics cut from other photos stay at the foot
  const gone = covers.filter(c => (c.doc?.batch && !c.doc.reel) || mosaicSetOf(c.doc) === mosaicOpts.image), goneIds = new Set(gone.map(c => c.id));
  for (const c of gone) await store.deleteCover(c.id).catch(() => {});
  const statics = (settings.gridOrder || []).filter(id => covers.find(c => c.id === id)?.doc?.rts);
  const otherMos = covers.filter(c => c.doc?.mosaic && !goneIds.has(c.id));
  covers = covers.filter(c => !goneIds.has(c.id)).concat(batch, tiles);
  await store.saveCovers([...batch, ...tiles]);
  settings.gridOrder = [...statics, ...batchGridIds(batch), ...mosaicGridIds(tiles), ...mosaicGridIds(otherMos)];
  slotReelCovers(covers.filter(c => c.doc?.reel)); // to-do covers go back into their post's slot
  settings.demoSet = DEMO_SET;
  await store.saveSettings(settings).catch(() => {});
  return true;
}


/* ---------------- Return to Self static set ----------------
   Three sets, 45 covers, newest first: v3 (17 Sep), a 3x3 mosaic, one picture
   with the landing page's "if this is you" sorter set once, sliced into nine
   tiles like the batch mosaic (the door boards it replaced are gone); v2 (17 Sep),
   18 boards on the self-worth pillar built on the 26 Aug production-day stills;
   v1, the 18 statics cut from Nathan's 16 Sep videos, one per video. All
   rebuilt here as ordinary editable covers so the copy, plates and marks are
   material to remix. Same look as the reel covers — white Fraunces caps, an italic sub-line,
   one vermilion rule — with a signature strip: ensō mark, name, role, and the
   Shinbukan and Seizanji crests. Copy lives in statics.js; plates in
   assets/statics; marks in assets/brand. The block is anchored above the
   3:4 grid crop so the headline survives the profile view. */
const STATIC_SET = 'rts-statics-v4';
const RTS = { ink: '#14120e', red: '#b5432f', white: '#fbf7ef', font: 'Fraunces' };
function staticHeadSize(t) { const n = t.length; return n <= 32 ? 92 : n <= 62 ? 64 : n <= 92 ? 54 : 47; }
function staticLayers(s) {
  const left = s.layout === 'split';
  const align = left ? 'left' : 'center', ax = left ? 0.067 : 0.5;
  const mk = o => newText(Object.assign({ font: RTS.font, align, x: ax, color: RTS.white, box: 'none', outline: 0, shadow: 0.45, behind: false }, o));
  const kicker = s.kicker ? mk({ text: s.kicker, weight: 600, size: 26, track: 0.24, line: 1.2, width: 0.86, upper: true, color: '#e6dfd2', shadow: 0.3 }) : null;
  const head = mk({ text: s.head, weight: 500, size: staticHeadSize(s.head), track: -0.01, line: 1.02, width: 0.86, upper: true });
  const sub = mk({ text: s.sub, weight: 400, italic: true, size: 27, track: 0, line: 1.3, width: 0.74, color: '#f1ece2', shadow: 0.3 });
  const cta = s.cta ? mk({ text: s.cta, weight: 600, size: 17, track: 0.2, line: 1.2, width: 0.86, upper: true, shadow: 0 }) : null;
  const gap = 20, btnH = 54;
  const kH = kicker ? measureLayer(kicker).height : 0, hH = measureLayer(head).height, sH = measureLayer(sub).height;
  const total = (kicker ? kH + gap : 0) + hH + 14 + 3 + 14 + sH + (cta ? gap + btnH : 0);
  let y = 0.87 * H - total; const layers = [];
  if (kicker) { kicker.y = y / H; layers.push(kicker); y += kH + gap; }
  head.y = y / H; layers.push(head); y += hH + 14;
  layers.push(newRule({ x: left ? ax + 0.02 : 0.5, y: (y + 1.5) / H, width: 0.041, thick: 3, color: RTS.red, alpha: 1 })); y += 3 + 14;
  sub.y = y / H; layers.push(sub); y += sH;
  if (cta) {
    y += gap;
    const x = measureCtx(); x.font = fontString(cta); x.letterSpacing = `${cta.track * cta.size}px`;
    const bw = x.measureText(cta.text.toUpperCase()).width + 64, yc = y + btnH / 2;
    layers.push(newRule({ x: left ? ax + bw / 2 / W : 0.5, y: yc / H, width: bw / W, thick: btnH, color: RTS.red, alpha: 1 }));
    cta.y = (yc - cta.size * cta.line / 2) / H; layers.push(cta);
  }
  layers.push(...signatureLayers(0.925));
  return layers;
}
/* The signature strip on its own, centred on height `sy` (0..1): ensō mark, name,
   role line, Shinbukan and Seizanji crests. Shared by the statics and the Blocks panel. */
function signatureLayers(sy) {
  const mk = o => newText(Object.assign({ font: RTS.font, align: 'left', x: 0.145, color: RTS.white, box: 'none', outline: 0, shadow: 0.45, behind: false }, o));
  return [
    newLogo({ image: 'rtsMark', x: 0.098, y: sy, size: 0.059, alpha: 0.92 }),
    mk({ text: 'Harrison Saito', weight: 500, size: 28, track: 0, line: 1.05, width: 0.5, y: (sy * H - 31) / H, shadow: 0.25 }),
    mk({ text: 'Educator. Martial Artist. Coach.', weight: 500, size: 14, track: 0.18, line: 1.2, width: 0.6, upper: true, y: (sy * H + 5) / H, color: '#cfc7b8', shadow: 0 }),
    newLogo({ image: 'rtsShinbukan', x: 0.815, y: sy, size: 0.043, alpha: 0.9 }),
    newLogo({ image: 'rtsSeizanji', x: 0.895, y: sy, size: 0.078, alpha: 0.9 }),
  ];
}
function buildStaticDoc(s) {
  const d = baseDoc(`${s.id} \u00b7 ${s.name}`);
  if (s.layout === 'mosaic') {
    // one tile of a 3x3 profile-grid mosaic: the picture (type included) is the asset,
    // placed with the same rect maths as the batch mosaic, no layers of its own
    const im = getImg(s.bg);
    d.bg = { ...d.bg, type: 'image', image: s.bg, rect: im ? mosaicRect(im, s.tile.r, s.tile.c, { zoom: 1, offX: 0, offY: 0 }) : undefined,
             fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1, pad: '#0b0906' };
    d.subject = { ...d.subject, on: false };
    d.overlay = { type: 'none', color: '#000000', opacity: 0 };
    d.grain = 0;
    d.layers = [];
    d.rts = { id: s.id, set: STATIC_SET, layout: s.layout, tile: s.tile };
    return d;
  }
  d.bg = { ...d.bg, type: 'image', image: s.bg, fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1, pad: RTS.ink };
  d.subject = { ...d.subject, on: false };
  d.overlay = { type: 'bottom', color: '#0c0905', opacity: s.layout === 'cover' || s.layout === 'archival' ? 0.35 : 0 };
  d.grain = 0.04;
  d.layers = staticLayers(s);
  d.rts = { id: s.id, set: STATIC_SET, layout: s.layout };
  return d;
}
/* Given to every browser once, like the demo set; bump STATIC_SET to push a
   changed set. Earlier static covers are replaced, everything else is kept.
   They go to the top of the profile grid (18 = six full rows, so the mosaic
   at the foot stays aligned). */
async function seedStaticSet() {
  const list = window.__RTS_STATICS__ || []; if (!list.length) return false;
  setStatus('loading the static set\u2026');
  await Promise.allSettled(['500 100px', '600 100px', 'italic 400 100px'].map(f => document.fonts.load(`${f} "${RTS.font}"`)));
  // mosaic tiles need the picture's natural size for their rect
  await preloadAssets([...new Set(list.filter(s => s.layout === 'mosaic').map(s => s.bg))]).catch(() => {});
  // newest in the library, so the studio opens on A1.1 (Date.now alone can tie with a batch seeded in the same tick)
  const now = Math.max(Date.now(), ...covers.map(c => c.updatedAt || 0)) + 1000;
  const recs = list.map((s, i) => { const d = buildStaticDoc(s); d.id = uid(); d.createdAt = d.updatedAt = now + (list.length - i); return coverRecord(d); });
  const old = covers.filter(c => c.doc?.rts), oldIds = new Set(old.map(c => c.id));
  for (const c of old) await store.deleteCover(c.id).catch(() => {});
  covers = covers.filter(c => !c.doc?.rts).concat(recs);
  await store.saveCovers(recs);
  settings.gridOrder = [...recs.map(r => r.id), ...(settings.gridOrder || []).filter(id => !oldIds.has(id))];
  settings.staticSet = STATIC_SET;
  await store.saveSettings(settings).catch(() => {});
  return true;
}

/* ---------------- blocks ----------------
   Ready-made groups of layers — the signature strip, the marks, the two caption
   looks, a CTA button — pasted onto whichever cover is open, so a logo lock-up never
   has to be rebuilt by hand. "Save as block" keeps the open cover's layers (or just
   the selected one) as a block of your own; those live in this browser's settings.
   Everything lands as ordinary layers with fresh ids, in one undo step. */
function ctaLayers(text, yc) {
  const cta = newText({ font: RTS.font, align: 'center', x: 0.5, color: RTS.white, box: 'none', outline: 0, shadow: 0, behind: false, text, weight: 600, size: 17, track: 0.2, line: 1.2, width: 0.86, upper: true });
  const c = measureCtx(); c.font = fontString(cta); c.letterSpacing = `${cta.track * cta.size}px`;
  const bw = c.measureText(text.toUpperCase()).width + 64, btnH = 54;
  cta.y = (yc * H - cta.size * cta.line / 2) / H;
  return [newRule({ x: 0.5, y: yc, width: bw / W, thick: btnH, color: RTS.red, alpha: 1 }), cta];
}
const BLOCKS = [
  { id: 'sig-foot', name: 'Signature strip', make: () => signatureLayers(0.925) },
  { id: 'sig-crop', name: 'Signature · inside grid crop', make: () => signatureLayers(0.842) },
  { id: 'mark', name: 'Ensō mark', make: () => [newLogo({ image: 'rtsMark', x: 0.5, y: 0.17, size: 0.085, alpha: 0.95 })] },
  { id: 'crests', name: 'Dojo crests', make: () => [newLogo({ image: 'rtsShinbukan', x: 0.455, y: 0.17, size: 0.05, alpha: 0.92 }), newLogo({ image: 'rtsSeizanji', x: 0.55, y: 0.17, size: 0.09, alpha: 0.92 })] },
  { id: 'cap-reel', name: 'Reel caption', make: () => coverLayers({ kicker: 'KICKER LINE', main: 'Your headline\ngoes here', sub: 'and the italic sub-line' }, batchOpts) },
  { id: 'cap-static', name: 'Static headline', make: () => staticLayers({ layout: 'cover', kicker: 'RETURN TO SELF', head: 'Your headline goes here', sub: 'The italic sub-line sits under the rule.' }).slice(0, -5) },
  { id: 'cta', name: 'CTA button', make: () => ctaLayers('Book a call', 0.8) },
];
async function pasteBlock(name, layers) {
  if (!layers.length) return;
  pushUndo();
  const fresh = layers.map(l => ({ ...JSON.parse(JSON.stringify(l)), id: uid() }));
  doc.layers.push(...fresh);
  await preloadAssets(fresh.map(l => l.image));
  select(fresh[fresh.length - 1].id); commit(); syncAll();
  toast(`${name} added — ${fresh.length} layer${fresh.length > 1 ? 's' : ''}`);
}
function renderBlocks() {
  const c = $('#blockList'); if (!c) return; c.innerHTML = '';
  BLOCKS.forEach(b => {
    const el = document.createElement('button'); el.className = 'chip'; el.textContent = b.name; el.title = 'Paste onto this cover';
    el.onclick = async () => { await loadCoverFonts(); await document.fonts.load(`500 100px "${RTS.font}"`).catch(() => {}); pasteBlock(b.name, b.make()); };
    c.appendChild(el);
  });
  (settings.blocks || []).forEach(b => {
    const el = document.createElement('button'); el.className = 'chip'; el.title = `Your block · ${b.layers.length} layer${b.layers.length > 1 ? 's' : ''} · paste onto this cover`;
    el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--text, inherit)';
    el.append(b.name + ' ');
    const x = document.createElement('span'); x.textContent = '✕'; x.title = 'Delete this block'; x.style.opacity = '.6';
    x.onclick = e => { e.stopPropagation(); if (!confirm(`Delete the block “${b.name}”?`)) return; settings.blocks = settings.blocks.filter(o => o.id !== b.id); saveSettingsSoon(); renderBlocks(); };
    el.appendChild(x);
    el.onclick = () => pasteBlock(b.name, b.layers);
    c.appendChild(el);
  });
}
function bindBlocks() {
  $('#saveBlock').onclick = () => {
    const one = doc.layers.find(l => l.id === sel), layers = one ? [one] : doc.layers;
    if (!layers.length) return toast('This cover has no layers to save');
    const name = (prompt(one ? 'Save the selected layer as a block. Name it:' : `Save all ${layers.length} layers of this cover as a block. Name it:`, one ? 'My layer' : doc.name.replace(/^\d+ · (TODO · )?/, '').slice(0, 28)) || '').trim();
    if (!name) return;
    settings.blocks = [...(settings.blocks || []), { id: uid(), name, layers: JSON.parse(JSON.stringify(layers)) }];
    saveSettingsSoon(); renderBlocks(); toast(`Saved “${name}” — it is in Blocks on every cover`);
  };
  renderBlocks();
}

/* ---------------- reel to-do set ----------------
   The working queue for re-covering the live reels: one cover for each reel whose
   cover can still be swapped (reels.js, from the updater's manifest), carrying its
   cover text on a placeholder plate, so the only job left per cover is the photo.
   Each takes the grid slot of the generated cover with the same post number — the
   grid stays in posting order and the mosaic stays aligned, and the placeholder
   tiles are the ones still to do. The generated covers are kept in the library.
   Opt-in: only a browser that opens the link ending #todo is given the set, so the
   client demo never shows placeholders. Re-seeding only adds post numbers that have
   no to-do cover yet, so bumping REEL_SET can never wipe finished work. */
const REEL_SET = 'reel-todo-1';
const REEL_PLACEHOLDER = 'reelDummy';
function onPlaceholder(d) { return !!d?.reel && d.bg?.image === REEL_PLACEHOLDER; }
function reelDocName(c) { return batchDocName(c).replace(' · ', ' · TODO · '); }
function slotReelCovers(recs) {
  const order = settings.gridOrder || [], loose = [];
  for (const r of recs) {
    if (order.includes(r.id)) continue;
    const twin = covers.find(c => c.doc?.batch && !c.doc.reel && c.doc.batch.n === r.doc.batch.n && order.includes(c.id));
    if (twin) order[order.indexOf(twin.id)] = r.id; else loose.push(r);
  }
  settings.gridOrder = batchGridIds(loose).concat(order);
}
async function seedReelSet() {
  const list = window.__REEL_TODO__ || []; if (!list.length) return false;
  setStatus('loading the reel to-do set…');
  await loadCoverFonts();
  await preloadAssets([REEL_PLACEHOLDER]);
  const text = new Map(COVER_TEXT.map(c => [c.n, c]));
  const have = new Set(covers.filter(c => c.doc?.reel).map(c => c.doc.batch.n));
  // newest in the library, so the studio opens on the latest reel still to do
  const now = Math.max(Date.now(), ...covers.map(c => c.updatedAt || 0)) + 1000;
  const recs = list.filter(r => text.has(r.n) && !have.has(r.n)).map((r, i) => {
    const c = text.get(r.n), d = buildBatchDoc(c, REEL_PLACEHOLDER, batchOpts);
    d.name = reelDocName(c); d.reel = { set: REEL_SET, code: r.code };
    d.createdAt = d.updatedAt = now + i; return coverRecord(d);
  });
  if (recs.length) { await store.saveCovers(recs); covers = covers.concat(recs); slotReelCovers(recs); }
  settings.reelSet = REEL_SET;
  await store.saveSettings(settings).catch(() => {});
  return recs.length > 0;
}

/* ---------------- views ---------------- */
function switchView(v) {
  $$('nav.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.view === v));
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  if (v === 'grid') { renderGrid(); renderMosaicPreview(); } if (v === 'cutout') renderCutoutView(); if (v === 'editor') renderAll(); if (v === 'batch') renderBatchView();
}
$$('nav.tabs button').forEach(b => b.onclick = () => switchView(b.dataset.view));
document.fonts.addEventListener('loadingdone', () => { renderAll(); renderCoverList(); renderTemplates(); if ($('#view-grid').classList.contains('active')) renderGrid(); });

/* A read-only handle on the live state, for the console and for tests. */
window.__rcs = { get settings() { return settings; }, get covers() { return covers; }, get doc() { return doc; }, get spanOpts() { return spanOpts; }, get mosaicOpts() { return mosaicOpts; }, assetsOf, setSpanAt, switchView };

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
  refreshAssetSelects(); renderTemplates(); bindBatch(); bindMosaic(); bindSpan(); bindBlocks();
  batchOpts.pool = assetsOf('photo').filter(p => p.still).map(p => p.id);
  let seeded = false;
  if (settings.demoSet !== DEMO_SET) { try { seeded = await seedDemoSet(); } catch (e) { console.warn('demo set', e); } }
  if (settings.staticSet !== STATIC_SET) { try { await seedStaticSet(); } catch (e) { console.warn('static set', e); } }
  if (settings.mosaicSet !== MOSAIC_SET) { try { await seedMosaicSet(); } catch (e) { console.warn('mosaic set', e); } }
  const todo = location.hash === '#todo';
  if (todo && settings.reelSet !== REEL_SET) { try { await seedReelSet(); } catch (e) { console.warn('reel set', e); } }
  if (settings.demoView !== DEMO_VIEW) { settings.shape = '34'; settings.demoView = DEMO_VIEW; store.saveSettings(settings).catch(() => {}); }
  if (covers.length) loadDoc([...covers].sort((a, b) => b.updatedAt - a.updatedAt)[0].doc);
  else { // seed a first set from the templates so the studio opens with something to look at
    for (const t of TEMPLATES.slice(0, 3)) { const d = t.make(); d.id = uid(); covers.push({ id: d.id, name: d.name, createdAt: d.createdAt, updatedAt: d.updatedAt - 1000, doc: d, versions: [] }); }
    for (const r of covers) { try { await store.saveCover(r); } catch {} }
    settings.gridOrder = covers.map(c => c.id); store.saveSettings(settings).catch(() => {});
    loadDoc(covers[0].doc);
  }
  setStatus('saved in this browser', 'ok');
  getImg('photo'); getImg('cutout');
  // a first visit, or a link ending #grid, opens straight on the profile
  if (seeded || todo || location.hash === '#grid') switchView('grid');
  if (todo) { // the statics sit above the queue, so bring the first cover still to do into view
    const next = (settings.gridOrder || []).find(id => onPlaceholder(covers.find(c => c.id === id)?.doc));
    $$('#igrid .tile').find(t => t.dataset.id === next)?.scrollIntoView({ block: 'center' });
  }
})();
})();
