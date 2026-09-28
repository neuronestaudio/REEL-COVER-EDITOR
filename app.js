/* Reel Cover Studio — single-page editor, grid preview, cutout & backgrounds */
(() => {
'use strict';
/* The size of the document being drawn. A reel cover is 1080×1920; a carousel
   post is 1080×1350. A document with no w/h is a cover, so nothing had to be
   migrated. Anything that draws or measures runs inside withSize, which sets
   these for the document in hand and puts back what was there, so between
   renders they always describe the document on the stage — which is what the
   pointer and zoom maths read. */
let W = 1080, H = 1920;
const COVER = { w: 1080, h: 1920 }, POST = { w: 1080, h: 1350 };
const sizeOf = d => ({ w: (d && d.w) || 1080, h: (d && d.h) || 1920 });
const isPost = d => !!(d && d.post);
const isAd = d => !!(d && d.ad);
const isFeed = d => isPost(d) || isAd(d);   // a feed post or a static ad: never a reel cover
function withSize(d, fn) {
  const pw = W, ph = H, s = sizeOf(d); W = s.w; H = s.h;
  try { return fn(); } finally { W = pw; H = ph; }
}
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
/* People photos (people.js): Harrison with students, clients, his father, the dojo — graded
   stills, built in so every browser has them. `thumb` is what the library grid loads; the
   full plate is only fetched when a cover uses it. `group` names their library group. */
for (const p of window.__PEOPLE_PHOTOS__ || []) BUILTIN[p.id] = { id: p.id, kind: 'photo', name: p.name, url: p.url, thumb: p.thumb, group: p.group, builtin: true };
for (const p of [].concat(window.__DAY1_STILLS__ || [], (window.__RTS_ADS__ || {}).plates || [])) BUILTIN[p.id] = { id: p.id, kind: 'photo', name: p.name, url: p.url, thumb: p.thumb, group: p.group, builtin: true };
for (const p of (window.__RTS_FINAL__ || {}).boards || []) BUILTIN[p.id] = { id: p.id, kind: 'photo', name: p.name, url: p.url, thumb: p.thumb, group: 'Final submission', builtin: true };
const BUILTIN_NAMES = new Set(Object.values(BUILTIN).map(a => a.name));
/* A photo someone imported by folder before it was built in: still loaded, because a cover may
   point at it, but kept out of the library so the picture is not listed twice. */
const shadowed = a => !a.builtin && !a.shared && (BUILTIN_NAMES.has(a.name) || (sharedLocal.has(a.id) && Object.values(SHARED).some(s => s.name === a.name)));
/* Shared photos (api/photos.js) sit in `assets` beside the built-ins under ids of the
   form sh_<id>, the same in every browser, so a cover that uses one travels. SHARED
   starts from the last listing this browser saw; `sharedLocal` remembers which of this
   browser's own uploads were sent up, so the library does not list that picture twice. */
const sharedAsset = p => ({ id: 'sh_' + p.id, kind: 'photo', name: p.name, url: p.url, thumb: p.thumb || p.url, group: 'Shared', shared: true, sid: p.id, at: p.at });
const SHARED = {};
let sharedLocal = new Set();
try {
  for (const p of JSON.parse(localStorage.getItem('rcs.sharedCache') || '[]')) { const s = sharedAsset(p); SHARED[s.id] = s; }
  sharedLocal = new Set(JSON.parse(localStorage.getItem('rcs.sharedLocal') || '[]'));
} catch {}
function sharedLocalAdd(id) { sharedLocal.add(id); try { localStorage.setItem('rcs.sharedLocal', JSON.stringify([...sharedLocal])); } catch {} }
/* The clean plates behind the FINAL ADS SUBMISSION boards (final.js): each take's
   own picture with the printed type erased, so the board can carry live text. */
for (const b of (window.__RTS_FINAL__ || {}).boards || []) {
  if (b.plate) BUILTIN['plate' + b.id] = { id: 'plate' + b.id, kind: 'photo', name: `Plate · ${b.name}`, url: b.plate, thumb: b.thumb, group: 'Plates', builtin: true };
}
let assets = { ...BUILTIN, ...SHARED };
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
/* A gradient fill: two or three evenly spaced stops swept across a box at an
   angle (0 runs left to right, 90 top to bottom). The box is the glyphs the
   gradient paints: a layer's whole text or just a span's words, so an accent word
   carries the full sweep however long the caption is. `scope` decides whether a
   wrapped run gets one sweep per line (the default, which reads as foil) or a
   single sweep across all of its lines ('block'). */
function gradStops(g) { const st = Array.isArray(g && g.stops) ? g.stops.filter(c => /^#[0-9a-f]{6}$/i.test(c)) : []; return st.length >= 2 ? st.slice(0, 3) : null; }
function gradFill(x, b, g) {
  const st = gradStops(g), ang = (g.angle == null ? 90 : +g.angle) * Math.PI / 180, dx = Math.cos(ang), dy = Math.sin(ang);
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, half = Math.max((Math.abs(dx) * b.w + Math.abs(dy) * b.h) / 2, 1);
  const gr = x.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  st.forEach((c, i) => gr.addColorStop(i / (st.length - 1), c));
  return gr;
}
/* What paints the character at source index i: a colour string, or the span
   object itself when that span carries a gradient (its identity is the run key). */
function spanColorAt(spans, i, base) {
  for (const s of spans) if (i >= s.s && i < s.e) return s.grad && gradStops(s.grad) ? s : s.color;
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
  let x = (W - w) / 2 + b.x * Math.max((w - W) / 2, W * .25), y = (H - h) / 2 + b.y * Math.max((h - H) / 2, H * .25);
  // A filling picture never leaves the frame on an axis it covers: the pan range has a W/4 (H/4) floor so a
  // picture with no overhang can still be nudged, which let a stray drag on the canvas push the photo off the
  // edge and export a band of pad (Dion, 25 Sep 2026: "all my exports seem slightly cropped").
  if (b.fit !== 'fit') { if (w >= W) x = clamp(x, W - w, 0); if (h >= H) y = clamp(y, H - h, 0); }
  return { x, y, w, h };
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
    if (o.type === 'scrim') { // the static ads' floor scrim: solid ink at the foot, gone by 64% up
      const g = x.createLinearGradient(0, H, 0, H * .36); g.addColorStop(0, hexA(o.color, o.opacity)); g.addColorStop(.375, hexA(o.color, o.opacity * .926)); g.addColorStop(.656, hexA(o.color, o.opacity * .63)); g.addColorStop(1, hexA(o.color, 0)); x.fillStyle = g; x.fillRect(0, 0, W, H); }
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
  /* Preview only: the range selected in the text box, outlined on the poster with
     a faint wash, so the words being worked on are marked without tinting the
     colour or gradient just given to them. A wrap-inserted space (i < 0) counts only between two selected
     characters. Exports never receive `hi`, so they are untouched. */
  if (hi && hi.e > hi.s) {
    x.save(); x.fillStyle = 'rgba(72,140,255,.14)'; x.strokeStyle = 'rgba(110,170,255,.95)'; x.lineWidth = Math.max(3, l.size * 0.035);
    lines.forEach((ln, i) => {
      const lw = widths[i]; const lx = l.align === 'left' ? left : l.align === 'right' ? left + bw - lw : left + (bw - lw) / 2;
      const ty = top + i * lh + lh * 0.5 + l.size * 0.34;
      const inSel = e => e.i >= hi.s && e.i < hi.e;
      const on = ln.idx.map((e, k) => e.i < 0 ? (k > 0 && k + 1 < ln.idx.length && inSel(ln.idx[k - 1]) && inSel(ln.idx[k + 1])) : inSel(e));
      for (let a = 0; a < on.length;) {
        if (!on[a]) { a++; continue; }
        let b = a; while (b < on.length && on[b]) b++;
        const ox = lx + (a ? x.measureText(ln.text.slice(0, a)).width : 0), w = x.measureText(ln.text.slice(a, b)).width;
        roundRect(x, ox - l.size * 0.04, ty - l.size * 0.76, w + l.size * 0.08, l.size * 0.98, l.size * 0.06); x.fill(); x.stroke();
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
  /* Two passes: lay the runs out first, so a gradient span knows the full extent
     of its words (even across a wrap) before anything is painted. */
  const basePaint = l.grad && l.grad.on && gradStops(l.grad) ? l.grad : l.color;
  const laid = [], gbox = new Map(), gradOf = p => p === l.grad ? l.grad : p.grad;
  lines.forEach((ln, i) => {
    const lw = widths[i];
    const lx = l.align === 'left' ? left : l.align === 'right' ? left + bw - lw : left + (bw - lw) / 2;
    const ty = top + i * lh + baseOff;
    for (const r of colorRuns(ln, spans, basePaint)) {
      const seg = ln.text.slice(r.a, r.b); if (!seg) continue;
      const ox = lx + (r.a ? x.measureText(ln.text.slice(0, r.a)).width : 0);
      let key = 0;
      if (typeof r.color === 'object') { // grow this gradient's box over the glyphs it paints: one per line, or one for the lot
        key = gradOf(r.color).scope === 'block' ? -1 : i;
        let m = gbox.get(r.color); if (!m) gbox.set(r.color, m = new Map());
        const w = x.measureText(seg).width, b = m.get(key) || { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
        b.x0 = Math.min(b.x0, ox); b.x1 = Math.max(b.x1, ox + w); b.y0 = Math.min(b.y0, ty - l.size * 0.76); b.y1 = Math.max(b.y1, ty + l.size * 0.22);
        m.set(key, b);
      }
      laid.push({ seg, ox, ty, paint: r.color, key });
    }
  });
  const fillOf = r => {
    if (typeof r.paint === 'string') return r.paint;
    const b = gbox.get(r.paint).get(r.key);
    if (!b.fill) b.fill = gradFill(x, { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 }, gradOf(r.paint));
    return b.fill;
  };
  for (const r of laid) {
    if (l.outline > 0) { x.save(); x.lineJoin = 'round'; x.lineWidth = l.outline * 2; x.strokeStyle = l.boxColor; x.strokeText(r.seg, r.ox, r.ty); x.restore(); }
    if (l.shadow > 0) { x.shadowColor = `rgba(0,0,0,${l.shadow})`; x.shadowBlur = l.size * .25; x.shadowOffsetY = l.size * .05; }
    x.fillStyle = fillOf(r); x.fillText(r.seg, r.ox, r.ty); x.shadowColor = 'transparent';
  }
  x.restore();
  return box;
}
function drawRule(x, l) {
  const w = l.width * W, X = l.x * W - w / 2, Y = l.y * H;
  x.save(); x.fillStyle = hexA(l.color, l.alpha);
  if (l.r > 0) { roundRect(x, X, Y - l.thick / 2, w, l.thick, l.r); x.fill(); }
  else x.fillRect(X, Y - l.thick / 2, w, l.thick);
  x.restore();
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
function render(ctx, d, scale, boxes, ui) { return withSize(d, () => drawDoc(ctx, d, scale, boxes, ui)); }
function drawDoc(ctx, doc, scale, boxes, ui) {
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
  withSize(doc, () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2); const s = cssW / W;
    const pw = Math.round(cssW * dpr), ph = Math.round(cssW * H / W * dpr);
    if (canvas.width !== pw) { canvas.width = pw; canvas.height = ph; }
    render(canvas.getContext('2d'), doc, s * dpr, null);
  });
}
function requestFonts(doc) { doc.layers.forEach(l => { if (l.type === 'text') ensureFont(l.font, l.weight, l.italic); }); }

/* ---------------- document model ---------------- */
const SWATCH = ['#ffffff', '#16150f', '#f1ecdf', '#d9a441', '#e9d9b5', '#7fb3a6', '#0f3b3a', '#2b2b6d', '#b8412e', '#f2c6b6', '#5b6b3a', '#8c8377'];
const GRADS = [['#0f3b3a', '#16150f'], ['#2b2b6d', '#0b0a1a'], ['#d9a441', '#7a4a12'], ['#e9d9b5', '#c9a27a'], ['#1d1d1d', '#4a4a4a'], ['#7fb3a6', '#16150f'], ['#f2c6b6', '#b8412e'], ['#ffffff', '#d7d2c4']];
function newText(o = {}) {
  return Object.assign({ id: uid(), type: 'text', text: 'Caption', font: 'Fraunces', weight: 600, italic: false, upper: false, size: 110, line: 1.02, track: -0.02, width: 0.86, align: 'left', color: '#ffffff', spans: [], x: 0.07, y: 0.62, box: 'none', boxColor: '#16150f', boxAlpha: 0.65, shadow: 0.35, outline: 0, rot: 0, behind: false }, o);
}
function newRule(o = {}) { return Object.assign({ id: uid(), type: 'rule', x: 0.5, y: 0.6, width: 0.86, thick: 4, color: '#ffffff', alpha: .8, r: 0 }, o); }
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
    assets = { ...BUILTIN, ...SHARED };
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
    if (assets[id]?.builtin || assets[id]?.shared) return;
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
  if ($('#view-posts').classList.contains('active')) renderPosts();
  if ($('#view-ads').classList.contains('active')) renderAds();
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
  const sz = sizeOf(doc); W = sz.w; H = sz.h;   // the stage, and everything that hit-tests it, follows the open document
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
    // the stored value stops where the picture stops (bgBox clamps the drawing), so dragging back responds at once
    const lim = (n, N) => doc.bg.fit === 'fit' || n < N ? 1 : (n - N) / 2 / Math.max((n - N) / 2, N * .25);
    const lx = lim(bb.w, W), ly = lim(bb.h, H);
    t.x = clamp(drag.x0 + (p.x - drag.p.x) / Math.max((bb.w - W) / 2, W * .25), -lx, lx);
    t.y = clamp(drag.y0 + (p.y - drag.p.y) / Math.max((bb.h - H) / 2, H * .25), -ly, ly);
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
/* Copy and paste an element: Ctrl+C on the selected layer, Ctrl+V on this cover or any
   other one (the clip outlives loadDoc, and localStorage carries it to another tab).
   A paste into a cover that already has something at that spot steps down a little so
   the copy is visible; into a clean cover it lands exactly where it came from.
   Clicking the artwork also takes the caret out of the text box — before this, a click
   on an element left focus in the box, so Ctrl+C copied the caption's text instead. */
let layerClip = null;
function copyLayer() {
  const l = doc.layers.find(x => x.id === sel); if (!l) return false;
  layerClip = JSON.parse(JSON.stringify(l));
  try { localStorage.setItem('rcs.clip', JSON.stringify(layerClip)); } catch {}
  toast(`Copied ${l.type === 'text' ? '“' + (l.text.split('\n')[0] || 'text').slice(0, 28) + '”' : l.type} — Ctrl+V pastes it on any cover`);
  return true;
}
function pasteLayer() {
  let c = layerClip;
  if (!c) { try { c = JSON.parse(localStorage.getItem('rcs.clip') || 'null'); } catch {} }
  if (!c || !c.type) return false;
  const l = { ...JSON.parse(JSON.stringify(c)), id: uid() };
  while (doc.layers.some(o => o.type === l.type && Math.abs(o.x - l.x) < 0.004 && Math.abs(o.y - l.y) < 0.004)) { l.y = Math.min(l.y + 0.03, 0.97); if (l.y >= 0.97) break; }
  if (l.image && !assets[l.image]) { toast('That logo’s image is not in this browser’s library'); return true; }
  addLayer(l); syncAll();
  return true;
}
preview.addEventListener('pointerdown', () => { const a = document.activeElement; if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) a.blur(); }, true);
window.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName; const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (typing) return; if (!$('#view-editor').classList.contains('active')) return;
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 'c' && copyLayer()) { e.preventDefault(); return; }
    if (k === 'x' && copyLayer()) { e.preventDefault(); deleteLayer(sel); return; }
    if (k === 'v' && pasteLayer()) { e.preventDefault(); return; }
    if (k === 'c' || k === 'x' || k === 'v') return; // nothing of ours to act on: leave the browser's own copy and paste alone
  }
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
/* The photo library. Shut, it is one row naming the photo in use, so a library of a
   hundred photos costs the inspector nothing; open, it is grouped, searchable and
   scrolls inside its own window. Nothing is decoded while it is shut. Groups come from
   what a photo is (shoot still, static plate) or, for an imported set named
   "P01 - testimony - …", from the word in the middle. */
const LIB = { open: false, group: 'All', q: '' };
try { LIB.open = localStorage.getItem('rcs.libOpen') === '1'; LIB.group = localStorage.getItem('rcs.libGroup') || 'All'; } catch {}
function libRemember() { try { localStorage.setItem('rcs.libOpen', LIB.open ? '1' : '0'); localStorage.setItem('rcs.libGroup', LIB.group); } catch {} }
function photoGroup(a) {
  if (a.group) return a.group;
  if (a.still) return 'Shoot';
  if (a.rts) return 'Statics';
  if (a.builtin) return 'Studio';
  const m = /^[A-Za-z]{1,3}\d+ - ([A-Za-z]+) - /.exec(a.name || '');
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : 'Uploads';
}
function renderBgPick() {
  const c = $('#bgPick'); if (!c) return; c.innerHTML = '';
  const all = [...assetsOf('photo'), ...assetsOf('bg')].filter(a => !shadowed(a));
  const cur = doc.bg.type === 'image' ? assets[doc.bg.image] : null;
  const th = $('#bgLibThumb'); th.innerHTML = ''; if (cur) { const i = new Image(); i.src = cur.thumb || cur.url; i.alt = ''; th.appendChild(i); }
  $('#bgLibName').textContent = cur ? cur.name : 'No photo chosen';
  $('#bgLibCount').textContent = `${all.length} photos · ${LIB.open ? 'close' : 'open'} the library`;
  $('#bgLib').dataset.open = LIB.open; $('#bgLibBar').setAttribute('aria-expanded', LIB.open); $('#bgLibBody').hidden = !LIB.open;
  if (!LIB.open) return;

  const nShared = Object.keys(SHARED).length;
  $('#bgLibSharedMsg').innerHTML = share.ok === false ? 'Shared photos are offline here.'
    : `<b>Shared</b> · ${nShared} photo${nShared === 1 ? '' : 's'} for everyone`;
  $('#bgLibShare').disabled = share.ok === false || share.busy;
  const counts = new Map(); all.forEach(a => { const g = photoGroup(a); counts.set(g, (counts.get(g) || 0) + 1); });
  const fixed = ['Uploads', 'Shoot', 'Statics', 'Studio'];
  const groups = ['All', ...(counts.has('Shared') ? ['Shared'] : []), ...[...counts.keys()].filter(g => g !== 'Shared' && !fixed.includes(g)).sort(), ...fixed.filter(g => counts.has(g))];
  if (!groups.includes(LIB.group)) LIB.group = 'All';
  const gc = $('#bgLibGroups'); gc.innerHTML = '';
  groups.forEach(g => {
    const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.setAttribute('aria-pressed', g === LIB.group);
    b.innerHTML = `${escapeHtml(g)}<i>${g === 'All' ? all.length : counts.get(g)}</i>`;
    b.onclick = () => { LIB.group = g; libRemember(); renderBgPick(); };
    gc.appendChild(b);
  });

  const q = LIB.q.trim().toLowerCase();
  const list = all.filter(a => (LIB.group === 'All' || photoGroup(a) === LIB.group) && (!q || (a.name || '').toLowerCase().includes(q)));
  const add = document.createElement('button'); add.className = 'addtile'; add.title = 'Upload an image from your computer';
  add.innerHTML = '+<small>UPLOAD</small>'; add.onclick = () => bgUploadFlow(); c.appendChild(add);
  if (!list.length) { const n = document.createElement('div'); n.className = 'none'; n.textContent = q ? `Nothing in the library matches “${LIB.q.trim()}”.` : 'No photos in this group yet.'; c.appendChild(n); }
  list.forEach(a => {
    const b = document.createElement('button'); b.title = a.name; b.setAttribute('aria-pressed', doc.bg.type === 'image' && doc.bg.image === a.id);
    const im = new Image(); im.loading = 'lazy'; im.decoding = 'async'; im.src = a.thumb || a.url; im.alt = a.name; b.appendChild(im);
    if (a.shared) sharedTile(b, a);
    else if (!a.builtin) { localShareBtn(b, a); const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.title = 'Remove'; x.onclick = async e => { e.stopPropagation(); if (!confirm(`Remove “${a.name}”?`)) return; await store.deleteAsset(a.id); if (doc.bg.image === a.id) { doc.bg.image = assetsOf('photo')[0]?.id || 'photo'; commit(); } renderBgPick(); refreshAssetSelects(); }; b.appendChild(x); }
    b.onclick = () => { pushUndo(); doc.bg.type = 'image'; doc.bg.image = a.id; commit(); syncAll(); };
    c.appendChild(b);
  });
}
function bgUploadFlow() { pickFile(f => setBackgroundFromFile(f)); }
$('#bgLibBar').onclick = () => { LIB.open = !LIB.open; libRemember(); renderBgPick(); if (LIB.open) $('#bgPick').querySelector('[aria-pressed=true]')?.scrollIntoView({ block: 'nearest' }); };
$('#bgLibQ').addEventListener('input', e => { LIB.q = e.target.value; renderBgPick(); });
/* A whole folder into the library in one go. Photos already there (same name) are left
   alone, so the same folder can be added again after more land in it. These stay in
   this browser's storage; "Upload for everyone" is what sends a photo to the server. */
$('#bgLibFolder').onclick = () => $('#folderInput').click();
$('#folderInput').addEventListener('change', async e => {
  const files = [...e.target.files].filter(f => f.type.startsWith('image/')).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  e.target.value = '';
  if (!files.length) return toast('No images in that folder');
  const have = new Set(Object.values(assets).map(a => a.name));
  let added = 0;
  for (let i = 0; i < files.length; i++) {
    const name = files[i].name.replace(/\.[^.]+$/, '').slice(0, 64);
    setStatus(`adding photos… ${i + 1} of ${files.length}`);
    if (have.has(name)) continue;
    try { await store.putAsset(files[i], 'photo', name); added++; } catch (err) { console.warn(err); toast('Browser storage is full — some photos were not added'); break; }
  }
  setStatus('saved · this browser', 'ok');
  LIB.open = true; LIB.group = 'All'; libRemember();
  refreshAssetSelects(); renderBgPick(); renderPool();
  toast(added ? `${added} photo${added > 1 ? 's' : ''} added to the library${added < files.length ? ` · ${files.length - added} already there` : ''}` : 'Every photo in that folder is already in the library');
});
/* ---------------- shared library ----------------
   Photos every browser gets. api/photos.js keeps them in the project's Blob store; this
   side lists them into `assets` beside the built-ins and sends new ones up after shrinking
   them (a cover is 1080 wide, so nothing over 2400 px is ever needed, and the platform
   caps a request at 4.5 MB). The last listing is cached, so a cover that uses a shared
   photo still paints before the network answers. Covers themselves stay in the browser
   that made them; only photos are shared. */
const share = { ok: null, busy: false, max: 300 };
const SHARE_API = 'api/photos';
function sharedCacheSave() { try { localStorage.setItem('rcs.sharedCache', JSON.stringify(Object.values(SHARED).map(a => ({ id: a.sid, name: a.name, url: a.url, thumb: a.thumb, at: a.at })))); } catch {} }
function sharedBust() { try { localStorage.setItem('rcs.sharedBust', String(Date.now())); } catch {} }
function sharedRefreshUI() { if (!doc) return; refreshAssetSelects(); renderBgPick(); renderPool(); renderAll(); }
async function loadShared(force) {
  /* Listing the store is a metered call, so a browser reuses the listing it has for ten
     minutes. Someone who has just uploaded or removed a photo asks past the edge cache
     (the query is the same until their next change, so even that is cached after one
     call), and the refresh button always asks afresh. */
  let q = '', at = 0;
  try {
    at = +localStorage.getItem('rcs.sharedAt') || 0;
    const t = +localStorage.getItem('rcs.sharedBust');
    if (force) q = '?t=' + Date.now(); else if (t && Date.now() - t < 15 * 60e3) q = '?t=' + t;
  } catch {}
  if (!force && !q && Date.now() - at < 10 * 60e3) { share.ok = true; return sharedRefreshUI(); }
  try {
    const r = await fetch(SHARE_API + q, { headers: { accept: 'application/json' } });
    if (!r.ok || !/json/.test(r.headers.get('content-type') || '')) throw new Error('no shared library here');
    const data = await r.json(); share.ok = true; share.max = data.max || share.max;
    for (const k of Object.keys(SHARED)) { delete assets[k]; delete SHARED[k]; }
    for (const p of data.photos || []) { const a = sharedAsset(p); SHARED[a.id] = a; assets[a.id] = a; }
    sharedCacheSave(); try { localStorage.setItem('rcs.sharedAt', String(Date.now())); } catch {}
  } catch (e) { share.ok = false; }
  sharedRefreshUI();
}
function shareKey() {
  let k = null; try { k = localStorage.getItem('rcs.shareKey'); } catch {}
  if (k) return k;
  k = (prompt('Team upload key\n\nPhotos you upload here go to the shared library, where everyone who opens the studio gets them. Ask Dion for the key. It is remembered on this device.') || '').trim();
  if (!k) return null;
  try { localStorage.setItem('rcs.shareKey', k); } catch {}
  return k;
}
function forgetShareKey() { try { localStorage.removeItem('rcs.shareKey'); } catch {} }
const b64url = s => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function shrinkToJpeg(src, edge, q) {
  const bmp = await createImageBitmap(src);   // honours the photo's EXIF rotation
  const s = Math.min(1, edge / Math.max(bmp.width, bmp.height)), w = Math.max(1, Math.round(bmp.width * s)), h = Math.max(1, Math.round(bmp.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('That image could not be read')), 'image/jpeg', q));
}
async function shareOne(src, name, key) {
  let full = await shrinkToJpeg(src, 2400, 0.9);
  if (full.size > 4e6) full = await shrinkToJpeg(src, 2400, 0.8);
  if (full.size > 4e6) full = await shrinkToJpeg(src, 1920, 0.8);
  const thumb = await shrinkToJpeg(full, 480, 0.8);
  const id = Array.from(crypto.getRandomValues(new Uint8Array(10)), v => 'abcdefghijklmnopqrstuvwxyz0123456789'[v % 36]).join('');
  const meta = b64url(JSON.stringify({ n: name }));
  const send = async (kind, blob) => {
    const r = await fetch(`${SHARE_API}?id=${id}&kind=${kind}&meta=${meta}`, { method: 'POST', headers: { 'content-type': 'image/jpeg', 'x-studio-key': key }, body: blob });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.error || 'The upload did not go through'); e.status = r.status; throw e; }
    return j;
  };
  const t = await send('thumb', thumb), f = await send('full', full);   // the full image is what lists it, so it goes last
  return sharedAsset({ id, name, url: f.url, thumb: t.url, at: Date.now() });
}
/* items: [{ src: Blob, name, localId? }]. A name already in the shared library is left
   alone, so the same batch can be sent twice without doubling up. */
async function shareFiles(items) {
  if (share.busy || !items.length) return;
  if (share.ok === false) return toast('The shared library is not available here');
  const key = shareKey(); if (!key) return;
  share.busy = true; let done = 0, skipped = 0, fail = '';
  const names = new Set(Object.values(SHARED).map(a => a.name));
  for (let i = 0; i < items.length; i++) {
    const it = items[i]; setStatus(`uploading for everyone… ${i + 1} of ${items.length}`);
    if (names.has(it.name)) { skipped++; if (it.localId) sharedLocalAdd(it.localId); continue; }
    try {
      const a = await shareOne(it.src, it.name, key);
      SHARED[a.id] = a; assets[a.id] = a; names.add(a.name); done++;
      if (it.localId) sharedLocalAdd(it.localId);
    } catch (e) {
      fail = e.message || 'The upload did not go through';
      if (e.status === 401) { forgetShareKey(); fail = 'That upload key was not accepted. Try again with the right key.'; }
      if (e.status === 401 || e.status === 409) break;
    }
  }
  share.busy = false; setStatus('saved · this browser', 'ok');
  if (done) { sharedCacheSave(); sharedBust(); LIB.open = true; LIB.group = 'Shared'; libRemember(); }
  sharedRefreshUI();
  toast(fail ? (done ? `${done} uploaded, then: ${fail}` : fail)
    : done ? `${done} photo${done > 1 ? 's' : ''} now in the shared library, for everyone${skipped ? ` · ${skipped} already there` : ''}`
      : 'Those photos are already in the shared library');
}
async function sharedDelete(a) {
  if (!confirm(`Remove “${a.name}” from the shared library?\n\nIt disappears for everyone, and any cover using it loses its photo.`)) return;
  const key = shareKey(); if (!key) return;
  let r; try { r = await fetch(`${SHARE_API}?id=${a.sid}`, { method: 'DELETE', headers: { 'x-studio-key': key } }); } catch { return toast('Could not reach the shared library'); }
  if (r.status === 401) { forgetShareKey(); return toast('That upload key was not accepted. Try again with the right key.'); }
  if (!r.ok) return toast('That photo could not be removed');
  delete SHARED[a.id]; delete assets[a.id]; sharedCacheSave(); sharedBust();
  if (doc.bg.image === a.id) { doc.bg.image = assetsOf('photo')[0]?.id || 'photo'; commit(); }
  sharedRefreshUI(); toast('Removed from the shared library');
}
function sharedTile(b, a) {
  const c = document.createElement('span'); c.className = 'cloud'; c.textContent = 'SHARED'; b.appendChild(c);
  const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.title = 'Remove from the shared library, for everyone';
  x.onclick = e => { e.stopPropagation(); sharedDelete(a); }; b.appendChild(x);
}
function localShareBtn(b, a) {
  if (share.ok === false) return;
  const u = document.createElement('button'); u.className = 'up'; u.textContent = '⇪'; u.title = 'Upload to the shared library, so everyone gets this photo';
  u.onclick = async e => { e.stopPropagation(); try { const src = await fetch(a.url).then(r => r.blob()); shareFiles([{ src, name: a.name, localId: a.id }]); } catch { toast('That photo could not be read'); } };
  b.appendChild(u);
}
$('#bgLibShare').onclick = () => $('#shareInput').click();
$('#bgLibShareRefresh').onclick = async () => { await loadShared(true); toast(share.ok ? 'Shared photos are up to date' : 'The shared library could not be reached'); };
$('#shareInput').addEventListener('change', e => {
  const files = [...e.target.files].filter(f => f.type.startsWith('image/')).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  e.target.value = '';
  if (!files.length) return toast('No images chosen');
  shareFiles(files.map(f => ({ src: f, name: f.name.replace(/\.[^.]+$/, '').slice(0, 64) })));
});
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
bound.push(bindColor('tColor', () => T()?.color, v => { const l = T(); if (l) { l.color = v; if (l.grad && l.grad.on) { l.grad.on = false; syncGradUI(); } } }));
$('#tSwatches').innerHTML = SWATCH.slice(0, 8).map(c => `<button class="sw" style="background:${c};width:16px;height:16px" data-c="${c}"></button>`).join('');
$('#tSwatches').onclick = e => { const c = e.target.dataset.c, l = T(); if (c && l) { pushUndo(); l.color = c; if (l.grad) l.grad.on = false; commit(); syncAll(); } };
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
  syncGradUI();
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
/* Gradient fill. One set of controls serves two targets, the way the eye reads
   it: words selected in the box take the gradient as a span (so it follows them
   through edits and wraps, like part colour); with nothing selected it fills the
   whole layer. Picking a flat Colour switches the layer gradient back off. */
const GRAD_PRESETS = [
  { n: 'Gold foil', stops: ['#fbeeb8', '#d9a441', '#8c5a1a'], angle: 90 },
  { n: 'Champagne', stops: ['#ffffff', '#e9d9b5'], angle: 90 },
  { n: 'Ember', stops: ['#f6c56a', '#b8412e'], angle: 90 },
  { n: 'Flame', stops: ['#fff1b8', '#f08a24', '#b8412e'], angle: 90 },
  { n: 'Rose gold', stops: ['#f9d9c8', '#c98a6b'], angle: 90 },
  { n: 'Sunrise', stops: ['#f2c6b6', '#d9a441'], angle: 0 },
  { n: 'Sage', stops: ['#d7efe6', '#7fb3a6'], angle: 90 },
  { n: 'Deep teal', stops: ['#7fb3a6', '#0f3b3a'], angle: 90 },
  { n: 'Moss', stops: ['#c9d6a3', '#5b6b3a'], angle: 90 },
  { n: 'Dusk', stops: ['#f2c6b6', '#2b2b6d'], angle: 45 },
  { n: 'Chrome', stops: ['#ffffff', '#aeb4bb', '#f4f4f4'], angle: 90 },
  { n: 'Ink fade', stops: ['#ffffff', '#8c8377'], angle: 90 },
];
const cleanGrad = g => ({ stops: gradStops(g).slice(), angle: g.angle == null ? 90 : +g.angle, scope: g.scope === 'block' ? 'block' : 'line' });
const sameGrad = (p, g) => p.angle === g.angle && p.stops.join() === g.stops.join();
const mixHex = (c1, c2) => '#' + [1, 3, 5].map(k => Math.round((parseInt(c1.slice(k, k + 2), 16) + parseInt(c2.slice(k, k + 2), 16)) / 2).toString(16).padStart(2, '0')).join('');
let gradDraft = cleanGrad(GRAD_PRESETS[0]), gradBefore = null;
function gradCurrent() {
  const l = T(); if (!l) return null;
  if (tSel) { const sp = normSpans(l).find(s => s.grad && gradStops(s.grad) && s.s < tSel.e && s.e > tSel.s); return sp ? sp.grad : null; }
  return l.grad && l.grad.on && gradStops(l.grad) ? l.grad : null;
}
function gradApply(g) {
  const l = T(); if (!l || !gradStops(g)) return;
  g = cleanGrad(g); gradDraft = cleanGrad(g);
  if (tSel) l.spans = clipSpans(normSpans(l), tSel.s, tSel.e).concat([{ s: tSel.s, e: tSel.e, color: g.stops[0], grad: g }]).sort((a, b) => a.s - b.s);
  else l.grad = { on: true, ...g };
  renderAll(); renderLayers(); syncSpanUI();
}
function gradRemove() {
  const l = T(); if (!l || !gradCurrent()) return;
  if (tSel) l.spans = clipSpans(normSpans(l), tSel.s, tSel.e); else l.grad.on = false;
  renderAll(); renderLayers(); syncSpanUI();
}
const gradFromUI = () => ({ stops: [$('#tGradA').value, ...($('#tGradM').hidden ? [] : [$('#tGradM').value]), $('#tGradB').value], angle: +$('#tGradAngle').value, scope: $('#tGradScope [aria-pressed=true]')?.dataset.scope || 'line' });
function syncGradUI() {
  const l = T(); if (!l) return;
  const cur = gradCurrent(), g = cur ? cleanGrad(cur) : gradDraft, on = !!cur, mid = g.stops.length === 3;
  $('#tGradOn').setAttribute('aria-pressed', on); $('#tGradOff').setAttribute('aria-pressed', !on);
  $('#tGradCtl').hidden = !on;
  $('#tGradFor').textContent = tSel ? 'selected words' : 'whole text';
  $('#tGradA').value = g.stops[0]; $('#tGradB').value = g.stops[g.stops.length - 1];
  $('#tGradM').hidden = !mid; if (mid) $('#tGradM').value = g.stops[1];
  $('#tGradMid').textContent = mid ? '\u2212 Mid' : '+ Mid';
  $('#tGradAngle').value = g.angle; $('#tGradAngleV').textContent = g.angle + '\u00b0';
  $('#tGradBar').style.background = `linear-gradient(90deg, ${g.stops.join(', ')})`;
  $$('#tGradPresets .gsw').forEach((b, i) => b.setAttribute('aria-pressed', on && sameGrad(GRAD_PRESETS[i], g)));
  $$('#tGradDirs .chip').forEach(b => b.setAttribute('aria-pressed', on && +b.dataset.ang === g.angle));
  $$('#tGradScope .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.scope === g.scope));
  const word = tSel ? `\u201c${(l.upper ? upperKeepLen(l.text) : l.text).slice(tSel.s, tSel.e)}\u201d` : '';
  $('#tGradHint').textContent = tSel
    ? (on ? `Gradient on ${word}. Click in the box to work on the whole text instead.` : `Pick a gradient to fill just ${word}.`)
    : (on ? 'Gradient fills the whole text. Select words in the box to give only those their own.' : 'Pick a gradient for the whole text, or select words in the box first to fill only those.');
}
$('#tGradPresets').innerHTML = GRAD_PRESETS.map((p, i) => `<button class="gsw" type="button" data-i="${i}" title="${p.n}" style="background:linear-gradient(${p.angle + 90}deg, ${p.stops.join(', ')})"></button>`).join('');
// Buttons keep the text box's focus and selection, the way the part-colour swatches do.
['#tGradPresets', '#tGradOn', '#tGradOff', '#tGradMid', '#tGradSwap', '#tGradDirs', '#tGradScope'].forEach(s => $(s).addEventListener('mousedown', e => e.preventDefault()));
const gradClick = fn => () => { if (!T()) return; pushUndo(); fn(); scheduleSave(); };
$('#tGradPresets').onclick = e => { const p = GRAD_PRESETS[e.target.dataset.i]; if (p) gradClick(() => gradApply({ ...p, scope: gradFromUI().scope }))(); };
$('#tGradScope').onclick = e => { const v = e.target.dataset.scope; if (v) gradClick(() => { const g = gradFromUI(); g.scope = v; gradApply(g); })(); };
$('#tGradOn').onclick = gradClick(() => { if (!gradCurrent()) gradApply(gradDraft); });
$('#tGradOff').onclick = gradClick(() => gradRemove());
$('#tGradSwap').onclick = gradClick(() => { const g = gradFromUI(); g.stops.reverse(); gradApply(g); });
$('#tGradMid').onclick = gradClick(() => { const g = gradFromUI(); g.stops = g.stops.length === 3 ? [g.stops[0], g.stops[2]] : [g.stops[0], mixHex(g.stops[0], g.stops[1]), g.stops[1]]; gradApply(g); });
$('#tGradDirs').onclick = e => { const v = e.target.dataset.ang; if (v != null) gradClick(() => { const g = gradFromUI(); g.angle = +v; gradApply(g); })(); };
// Pickers and the slider edit live; one undo step covers the whole drag.
['#tGradA', '#tGradM', '#tGradB', '#tGradAngle'].forEach(s => {
  $(s).addEventListener('input', () => { if (!T()) return; if (!gradBefore) gradBefore = snapshot(); gradApply(gradFromUI()); });
  $(s).addEventListener('change', () => { if (gradBefore) { undoStack.push(gradBefore); redoStack = []; updateUndoBtns(); gradBefore = null; scheduleSave(); } });
});
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
bound.push(bindRange('rRadius', () => R()?.r || 0, v => { const l = R(); if (l) l.r = v; }));
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
  syncFrame();
  $('#bgImageCtl').hidden = doc.bg.type !== 'image'; $('#bgSolidCtl').hidden = doc.bg.type !== 'solid'; $('#bgGradCtl').hidden = doc.bg.type !== 'gradient'; $('#bgTexCtl').hidden = doc.bg.type !== 'texture';
  $('#subjCtl').style.opacity = doc.subject.on ? 1 : .45;
  refreshAssetSelects(); renderBgPick(); $('#subjImage').value = doc.subject.image;
  renderLayers(); syncProps();
}
/* Guides and the export menu describe whichever frame is open. */
function syncFrame() {
  const post = isPost(doc) || (isAd(doc) && H === 1350);
  $('#guides').setAttribute('viewBox', `0 0 ${W} ${H}`);
  const guide = (el, show) => show ? el.removeAttribute('hidden') : el.setAttribute('hidden', '');
  guide($('#guidesPost'), post); guide($('#guidesCover'), !post && H === 1920);
  $('#frameLbl').textContent = `${W} × ${H}`;
  const o = $$('#exportScale option');
  o[0].textContent = `${W}×${H} PNG`; o[1].textContent = `${W * 2}×${H * 2} PNG`; o[2].textContent = `${W}×${H} JPG`;
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
function loadDoc(d) { clearTimeout(saveTimer); doc = JSON.parse(JSON.stringify(d)); const sz = sizeOf(doc); W = sz.w; H = sz.h; sel = null; undoStack = []; redoStack = []; updateUndoBtns(); syncAll(); renderAll(); renderCoverList(); renderVersions(); setStatus('saved · this browser', 'ok'); }
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
  const dpr = Math.min(window.devicePixelRatio || 1, 2), sz = sizeOf(d);
  c.width = Math.round(cssW * dpr); c.height = Math.round(cssW * sz.h / sz.w * dpr);
  c._doc = d; c._w = cssW;
  if (lazyIO) lazyIO.observe(c); else lazyDraw(c);
  return c;
}
/* The rail lists covers, or — while a carousel slide is open — that carousel's
   slides in posting order, so one can be edited after another without leaving
   the editor. Posts never appear in the cover list, or in the profile grid. */
function renderCoverList() {
  const c = $('#coverList'); c.innerHTML = '';
  const inPost = isPost(doc), inAd = isAd(doc);
  let list = inPost
    ? covers.filter(r => r.doc?.post?.cid === doc.post.cid).sort((a, b) => (a.doc.post.slide || 0) - (b.doc.post.slide || 0))
    : inAd ? ((adGroups().find(g => g.key === doc.ad.setKey) || {}).boards || [])
    : covers.filter(r => !isFeed(r.doc)).sort((a, b) => b.updatedAt - a.updatedAt);
  $('#coverListTitle').textContent = inPost ? `Slides · ${doc.post.title || 'carousel'}` : inAd ? `Static ads · ${((adGroups().find(g => g.key === doc.ad.setKey) || {}).title || doc.ad.setKey).replace(/ — .*$/, '')}` : 'Covers';
  if (inPost || inAd) {
    const back = document.createElement('button'); back.className = 'small ghost'; back.style.cssText = 'width:100%;margin-bottom:6px';
    back.textContent = '← Back to the covers';
    back.onclick = () => { const r = [...covers].filter(x => !isFeed(x.doc)).sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (r) loadDoc(r.doc); };
    c.appendChild(back);
  }
  if (!inPost && !inAd) c.appendChild(orgBar('covers', true));
  const of = orgFilter('covers');
  if (!inPost && !inAd && orgActive(of)) list = list.filter(r => orgMatch(r, of));
  if (!list.length) c.insertAdjacentHTML('beforeend', `<div class="empty">${orgActive(of) && !inPost && !inAd ? 'Nothing here matches the filter.' : 'No covers yet.'}</div>`);
  list.forEach(r => {
    const d = document.createElement('div'); d.className = 'cover-item'; d.setAttribute('aria-current', r.id === doc?.id); d.dataset.id = r.id; d.classList.toggle('picked', picked.has(r.id));
    const rs = sizeOf(r.doc);
    const th = lazyCanvas(r.id === doc?.id ? doc : r.doc, 38 * 2); th.style.width = '38px'; th.style.height = Math.round(38 * rs.h / rs.w) + 'px';
    d.appendChild(th);
    const info = document.createElement('div'); info.innerHTML = `<div class="nm">${escapeHtml(r.name)}</div><div class="meta">${fmtTime(r.updatedAt)} · ${(r.versions || []).length} ver</div>`; d.appendChild(info);
    const acts = document.createElement('div'); acts.innerHTML = `<input type="checkbox" class="pick" title="Tick for Export selected">`;
    const cb = $('input', acts); cb.checked = picked.has(r.id); cb.onclick = e => { e.stopPropagation(); togglePick(r.id, cb.checked); };
    d.appendChild(acts); orgDecor(d, r, inPost ? 'posts' : inAd ? 'ads' : 'covers'); d.onclick = () => { if (r.id !== doc.id) loadDoc(r.doc); }; c.appendChild(d);
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
  const sz = sizeOf(d), c = document.createElement('canvas'); c.width = sz.w * scale; c.height = sz.h * scale; render(c.getContext('2d'), d, scale, null);
  return new Promise(res => c.toBlob(res, type === 'jpg' ? 'image/jpeg' : 'image/png', 0.94));
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
$('#btnExport').onclick = async () => {
  const v = $('#exportScale').value; const scale = v === 'jpg' ? 1 : +v; const type = v === 'jpg' ? 'jpg' : 'png';
  setStatus('rendering…'); const blob = await renderBlob(doc, scale, type);
  const ok = await store.download(`${slug(doc.name)}-${W * scale}x${H * scale}.${type}`, blob); toast(ok ? 'Exported' : 'Export cancelled'); setStatus('saved', 'ok');
};
/* ---------------- Platform Poster bridge ----------------
   The posting tool (D:\TOOLS\platform-poster) listens on localhost:8130 on
   Dion's machine. Opened from it as #poster=<jobId>, Send attaches this cover
   to that post; opened by hand, Send lands on whichever post is open there. */
const POSTER = 'http://localhost:8130';
const posterJob = () => (location.hash.match(/poster=([a-z0-9-]+)/i) || [])[1] || '';
function coverText(d) { return (d.layers || []).filter(l => (l.kind || l.type) === 'text' && l.text).map(l => String(l.text).replace(/\s+/g, ' ').trim()).filter(Boolean).join(' · '); }
$('#btnSendPoster').onclick = async () => {
  setStatus('rendering…');
  try {
    const blob = await renderBlob(doc, 1, 'png');
    const q = new URLSearchParams({ kind: 'cover', name: `${slug(doc.name)}-1080x1920.png`, job: posterJob(), text: coverText(doc), source: 'studio', doc: doc.id });
    const r = await fetch(`${POSTER}/api/upload?${q}`, { method: 'POST', body: blob, mode: 'cors' });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
    setStatus('saved', 'ok'); toast('Sent to Platform Poster');
    // Opened from the poster: hand focus straight back and close this tab.
    if (window.opener) { try { window.opener.focus(); } catch {} setTimeout(() => window.close(), 700); }
  } catch (e) {
    setStatus('saved', 'ok');
    toast(/fetch|network/i.test(e.message) ? 'Platform Poster is not running on this computer' : 'Send failed: ' + e.message);
  }
};
if (posterJob()) { $('#btnSendPoster').classList.add('primary'); $('#btnExport').classList.remove('primary'); }
// Opened from the poster: #poster=<job>&doc=<id> reopens that cover; without a
// doc, the photo the poster holds becomes the background of a fresh cover.
async function importFromPoster() {
  const job = posterJob(); if (!job) return false;
  const docId = (location.hash.match(/doc=([a-z0-9_-]+)/i) || [])[1];
  if (docId) { const r = covers.find(c => c.id === docId); if (r) { loadDoc(r.id === doc?.id ? doc : r.doc); switchView('editor'); return true; } }
  let j; try { j = await (await fetch(`${POSTER}/api/jobs/${job}`, { mode: 'cors' })).json(); } catch { return false; }
  const src = j.files?.source; if (!src) return false;
  const key = `${job}:${src.at}`;
  if (localStorage.getItem('rcs.posterImported') === key) { switchView('editor'); return true; }
  setStatus('loading the photo from Platform Poster…');
  try {
    const blob = await (await fetch(`${POSTER}${src.url}`, { mode: 'cors' })).blob();
    const a = await store.putAsset(blob, 'bg', (src.name || 'poster photo').replace(/\.[^.]+$/, '').slice(0, 40));
    await new Promise(r => { const im = new Image(); im.onload = im.onerror = r; im.src = a.url; imgCache[a.id] = im; });
    const d = baseDoc(`Poster · ${a.name}`);
    d.bg = { ...d.bg, type: 'image', image: a.id, fit: 'fill', scale: 1, x: 0, y: 0 };
    d.overlay = { type: 'none', color: '#000000', opacity: 0 };
    d.layers = [];
    loadDoc(d); await persistCurrent(); renderBgPick(); refreshAssetSelects();
    localStorage.setItem('rcs.posterImported', key);
    switchView('editor'); toast('Photo from Platform Poster loaded. Design it, then Send to Poster.');
    return true;
  } catch (e) { console.warn('poster import', e); setStatus('saved', 'ok'); return false; }
}

$('#btnExportAll').onclick = async () => {
  if (!covers.length) return toast('Nothing to export');
  toast('Rendering ' + covers.length + ' covers…'); const zip = new JSZip(); const order = gridOrdered();
  for (let i = 0; i < order.length; i++) { const r = order[i]; const d = r.id === doc.id ? doc : r.doc; zip.file(`${String(i + 1).padStart(2, '0')}-${slug(r.name)}.png`, await renderBlob(d, 1)); }
  const blob = await zip.generateAsync({ type: 'blob' }); await store.download('reel-covers.zip', blob);
};

/* ---------------- grid view ----------------
   Two sources. "Live IG feed" is Harrison's actual profile (igfeed.js, pulled by
   scripts/refresh-igfeed.py), with the studio's candidate laid over the top-left
   tiles, so a new post is judged against what the account really looks like
   today. "Studio covers" is the original mock built from settings.gridOrder. The
   candidate is whatever the organiser has selected, or the open document. */
const igFeed = () => window.__IG_FEED__ || null;
const FEED_VIEW = 'live-1';
function feedCandidates() {
  const sel = [...ORG.sel].map(id => covers.find(c => c.id === id)).filter(Boolean);
  if (sel.length) return sel;
  const rec = covers.find(c => c.id === doc?.id);
  return rec ? [rec] : [];
}
function renderLiveGrid() {
  const f = igFeed(), p = f.profile || {};
  $('#phHandle').textContent = p.handle || settings.handle;
  $('#phName').textContent = p.name || settings.name;
  $('#phCat').textContent = settings.category || ''; $('#phCat').hidden = !settings.category;
  $('#phBio').innerHTML = escapeHtml(p.bio || '').replace(/\n/g, '<br>');
  const lk = $('#phLink'); lk.textContent = settings.link || ''; lk.hidden = !settings.link;
  $('#phFollowedBy').innerHTML = '';
  const av = $('#phAvatar'); av.innerHTML = '';
  if (p.avatar) { const i = new Image(); i.src = p.avatar; i.alt = ''; av.appendChild(i); }
  else av.textContent = (p.name || '?').trim()[0].toUpperCase();
  $('#phPosts').textContent = p.posts || '0';
  $('#phFollowers').textContent = p.followers || '0';
  $('#phFollowing').textContent = p.following || '0';
  const ig = $('#igrid'); ig.className = 'igrid' + (settings.shape === '34' ? ' crop34' : ''); ig.innerHTML = '';
  const cands = feedCandidates();
  cands.forEach(r => {
    const t = document.createElement('div'); t.className = 'tile';
    const d = r.id === doc?.id ? doc : r.doc;
    t.innerHTML = '<span class="newtag">NEW</span>';
    t.prepend(lazyCanvas(d, 130 * 2));
    t.title = `${r.name} — the candidate. Double-click to edit; select boards in the organiser to try several.`;
    t.addEventListener('dblclick', () => { loadDoc(d); switchView('editor'); });
    ig.appendChild(t);
  });
  (f.posts || []).forEach(post => {
    const t = document.createElement('div'); t.className = 'tile';
    if (post.product === 'REELS') t.innerHTML = '<div class="play"></div>';
    const im = new Image(); im.className = 'feed'; im.loading = 'lazy'; im.src = post.thumb; im.alt = post.caption || '';
    t.prepend(im);
    t.title = (post.caption ? post.caption + '\n\n' : '') + 'His real post — click to open it on Instagram';
    if (post.permalink) t.addEventListener('click', () => window.open(post.permalink, '_blank'));
    ig.appendChild(t);
  });
  const note = $('#gFeedNote');
  note.hidden = false;
  note.innerHTML = `The real <b>@${escapeHtml(p.handle || '')}</b> feed, pulled <b>${escapeHtml(f.at || '')}</b> — ${cands.length === 1 ? 'the open document sits' : cands.length + ' selected boards sit'} on top as the new post. Refresh it with <span class="mono">python scripts/refresh-igfeed.py</span>, then push.`;
  $('#gridEmpty').hidden = true;
  const gl = $('#gridList'); gl.innerHTML = '<div class="empty">The live feed keeps Instagram\u2019s own order \u2014 switch to Studio covers to arrange tiles by hand.</div>';
  const pool = $('#gridPool'); pool.innerHTML = '';
}
function gridOrdered() { const inGrid = (settings.gridOrder || []).map(id => covers.find(c => c.id === id)).filter(Boolean); const rest = covers.filter(c => !isFeed(c.doc) && !settings.gridOrder?.includes(c.id)).sort((a, b) => b.updatedAt - a.updatedAt); return [...inGrid, ...rest]; }
let gridDrag = null;
function renderGrid() {
  if (!$('#view-grid').classList.contains('active')) return;
  const live = settings.gridView !== 'studio' && igFeed();
  $('#gSrcLive').setAttribute('aria-pressed', !!live); $('#gSrcStudio').setAttribute('aria-pressed', !live);
  $('#gSrcLive').disabled = !igFeed();
  PROFILE_FIELDS.forEach(([id, key]) => { const el = $('#' + id); if (el && document.activeElement !== el) el.value = settings[key] || ''; });
  $('#gShape916').setAttribute('aria-pressed', settings.shape !== '34'); $('#gShape34').setAttribute('aria-pressed', settings.shape === '34');
  $$('#phTabs [data-shape]').forEach(t => t.classList.toggle('on', (t.dataset.shape === '34') === (settings.shape === '34')));
  if (live) return renderLiveGrid();
  $('#gFeedNote').hidden = true;
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
  const pool = $('#gridPool'); pool.innerHTML = ''; covers.filter(c => !isFeed(c.doc) && !settings.gridOrder.includes(c.id)).sort((a, b) => b.updatedAt - a.updatedAt).forEach(r => pool.appendChild(gridRow(r, false)));
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
  if (list.length === 1) { const r = list[0], d = r.id === doc?.id ? doc : r.doc, ds = sizeOf(d); await store.download(`${slug(r.name)}-${ds.w * scale}x${ds.h * scale}.png`, await renderBlob(d, scale)); return toast('Exported'); }
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
$('#gSrcLive').onclick = () => { settings.gridView = 'live'; saveSettingsSoon(); renderGrid(); };
$('#gSrcStudio').onclick = () => { settings.gridView = 'studio'; saveSettingsSoon(); renderGrid(); };
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
  const mk = (list, sel, on) => { const c = document.createElement('div'); list.forEach(a => { const b = document.createElement('button'); b.className = 'th'; b.setAttribute('aria-pressed', a.id === sel); const im = new Image(); im.src = a.url; im.alt = a.name; b.appendChild(im); if (!a.builtin && !a.shared) { const x = document.createElement('button'); x.className = 'del'; x.textContent = '✕'; x.title = 'Delete'; x.onclick = async e => { e.stopPropagation(); if (confirm('Delete this image?')) { await store.deleteAsset(a.id); renderCutoutView(); refreshAssetSelects(); } }; b.appendChild(x); } b.onclick = () => on(a.id); c.appendChild(b); }); return [...c.children]; };
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
  d.layers = c.empty ? [] : withSize(COVER, () => coverLayers(c, o));
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
  const all = [...assetsOf('photo'), ...assetsOf('bg')].filter(a => !shadowed(a));
  all.forEach(a => {
    const b = document.createElement('button'); b.title = a.name;
    b.setAttribute('aria-pressed', batchOpts.pool.includes(a.id));
    const im = new Image(); im.loading = 'lazy'; im.decoding = 'async'; im.src = a.thumb || a.url; im.alt = a.name; b.appendChild(im);
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
const SIG_W = { mark: 0.059, shinbukan: 0.043, seizanji: 0.078 };   // mark widths as a share of W
function signatureLayers(sy, ins, k = 1) {
  // ins (px): keep the strip that far in from both sides — the static ads' safe box. Without it the
  // reel-cover positions stand, so the statics and the Blocks panel render as before.
  // k: scale of the whole strip — marks, type and gaps (the static ads set it larger, AD_SIG).
  const mw = SIG_W.mark * k * W, sw = SIG_W.shinbukan * k * W, zw = SIG_W.seizanji * k * W, tag = ins == null ? {} : { role: 'sig' };
  const mx = ins == null ? 0.098 : (ins + mw / 2) / W, nx = ins == null ? 0.145 : (ins + mw + 19 * k) / W;
  const zx = ins == null ? 0.895 : (W - ins - zw / 2) / W, sx = ins == null ? 0.815 : (W - ins - zw - 21 * k - sw / 2) / W;
  const mk = o => newText(Object.assign({ font: RTS.font, align: 'left', x: nx, color: RTS.white, box: 'none', outline: 0, shadow: 0.45, behind: false }, tag, o));
  return [
    newLogo({ image: 'rtsMark', x: mx, y: sy, size: SIG_W.mark * k, alpha: 0.92, ...tag }),
    mk({ text: 'Harrison Saito', weight: 500, size: 28 * k, track: 0, line: 1.05, width: 0.5, y: (sy * H - 31 * k) / H, shadow: 0.25 }),
    mk({ text: 'Educator. Martial Artist. Coach.', weight: 500, size: 14 * k, track: 0.18, line: 1.2, width: 0.6, upper: true, y: (sy * H + 5 * k) / H, color: '#cfc7b8', shadow: 0 }),
    newLogo({ image: 'rtsShinbukan', x: sx, y: sy, size: SIG_W.shinbukan * k, alpha: 0.9, ...tag }),
    newLogo({ image: 'rtsSeizanji', x: zx, y: sy, size: SIG_W.seizanji * k, alpha: 0.9, ...tag }),
  ];
}
/* How far the signature strip reaches above and below its centre line: the tallest mark
   (natural aspect once loaded, square until then) or the name and role lines. */
function sigExtent(k = 1) {
  const half = Math.max(...[['rtsMark', SIG_W.mark], ['rtsShinbukan', SIG_W.shinbukan], ['rtsSeizanji', SIG_W.seizanji]].map(([id, w]) => {
    const im = getImg(id); return w * k * W * (im && im.naturalWidth ? im.naturalHeight / im.naturalWidth : 1) / 2;
  }));
  return { up: Math.max(half, 31 * k), down: Math.max(half, (5 + 14 * 1.2) * k) };
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
  d.layers = withSize(COVER, () => staticLayers(s));
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

/* The one call to action the client submission goes out with. Change it here (or
   with "Submission CTA" on the set card) and every board in the set is laid out
   again with it; bump FINAL_CTA_REV to push a new line to browsers that already
   hold the set. */
const FINAL_CTA = 'If this resonates, let’s talk';
const FINAL_CTA_ALT = 'Start the Conversation';           // the alternative button, one click away in the CTA list
const FINAL_CTA_REV = 'cta-2';   // cta-2: "If this resonates, let's talk" across the submission (28 Sep 2026)
/* The lines the boards in the submission were exported with, read off the
   pictures themselves (final.js `ctaNow`) rather than the brief, because several
   were edited in the studio before they were exported. De-duplicated, and any
   that merely repeat one of the brief's eight are dropped. */
const ctaKey = s => (s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[.,]+$/, '').trim();
function submissionCtas() {
  const seen = new Set(), out = [];
  (rtsAds().ctas || []).forEach(c => { seen.add(ctaKey(c.line)); seen.add(ctaKey(c.button)); });
  (rtsFinal().boards || []).forEach(b => {
    const k = ctaKey(b.ctaNow); if (!k || seen.has(k)) return;
    seen.add(k);
    const button = b.ctaNow.length <= 46;      // a short one is a button, a long one a positioning line
    out.push({ id: 'SUB ' + String(out.length + 1).padStart(2, '0'), from: 'submission',
      line: button ? '' : b.ctaNow, button: button ? b.ctaNow : '' });
  });
  return out;
}

/* ---------------- CTA badges ----------------
   One-click CTAs: a positioning line and, optionally, a button. The eight lines from
   Harrison's static ad brief are built in (ads.js); badges saved from the Line and
   Button fields live in this browser's settings. On a static ad a badge replaces the
   board's footer line and button and lays the board out again, so the stack stays in
   the safe box; on anything else it lands as ordinary layers near the foot. */
const builtinCtas = () => (rtsAds().ctas || []).map(c => ({ ...c, name: c.id, builtin: true }));
function ctaBadgeLayers(line, button) {
  const mk = p => newText(Object.assign({ font: RTS.font, align: 'center', x: 0.5, color: RTS.white, box: 'none', outline: 0, shadow: 0.3, behind: false }, p));
  const L = [], btnH = 54, gap = 26;
  const t = line ? mk({ text: line, weight: 400, italic: true, size: 24, track: 0, line: 1.35, width: 0.74, color: '#e6dfd2', shadow: 0.5 }) : null;
  const b = button ? mk({ text: button, weight: 600, size: 17, track: 0.2, line: 1.2, width: 0.86, upper: true, shadow: 0 }) : null;
  if (t) t.width = balancedWidth(t);
  const tH = t ? measureLayer(t).height : 0;
  // foot of the stack: above the reel UI on a cover, above the signature strip on a 4:5 or square frame
  let y = (H > 1600 ? 0.8 : 0.84) * H - tH - (b ? gap + btnH : 0);
  if (t) { t.y = y / H; L.push(t); y += tH + gap; }
  if (b) {
    const c = measureCtx(); c.font = fontString(b); c.letterSpacing = `${b.track * b.size}px`;
    const bw = c.measureText(button.toUpperCase()).width + 64, yc = y + btnH / 2;
    b.y = (yc - b.size * b.line / 2) / H;
    L.push(newRule({ x: 0.5, y: yc / H, width: bw / W, thick: btnH, color: RTS.red, alpha: 1 }), b);
  }
  return L;
}
async function placeCta(name, line, button) {
  line = (line || '').trim(); button = (button || '').trim();
  if (!line && !button) return toast('Write a line or a button first');
  if (!(await adFontsReady())) return toast('Fraunces is still loading — try again in a moment');
  if (doc.ad) {
    pushUndo();
    relayAd(doc, { line, cta: button });
    if (doc.ad.setKey === FINAL_KEY) { const btn = doc.layers.find(l => l.type === 'rule' && l.role === 'button'); if (btn && !btn.r) btn.r = 12; }
    const l = doc.layers.find(x => x.role === 'line') || doc.layers.find(x => x.role === 'cta');
    if (l) select(l.id);
    commit(); syncAll(); renderAds();
    return toast(`${name} set on ${doc.ad.id}`);
  }
  pasteBlock(name, withSize(doc, () => ctaBadgeLayers(line, button)));
}
/* Each line is shown in full rather than as a number, because picking one meant
   opening "CTA 01", "CTA 02"… in turn to find out what they said. */
function renderCtas() {
  const c = $('#ctaList'); if (!c) return; c.innerHTML = '';
  const cur = ctaKey($('#ctaLine') ? $('#ctaLine').value : '') || ctaKey($('#ctaBtn') ? $('#ctaBtn').value : '');
  const group = t => { const g = document.createElement('div'); g.className = 'ctaGrp'; g.textContent = t; c.appendChild(g); };
  const add = (b, own) => {
    const el = document.createElement('button'); el.className = 'ctaRow'; el.type = 'button';
    el.setAttribute('aria-current', !!cur && (ctaKey(b.line) === cur || ctaKey(b.button) === cur));
    el.title = `${b.line || b.button}${b.line && b.button ? `\n[ ${b.button} ]` : ''}\n\nClick to put it on this board`;
    const t = document.createElement('span'); t.className = 't';
    t.textContent = b.line || b.button || '(empty)';
    if (b.line && b.button) { const s = document.createElement('span'); s.className = 'b'; s.textContent = b.button; t.append(document.createElement('br'), s); }
    el.appendChild(t);
    if (b.id) { const u = document.createElement('span'); u.className = 'u'; u.textContent = b.id; el.appendChild(u); }
    if (own) {
      const x = document.createElement('button'); x.className = 'del'; x.type = 'button'; x.textContent = '✕'; x.title = 'Delete this badge';
      x.onclick = e => { e.stopPropagation(); if (!confirm(`Delete the CTA badge “${b.name}”?`)) return; settings.ctaBadges = settings.ctaBadges.filter(o => o.id !== b.id); saveSettingsSoon(); renderCtas(); };
      el.appendChild(x);
    }
    el.onclick = () => { $('#ctaLine').value = b.line || ''; $('#ctaBtn').value = b.button || ''; placeCta(b.name || b.id || 'CTA', b.line, b.button); renderCtas(); };
    c.appendChild(el);
  };
  group('The submission CTAs');
  add({ id: 'SUBMISSION', name: 'Submission CTA', line: '', button: FINAL_CTA }, false);
  add({ id: 'ALT', name: 'Alternative CTA', line: '', button: FINAL_CTA_ALT }, false);
  const sub = submissionCtas();
  const brief = builtinCtas();
  if (brief.length) { group(`From the brief · ${brief.length}`); brief.forEach(b => add(b, false)); }
  if (sub.length) { group(`Used in the submission · ${sub.length}`); sub.forEach(b => add(b, false)); }
  const own = settings.ctaBadges || [];
  if (own.length) { group(`Saved here · ${own.length}`); own.forEach(b => add(b, true)); }
}
/* A board in the submission is a finished picture with the old call to action
   printed on it, so the new one is laid over the top: a bar the exact size of the
   old one in the same vermilion, with the line centred on it. final.js carries
   that rectangle (`cta`) for every board, measured from the picture. */
function finalCtaLayers(box, text) {
  const t = (text || '').trim(); if (!t || !box) return [];
  const bw = box.w * W, room = bw - Math.min(96, bw * 0.14);
  const probe = measureCtx();
  const width = s => { const l = newText({ font: RTS.font, weight: 600, size: s, track: 0.2, line: 1.2, upper: true, text: t }); probe.font = fontString(l); probe.letterSpacing = `${0.2 * s}px`; return probe.measureText(t.toUpperCase()).width; };
  let size = Math.min(26, Math.max(13, Math.round(box.h * 0.42)));
  while (size > 12 && width(size) > room) size--;
  /* The bar underneath is printed on the picture with square corners, so a rounded
     bar of the same size would just expose them. Growing it by its own radius puts
     the old corners exactly on the centre of each curve, inside the new shape. */
  const r = Math.min(16, Math.max(9, Math.round(box.h * 0.22)));
  const rule = newRule({ x: box.x, y: box.y, width: box.w + 2 * r / W, thick: box.h + 2 * r, color: RTS.red, alpha: 1, r });
  const cta = newText({ font: RTS.font, align: 'center', x: box.x, width: box.w, text: t, weight: 600, size,
    track: 0.2, line: 1.2, upper: true, color: RTS.white, shadow: 0, box: 'none', outline: 0, behind: false });
  cta.y = (box.y * H - size * 1.2 / 2) / H;
  rule.role = 'finalcta'; cta.role = 'finalcta';
  return [rule, cta];
}
/* `text` null re-lays every board with the wording it already carries, which is
   how the shape can be changed without overwriting a line someone has edited. */
async function applyFinalCta(text) {
  const recs = covers.filter(c => c.doc && c.doc.ad && c.doc.ad.setKey === FINAL_KEY);
  if (!recs.length) return 0;
  if (!(await adFontsReady())) { toast('Fraunces is still loading — try again in a moment'); return 0; }
  const byId = new Map((rtsFinal().boards || []).map(b => [b.id, b]));
  let n = 0;
  for (const r of recs) {
    const b = byId.get(r.doc.ad.id);
    const d = r.id === doc?.id ? doc : r.doc;
    if ((d.layers || []).some(l => l.role === 'head' || l.role === 'cta')) {
      // an editable board: the button is part of the layout, so lay the board out again with the new words
      const cur = ((d.layers || []).find(l => l.role === 'cta') || {}).text;
      relayAd(d, { cta: text || cur || settings.finalCtaText || FINAL_CTA });
      const btn = (d.layers || []).find(l => l.type === 'rule' && l.role === 'button');
      if (btn && !btn.r) btn.r = 12;
    } else {
      if (!b || !b.cta) continue;   // f01 carries no call to action
      const had = (d.layers || []).find(l => l.role === 'finalcta' && l.type === 'text');
      const line = text || (had && had.text) || settings.finalCtaText || FINAL_CTA;
      d.layers = (d.layers || []).filter(l => l.role !== 'finalcta');
      d.layers.push(...withSize(d, () => finalCtaLayers(b.cta, line)));
    }
    d.updatedAt = r.updatedAt = Date.now(); r.doc = d; n++;
  }
  await store.saveCovers(recs);
  if (text) settings.finalCtaText = text;
  saveSettingsSoon();
  renderAll(); renderAds(); renderCtas();
  return n;
}
/* Every submission board that has a plate becomes a REAL ad board: the take's own
   picture with the printed type erased as the background, and the words as live
   layers — head, sub, kicker, the CTA button — laid out by adLayers, so the text
   is editable like any other static ad and Submission CTA / CTA badges work on
   it. The wording comes from the board's source copy (ads.js / statics.js), with
   final.js overrides for the takes whose words were edited before export; the
   button keeps whatever the call to action on the board says now. A board
   someone has already made editable, or edited by hand, is never rebuilt. */
const FINAL_EDIT = 'edit-1';
async function seedFinalEditable() {
  if (settings.finalEdit === FINAL_EDIT) return false;
  const fin = rtsFinal(); if (!fin.boards || !fin.boards.some(b => b.plate)) return false;
  const recs = covers.filter(c => c.doc && c.doc.ad && c.doc.ad.setKey === FINAL_KEY);
  if (!recs.length) return false;
  if (!(await adFontsReady())) return false;
  await preloadAssets(['rtsMark', 'rtsShinbukan', 'rtsSeizanji']);
  const byId = new Map(fin.boards.map(b => [b.id, b]));
  const changed = [];
  for (const r of recs) {
    const b = byId.get(r.doc.ad.id);
    if (!b || !b.plate || !b.edit) continue;
    const d = r.id === doc?.id ? doc : r.doc;
    if ((d.layers || []).some(l => l.role === 'head')) continue;      // already editable
    const had = (d.layers || []).find(l => l.role === 'finalcta' && l.type === 'text');
    const ctaText = (had && had.text) || settings.finalCtaText || FINAL_CTA;
    const setKey = b.edit.setKey, cfg = adBoardCfg(setKey, b.code) || {};
    const src = { ...adSource(setKey, b.code), ...(b.edit.copy || {}) };
    let layout = cfg.layout || src.layout || 'cover';
    if (layout === 'type') layout = 'cover';    // every take sits on a photograph, never the quiet type plate
    d.bg = { ...d.bg, type: 'image', image: 'plate' + b.id, fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1, pad: RTS.ink };
    d.overlay = { type: 'none', color: '#0c0905', opacity: 0 };       // the printed scrim is part of the plate
    d.grain = 0;
    withSize(d, () => {
      d.layers = adLayers({ name: d.ad.name, kicker: src.kicker, head: src.head, sub: src.sub, line: '', cta: ctaText, layout });
      const btn = d.layers.find(l => l.type === 'rule' && l.role === 'button');
      if (btn) btn.r = 12;                                            // the round ends Dion asked for
    });
    d.ad.layout = layout; d.ad.rev = AD_LAYOUT;
    if (b.edit.rough) { d.ad.flag = d.ad.flag || 'plate has visible retouching — check before it ships'; }
    d.updatedAt = r.updatedAt = Date.now(); r.doc = d;
    changed.push(r);
  }
  if (changed.length) await store.saveCovers(changed);
  settings.finalEdit = FINAL_EDIT;
  await store.saveSettings(settings).catch(() => {});
  if (doc && changed.some(r => r.id === doc.id)) loadDoc(covers.find(c => c.id === doc.id).doc);
  renderAds();
  return changed.length > 0;
}
const FINAL_CTA_ROUND = 'round-1';
async function seedFinalCtaRound() {
  if (settings.finalCtaRound === FINAL_CTA_ROUND) return false;
  const n = await applyFinalCta(null);          // null: keep whatever each board says
  if (!n) return false;
  settings.finalCtaRound = FINAL_CTA_ROUND;
  await store.saveSettings(settings).catch(() => {});
  return true;
}
async function seedFinalCta() {
  if (settings.finalCtaRev === FINAL_CTA_REV) return false;
  const n = await applyFinalCta(FINAL_CTA);
  if (!n) return false;
  settings.finalCtaRev = FINAL_CTA_REV;
  await store.saveSettings(settings).catch(() => {});
  return true;
}
function bindCtas() {
  $('#ctaAdd').onclick = () => placeCta('CTA', $('#ctaLine').value, $('#ctaBtn').value);
  $('#ctaSave').onclick = () => {
    const line = $('#ctaLine').value.trim(), button = $('#ctaBtn').value.trim();
    if (!line && !button) return toast('Write a line or a button first');
    const name = (prompt('Name this CTA badge:', (line || button).split(/\s+/).slice(0, 4).join(' ')) || '').trim();
    if (!name) return;
    settings.ctaBadges = [...(settings.ctaBadges || []), { id: uid(), name, line, button }];
    saveSettingsSoon(); renderCtas(); toast(`Saved “${name}” — it is in CTA badges on every cover`);
  };
  renderCtas();
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

/* ---------------- carousel posts ----------------
   A carousel post is an ordinary document that happens to be 1080×1350 and to
   carry doc.post, so every tool in the editor — layers, part colour, gradients,
   the photo library, undo, versions — works on it with no special case. Slides
   group into carousels by doc.post.cid. They are kept out of the cover list and
   the profile grid, because a carousel is a feed post, not a reel cover.

   The twenty storyboards in posts.js are the copy Dion approved; seedPostSet
   turns each into three slides and never rebuilds one that is already there. */
const POST_SET = 'wa-20-v1';
const PC = { navy: '#18202b', deep: '#131b29', paper: '#f2ece0', ink: '#0c111b', red: '#b5432f', dim: '#bbc0c9', slate: '#5c6470', faint: '#cdd2da' };
const POST_STYLES = ['hook', 'practice', 'event'];
const POST_STYLE_NAME_EXTRA = { photo: 'Photo' };
const POST_STYLE_NAME = { hook: 'Type', practice: 'Ivory card', event: 'The event', photo: 'Photo' };
const postGround = s => s === 'practice' ? PC.paper : s === 'event' ? PC.deep : PC.navy;
const postFooter = (i, n) => `${String(i).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
const waPosts = () => window.__WA_POSTS__ || {};
/* Layout is measured, so the fonts have to be in before any of it runs. */
function loadPostFonts() {
  return Promise.allSettled(['400 100px "Fraunces"', '400 100px "Manrope"', '600 100px "Manrope"', '700 100px "Manrope"'].map(f => document.fonts.load(f)));
}
function postHeadSize(t, style) {
  const n = (t || '').length;
  if (style === 'event') return n <= 26 ? 84 : n <= 44 ? 72 : 62;
  return n <= 26 ? 104 : n <= 46 ? 92 : n <= 72 ? 80 : 70;
}
/* The three looks from the storyboard: a dark hook, an ivory practice card, and
   the event card with the details and the button. Blocks stack down from the top
   margin by their measured height, so a long headline pushes the body down
   instead of landing on it, and the slide number sits on the floor of the card. */
function postLayers(style, o) {
  return withSize(POST, () => {
    const paper = style === 'practice', onPhoto = style === 'photo';
    const pad = 0.08 * W, x = 0.08, width = 0.84;
    const ink = paper ? PC.ink : PC.paper, quiet = paper ? PC.slate : onPhoto ? PC.faint : PC.dim;
    const mk = (text, over) => newText({ text, font: 'Manrope', weight: 400, size: 40, track: 0, line: 1.45, align: 'left', x, width, color: quiet, shadow: 0, ...over });
    const L = [];
    const eyebrow = mk(o.eyebrow || '', { weight: 600, size: 26, track: 0.14, line: 1.5, upper: true, color: paper ? PC.red : PC.faint, shadow: onPhoto ? 0.5 : 0 });
    const head = mk(o.head || '', { font: 'Fraunces', size: postHeadSize(o.head, style), track: -0.02, line: 1.12, color: ink, shadow: onPhoto ? 0.5 : 0 });
    const body = o.body ? mk(o.body, { size: style === 'event' ? 37 : onPhoto ? 40 : 44, shadow: onPhoto ? 0.5 : 0 }) : null;
    const foot = mk(o.footer || '', { weight: 600, size: 25, track: 0.1, line: 1.4, upper: true, color: paper ? PC.slate : PC.faint, shadow: onPhoto ? 0.5 : 0 });
    foot.y = (H - pad - 35) / H;
    eyebrow.y = pad / H;
    if (onPhoto) {
      /* Over a picture the type sits on the floor of the frame, where the scrim
         is darkest, and is stacked upwards so the headline always clears it. */
      let y = H - pad - 78;
      if (body) { y -= measureLayer(body).height; body.y = y / H; y -= 40; }
      y -= measureLayer(head).height; head.y = y / H;
    } else {
      let y = pad + measureLayer(eyebrow).height + 62;
      head.y = y / H; y += measureLayer(head).height + 44;
      if (body) { body.y = y / H; y += measureLayer(body).height; }
      if (o.cta) L.push(mk(o.cta, { weight: 700, size: 34, track: 0.02, line: 1.3, width: 0.5, color: PC.paper, box: 'block', boxColor: PC.red, boxAlpha: 1, y: (y + 54) / H }));
    }
    L.push(eyebrow, head); if (body) L.push(body); L.push(foot);
    return L;
  });
}
/* meta: the carousel (n, cid, title, angle, insight, shortlist).
   slide: the copy for this one (head, body, cta, eyebrow, visual). */
function postDoc(meta, i, of, slide, style) {
  style = style || POST_STYLES[Math.min(i, POST_STYLES.length - 1)];
  const d = baseDoc(`${String(meta.n || 0).padStart(2, '0')}.${i + 1} · ${meta.title}`);
  d.w = POST.w; d.h = POST.h;
  d.subject = { ...d.subject, on: false };
  d.grain = 0;
  if (style === 'photo' && slide.photo) {   // shared-library photo, with a scrim for the type
    d.bg = { ...d.bg, type: 'image', image: 'sh_' + slide.photo, fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1 };
    d.overlay = { ...d.overlay, type: 'both', color: '#0a0e16', opacity: 0.95 };
  } else {
    d.bg = { ...d.bg, type: 'solid', color: postGround(style) };
    d.overlay = { ...d.overlay, type: 'none', opacity: 0 };
  }
  d.layers = postLayers(style, {
    eyebrow: slide.eyebrow || (waPosts().eyebrow || {})[style] || '',
    head: slide.head || '', body: slide.body || '', cta: slide.cta || '', footer: postFooter(i + 1, of),
  });
  d.post = {
    set: POST_SET, key: `${meta.cid}:${i + 1}`, cid: meta.cid, n: meta.n || 0, slide: i + 1, of, style,
    title: meta.title || 'Carousel', category: meta.category || '', insight: meta.insight || '', pick: meta.pick || '', visual: slide.visual || '', photo: slide.photo || '',
  };
  return d;
}
async function seedPostSet() {
  const wa = waPosts(); if (!wa.ideas || !wa.ideas.length) return false;
  setStatus('loading the carousel storyboards…');
  await loadPostFonts();
  const have = new Set(covers.filter(c => c.doc && c.doc.post).map(c => c.doc.post.key));
  // stamped older than the covers, so the studio still opens on the latest cover
  let t = Math.min(Date.now(), ...covers.map(c => c.createdAt || Date.now())) - 36e5;
  const recs = [];
  for (const idea of wa.ideas) {
    const meta = { n: idea.n, cid: `wa-${idea.n}`, title: idea.title, category: idea.category, insight: idea.insight, pick: idea.pick };
    idea.slides.forEach((s, i) => {
      if (have.has(`${meta.cid}:${i + 1}`)) return;         // an edited slide is never rebuilt
      const style = POST_STYLES[Math.min(i, POST_STYLES.length - 1)];
      const d = postDoc(meta, i, idea.slides.length, {
        head: s.head, body: style === 'event' ? wa.event : s.body, cta: style === 'event' ? wa.cta : '', visual: s.visual,
      }, style);
      d.createdAt = d.updatedAt = t++; recs.push(coverRecord(d));
    });
  }
  if (recs.length) { await store.saveCovers(recs); covers = covers.concat(recs); }
  settings.postSet = POST_SET; await store.saveSettings(settings).catch(() => {});
  return recs.length > 0;
}

/* The four sets written to be posted in the run-up to Saturday (wa-sets.js).
   They are seeded like the storyboards but under their own gate, and grouped by
   the angle "Ready to post" so the chip in the Posts tab filters to exactly the
   run that is going out. Their photographs come from the shared library, so
   nothing large is committed to the repo. */
const WA_LIVE = 'wa-live-1';
async function seedWaSets() {
  const wa = window.__WA_SETS__; if (!wa || !wa.sets) return false;
  setStatus('loading the live sets…');
  await loadPostFonts();
  const have = new Set(covers.filter(c => c.doc && c.doc.post).map(c => c.doc.post.key));
  let t = Math.min(Date.now(), ...covers.map(c => c.createdAt || Date.now())) - 18e5;
  const recs = [];
  for (const s of wa.sets) {
    const meta = { n: s.n, cid: s.cid, title: s.title, category: 'Ready to post', insight: s.insight, pick: s.pick };
    s.slides.forEach((sl, i) => {
      if (have.has(`${s.cid}:${i + 1}`)) return;
      const slide = {
        head: sl.head, body: sl.style === 'event' ? wa.event : sl.body,
        cta: sl.style === 'event' ? wa.cta : '', photo: sl.photo,
        eyebrow: (wa.eyebrow || {})[sl.style] || '', visual: sl.note || '',
      };
      const d = postDoc(meta, i, s.slides.length, slide, sl.style);
      d.post.emotion = s.emotion || ''; d.post.caption = s.caption || '';
      d.createdAt = d.updatedAt = t++; recs.push(coverRecord(d));
    });
  }
  if (recs.length) { await store.saveCovers(recs); covers = covers.concat(recs); }
  settings.waLive = WA_LIVE; await store.saveSettings(settings).catch(() => {});
  return recs.length > 0;
}

/* ---------------- the posts view ---------------- */
function postGroups() {
  const by = new Map();
  for (const c of covers) {
    const p = c.doc && c.doc.post; if (!p) continue;
    let g = by.get(p.cid);
    if (!g) by.set(p.cid, g = { cid: p.cid, n: p.n || 0, title: p.title || 'Carousel', category: p.category || '', insight: p.insight || '', pick: p.pick || '', emotion: p.emotion || '', caption: p.caption || '', slides: [] });
    g.slides.push(c);
  }
  for (const g of by.values()) g.slides.sort((x, y) => (x.doc.post.slide || 0) - (y.doc.post.slide || 0));
  return [...by.values()].sort((x, y) => (x.n - y.n) || String(x.cid).localeCompare(y.cid));
}
let postFilter = 'all';
function renderPosts() {
  const wrap = $('#postList'); if (!wrap) return;
  wrap.innerHTML = '';
  const all = postGroups();
  $('#postEmpty').hidden = all.length > 0;
  const counts = new Map(); all.forEach(g => { if (g.category) counts.set(g.category, (counts.get(g.category) || 0) + 1); });
  const picks = all.filter(g => g.pick).length;
  const chips = [['all', 'All carousels', all.length]]
    .concat(picks ? [['top', 'Top picks', picks]] : [])
    .concat([...counts.keys()].sort().map(k => [k, k, counts.get(k)]));
  if (!chips.some(c => c[0] === postFilter)) postFilter = 'all';
  const cc = $('#postChips'); cc.innerHTML = '';
  chips.forEach(([v, label, n]) => {
    const b = document.createElement('button'); b.className = 'chip'; b.type = 'button';
    b.setAttribute('aria-pressed', v === postFilter); b.innerHTML = `${escapeHtml(label)}<i>${n}</i>`;
    b.onclick = () => { postFilter = v; renderPosts(); };
    cc.appendChild(b);
  });
  const og = $('#postOrg'); if (og) { og.innerHTML = ''; og.appendChild(orgBar('posts')); }
  const of = orgFilter('posts');
  all.filter(g => postFilter === 'all' || (postFilter === 'top' ? !!g.pick : g.category === postFilter))
    .filter(g => !orgActive(of) || g.slides.some(r => orgMatch(r, of)))
    .forEach(g => wrap.appendChild(postCard(g)));
}
function postCard(g) {
  const el = document.createElement('article'); el.className = 'pcard'; el.dataset.pick = !!g.pick; el.dataset.cid = g.cid;
  const head = document.createElement('header'), meta = document.createElement('div');
  meta.innerHTML = `<span class="kicker">${String(g.n || 0).padStart(2, '0')}${g.category ? ' · ' + escapeHtml(g.category) : ''}</span>`
    + `<h3>${escapeHtml(g.title)}${g.emotion ? `<em>${escapeHtml(g.emotion.toUpperCase())}</em>` : g.pick ? '<em>TOP PICK</em>' : ''}</h3>`
    + (g.insight ? `<p class="insight">${escapeHtml(g.insight)}</p>` : '')
    + (g.pick ? `<p class="why">Why shortlist: ${escapeHtml(g.pick)}</p>` : '');
  const acts = document.createElement('div'); acts.className = 'acts';
  acts.innerHTML = (g.caption ? '<button class="small ghost">Copy caption</button>' : '')
    + '<button class="small">Export carousel</button><button class="small ghost">Duplicate</button><button class="small ghost">Delete</button><button class="small ghost" title="Favourite, label or album — for the whole carousel">⋯</button>';
  const btns = $$('button', acts);
  if (g.caption) { const cap = btns.shift(); cap.onclick = () => { navigator.clipboard.writeText(g.caption).then(() => toast('Caption copied'), () => toast('Could not copy')); }; }
  const [exp, dup, del, more] = btns;
  exp.onclick = () => exportCarousel(g); dup.onclick = () => duplicateCarousel(g); del.onclick = () => deleteCarousel(g);
  more.onclick = () => orgMenu(more, orgMenuItems(g.slides));
  head.append(meta, acts); el.appendChild(head);
  const row = document.createElement('div'); row.className = 'pslides';
  g.slides.forEach(r => row.appendChild(postSlideTile(r)));
  const add = document.createElement('div'); add.className = 'pslide';
  add.innerHTML = '<button class="addslide" type="button" title="Add a slide to this carousel">+ Slide</button>';
  $('button', add).onclick = () => addSlide(g);
  row.appendChild(add); el.appendChild(row);
  return el;
}
function postSlideTile(r) {
  const p = r.doc.post, live = r.id === doc?.id ? doc : r.doc;
  const el = document.createElement('div'); el.className = 'pslide'; el.setAttribute('aria-current', r.id === doc?.id);
  const b = document.createElement('button'); b.className = 'tile'; b.type = 'button'; b.title = `Open slide ${p.slide} in the editor`;
  b.appendChild(lazyCanvas(live, 158));
  const no = document.createElement('span'); no.className = 'no'; no.textContent = String(p.slide).padStart(2, '0'); b.appendChild(no);
  b.onclick = () => { loadDoc(live); switchView('editor'); };
  const cap = document.createElement('div'); cap.className = 'cap';
  cap.innerHTML = `<b>${escapeHtml(POST_STYLE_NAME[p.style] || 'Slide')}</b>${escapeHtml(p.visual || '')}`;
  el.append(b, cap); orgDecor(el, r, 'posts'); return el;
}
const carouselFile = g => `${String(g.n || 0).padStart(2, '0')}-${slug(g.title)}`;
const slideDocs = g => g.slides.map(r => r.id === doc?.id ? doc : r.doc);
/* A background that has not been decoded yet renders as an empty frame, so every
   picture in the carousel is waited for before a single slide is rendered. */
const awaitSlidePhotos = docs => preloadAssets(docs.map(d => d.bg && d.bg.type === 'image' ? d.bg.image : null));
async function exportCarousel(g) {
  if (!g.slides.length) return;
  setStatus('rendering…'); toast(`Rendering ${g.slides.length} slides…`);
  await loadPostFonts(); await awaitSlidePhotos(slideDocs(g));
  const zip = new JSZip();
  for (const r of g.slides) {
    const d = r.id === doc?.id ? doc : r.doc;
    zip.file(`${String(d.post.slide).padStart(2, '0')}-${slug(g.title)}.png`, await renderBlob(d, 1));
  }
  const ok = await store.download(`wa-${carouselFile(g)}.zip`, await zip.generateAsync({ type: 'blob' }));
  setStatus('saved · this browser', 'ok'); toast(ok ? `${g.slides.length} slides exported` : 'Export cancelled');
}
async function exportAllCarousels() {
  const all = postGroups(); if (!all.length) return toast('No carousels yet');
  const n = all.reduce((k, g) => k + g.slides.length, 0);
  setStatus('rendering…'); toast(`Rendering ${n} slides…`);
  await loadPostFonts();
  for (const g of all) await awaitSlidePhotos(slideDocs(g));
  const zip = new JSZip();
  for (const g of all) for (const r of g.slides) {
    const d = r.id === doc?.id ? doc : r.doc;
    zip.file(`${carouselFile(g)}/${String(d.post.slide).padStart(2, '0')}.png`, await renderBlob(d, 1));
  }
  const ok = await store.download(`wa-carousels-${new Date().toISOString().slice(0, 10)}.zip`, await zip.generateAsync({ type: 'blob' }));
  setStatus('saved · this browser', 'ok'); toast(ok ? `${n} slides exported` : 'Export cancelled');
}
/* Renumber the slide footers a carousel still carries automatically. A footer
   somebody has rewritten does not match the pattern, and is left as they wrote it. */
function renumberSlides(recs) {
  recs.forEach((r, i) => {
    const d = r.doc; d.post.slide = i + 1; d.post.of = recs.length;
    const f = d.layers.find(l => l.type === 'text' && /^\d\d \/ \d\d$/.test(l.text));
    if (f) { f.text = postFooter(i + 1, recs.length); f.spans = []; }
    r.updatedAt = d.updatedAt = Date.now();
  });
}
async function addSlide(g) {
  const i = g.slides.length, style = POST_STYLES[i % POST_STYLES.length], wa = waPosts();
  const meta = { n: g.n, cid: g.cid, title: g.title, category: g.category, insight: g.insight, pick: g.pick };
  const d = postDoc(meta, i, i + 1, style === 'event'
    ? { head: 'Come along.', body: wa.event || '', cta: wa.cta || '' }
    : { head: 'Your headline here.', body: 'One line underneath it.' }, style);
  d.post.key = `${g.cid}:x${uid()}`;      // hand-made, so re-seeding can never touch it
  d.createdAt = d.updatedAt = Date.now();
  const rec = coverRecord(d), all = g.slides.concat([rec]);
  renumberSlides(all); covers.push(rec);
  await store.saveCovers(all);
  renderPosts(); toast('Slide added');
}
async function newCarousel() {
  const n = Math.max(0, ...postGroups().map(g => g.n || 0)) + 1, wa = waPosts(), now = Date.now();
  const meta = { n, cid: 'c' + uid(), title: 'New carousel', category: '', insight: '', pick: '' };
  const slides = [
    { head: 'Your hook goes here.', body: 'The one line that earns the next slide.' },
    { head: 'What the practice is.', body: 'What actually happens, in plain words.' },
    { head: 'Come along.', body: wa.event || '', cta: wa.cta || '' },
  ];
  await loadPostFonts();
  const recs = slides.map((s, i) => { const d = postDoc(meta, i, slides.length, s, POST_STYLES[i]); d.createdAt = d.updatedAt = now + i; return coverRecord(d); });
  covers = covers.concat(recs); await store.saveCovers(recs);
  postFilter = 'all'; renderPosts(); toast('Carousel added — open a slide to write it');
}
async function duplicateCarousel(g) {
  const cid = 'c' + uid(), n = Math.max(0, ...postGroups().map(x => x.n || 0)) + 1, now = Date.now();
  const recs = g.slides.map((r, i) => {
    const d = JSON.parse(JSON.stringify(r.id === doc?.id ? doc : r.doc));
    d.id = uid(); d.post = { ...d.post, cid, n, key: `${cid}:${i + 1}`, title: `${g.title} copy` };
    d.name = `${String(n).padStart(2, '0')}.${i + 1} · ${g.title} copy`;
    d.createdAt = d.updatedAt = now + i; return coverRecord(d);
  });
  covers = covers.concat(recs); await store.saveCovers(recs);
  renderPosts(); toast('Carousel duplicated');
}
async function deleteCarousel(g) {
  if (!confirm(`Delete “${g.title}” and all ${g.slides.length} of its slides?`)) return;
  const ids = new Set(g.slides.map(r => r.id));
  for (const id of ids) await store.deleteCover(id).catch(() => {});
  covers = covers.filter(c => !ids.has(c.id));
  if (ids.has(doc?.id)) { const next = covers.find(c => !isFeed(c.doc)) || covers[0]; if (next) loadDoc(next.doc); }
  renderPosts(); renderCoverList(); toast('Carousel deleted');
}
$('#btnNewCarousel').onclick = () => newCarousel();
$('#btnExportCarousels').onclick = () => exportAllCarousels();

/* ---------------- static ads ----------------
   A static ad is an ordinary document at a Meta placement frame (the 4:5 feed
   by default) that carries doc.ad, so every tool in the editor — layers, part
   colour, gradients, the photo library, undo, versions — works on it with no
   special case. Boards group into sets by doc.ad.setKey. They are kept out of
   the cover list and the profile grid, like carousel posts.

   Copy comes from statics.js, plates and sets from ads.js; seedAdSet builds each
   board once at 1080×1350 and never rebuilds one that is already there. A square
   or story variant is a second document with the same copy on a new frame. */
const AD_SET = 'rts-ads-v2';   // v2: adds Static Set v3, the nine angles (25 Sep 2026)
const AD_LAYOUT = 3;   // 3 = the signature strip fully inside the safe box, anchored by its bottom edge (28 Sep 2026); 2 = safe box + sentence-case headline
const AD_FRAMES = { '4x5': { w: 1080, h: 1350, label: 'Feed 4:5' }, '1x1': { w: 1080, h: 1080, label: 'Square 1:1' }, '9x16': { w: 1080, h: 1920, label: 'Story 9:16' } };
const rtsAds = () => window.__RTS_ADS__ || { sets: [], plates: [] };
const staticById = id => (window.__RTS_STATICS__ || []).find(s => s.id === id) || {};
const adBoardCfg = (setKey, id) => ((rtsAds().sets.find(s => s.key === setKey) || {}).boards || []).find(b => b.id === id);
/* A board's source copy: statics.js by id, overlaid by the words a board carries in ads.js (v3 has no statics entry). */
const adSource = (setKey, id) => ({ ...staticById(id), ...((adBoardCfg(setKey, id) || {}).copy || {}) });
const AD_FONT_FACES = ['400 100px "Fraunces"', '500 100px "Fraunces"', '600 100px "Fraunces"', 'italic 400 100px "Fraunces"'];
function loadAdFonts() {
  return Promise.allSettled(AD_FONT_FACES.map(f => document.fonts.load(f)));
}
/* Layout measures the words, so it must never run on a fallback face: a headline measured narrow
   would wrap an extra line once Fraunces arrives and run into the sub-line. */
async function adFontsReady() {
  await loadAdFonts();
  return AD_FONT_FACES.every(f => document.fonts.check(f));
}
/* CSS text-wrap: balance, emulated: the narrowest measure that keeps the line count. */
function balancedWidth(l) {
  const n = measureLayer(l).lines.length; if (n < 2) return l.width;
  let lo = 0.2, hi = l.width;
  for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (measureLayer({ ...l, width: mid }).lines.length > n) lo = mid; else hi = mid; }
  return Math.round(hi * 1000) / 1000;
}
/* The v1 CSS sizes (92/64/54/47, type 118) less 7%: canvas text has no optical-size axis, so Fraunces
   renders wider than the boards' opsz 144 and the same size would break a line later than they did. */
function adHeadSize(t, layout) { if (layout === 'type') return 110; const n = (t || '').length; return n <= 32 ? 86 : n <= 62 ? 60 : n <= 92 ? 50 : 44; }
/* The v1 boards' CSS as layers, kept inside the safe box: AD_INSET px in on every side (the 4:5
   guide's "keep type inside" rectangle, held on the square and the story too). The signature
   strip sits on the box floor, the block is stacked up from 44px above it (54 split, 74 graphic
   and type), 18px between items; a block that would reach the top edge steps its headline down.
   The headline is sentence case in the regular weight (25 Sep 2026, Dion: "non bold"). Each text
   layer carries a role so a variant, or a re-lay, can pick the copy back up. */
const AD_INSET = 86;
/* The footer strip on the ads is drawn AD_SIG times the reel-cover size (25 Sep 2026, Dion: "bigger and
   more apparent"). Its top edge stays where the smaller strip's was, so the copy above it keeps its
   place and the strip grows down into the margin (about 67px from the foot instead of 86). */
const AD_SIG = 1.3;
function adSigY() {
  /* Anchored by its BOTTOM edge, a breath above the safe box floor. The first
     enlargement kept the top edge fixed and let the strip grow down past the
     box, which put the crests and the small caps right on the frame edge. */
  return H - AD_INSET - 6 - sigExtent(AD_SIG).down;
}
/* Boards laid out with the smaller strip get the bigger one in place: only the strip's own layers are
   replaced, and only on a board whose strip is still where and how the layout put it, so a strip that
   was moved or resized by hand, and everything else on the board, is left exactly as it is. */
function enlargeAdSig(d) {
  let done = false;
  withSize(d, () => {
    const isSig = l => l.role === 'sig';
    const mark = (d.layers || []).find(l => isSig(l) && l.type === 'logo' && l.image === 'rtsMark');
    const s1 = sigExtent(1), oldY = (H - AD_INSET - s1.down) / H;
    if (!mark || Math.abs(mark.size - SIG_W.mark) > 1e-6 || Math.abs(mark.y - oldY) > 3 / H) return;
    const at = d.layers.findIndex(isSig);
    const rest = d.layers.filter(l => !isSig(l));
    rest.splice(Math.min(at, rest.length), 0, ...signatureLayers(adSigY() / H, AD_INSET, AD_SIG));
    d.layers = rest; done = true;
  });
  return done;
}
async function enlargeAdSigs() {
  const ads = covers.filter(c => c.doc && c.doc.ad && (c.doc.layers || []).some(l => l.role === 'sig'));
  if (ads.length) {
    if (!(await adFontsReady())) return;   // measured against the loaded marks and Fraunces, or not at all
    await preloadAssets(['rtsMark', 'rtsShinbukan', 'rtsSeizanji']);
    if (!['rtsMark', 'rtsShinbukan', 'rtsSeizanji'].every(id => { const im = getImg(id); return im && im.naturalWidth; })) return;
    const changed = ads.filter(c => enlargeAdSig(c.doc));
    if (changed.length) await store.saveCovers(changed);
  }
  settings.adSig = AD_SIG; await store.saveSettings(settings).catch(() => {});
}
function adLayers(o) {
  const layout = o.layout || 'cover', left = layout === 'split';
  const align = left ? 'left' : 'center', ax = left ? AD_INSET / W : 0.5, span = (W - 2 * AD_INSET) / W;
  const mk = p => newText(Object.assign({ font: RTS.font, align, x: ax, color: RTS.white, box: 'none', outline: 0, shadow: 0.45, behind: false }, p));
  const kicker = o.kicker ? mk({ role: 'kicker', text: o.kicker, weight: 600, size: 16, track: 0.24, line: 1.2, width: span, upper: true, color: '#cfc8bb', shadow: 0.3 }) : null;
  const head = mk({ role: 'head', text: o.head || '', weight: 400, size: adHeadSize(o.head, layout), track: layout === 'type' ? -0.015 : -0.008, line: 1.02, width: span, upper: false });
  head.width = balancedWidth(head);
  const sub = o.sub ? mk({ role: 'sub', text: o.sub, weight: 400, italic: true, size: 25, track: 0, line: 1.3, width: Math.min(0.704, span), color: '#f1ece2', shadow: 0.3 }) : null;
  // the CTA / positioning line: a quiet footer under the sub-line, above the button, in the sub-line's italic
  const line = o.line ? mk({ role: 'line', text: o.line, weight: 400, italic: true, size: 21, track: 0, line: 1.35, width: Math.min(0.74, span), color: '#cfc8bb', shadow: 0.3 }) : null;
  if (line) line.width = balancedWidth(line);
  const cta = o.cta ? mk({ role: 'cta', text: o.cta, weight: 600, size: 16, track: 0.2, line: 1.2, width: span, upper: true, shadow: 0 }) : null;
  const gap = 18, btnH = 53, sig = sigExtent(AD_SIG), sy = adSigY();
  const floor = sy - sig.up - (left ? 50 : layout === 'graphic' || layout === 'type' ? 70 : 40);
  const kH = kicker ? measureLayer(kicker).height : 0, sH = sub ? measureLayer(sub).height : 0, lH = line ? measureLayer(line).height : 0;
  let hH, total, y;
  for (;;) {
    hH = measureLayer(head).height;
    total = (kicker ? kH + gap : 0) + hH + gap + 3 + gap + sH + 4 + (line ? gap + lH : 0) + (cta ? 8 + gap + btnH : 0);
    y = floor - total;
    if (y >= AD_INSET || head.size <= 36) break;
    head.size -= 4; head.width = balancedWidth({ ...head, width: span });
  }
  const L = [];
  if (layout === 'archival') { // the hairline frame, 40px in
    const c = '#fbf7ef', a = 0.45;
    L.push(newRule({ role: 'frame', x: 0.5, y: 40 / H, width: (W - 80) / W, thick: 1, color: c, alpha: a }), newRule({ role: 'frame', x: 0.5, y: (H - 40) / H, width: (W - 80) / W, thick: 1, color: c, alpha: a }),
           newRule({ role: 'frame', x: 40.5 / W, y: 0.5, width: 1 / W, thick: H - 80, color: c, alpha: a }), newRule({ role: 'frame', x: (W - 40.5) / W, y: 0.5, width: 1 / W, thick: H - 80, color: c, alpha: a }));
  }
  if (kicker) { kicker.y = y / H; L.push(kicker); y += kH + gap; }
  head.y = y / H; L.push(head); y += hH + gap;
  L.push(newRule({ role: 'rule', x: left ? ax + 22 / W : 0.5, y: (y + 1.5) / H, width: 44 / W, thick: 3, color: RTS.red, alpha: 1 })); y += 3 + gap;
  if (sub) { sub.y = y / H; L.push(sub); } y += sH + 4;
  if (line) { y += sub ? gap : 0; line.y = y / H; L.push(line); y += lH + (sub ? 0 : gap); }
  if (cta) {
    y += 8 + gap;
    const x = measureCtx(); x.font = fontString(cta); x.letterSpacing = `${cta.track * cta.size}px`;
    const bw = x.measureText(cta.text.toUpperCase()).width + 60, yc = y + btnH / 2;
    L.push(newRule({ role: 'button', x: left ? ax + bw / 2 / W : 0.5, y: yc / H, width: bw / W, thick: btnH, color: RTS.red, alpha: 1 }));
    cta.y = (yc - cta.size * cta.line / 2) / H; L.push(cta);
  }
  L.push(...signatureLayers(sy / H, AD_INSET, AD_SIG));
  return L;
}
/* Lay a board out again with the current adLayers, from the copy it carries: edited words, part
   colour and gradients stay; positions, sizes and weights follow the layout; layers added by hand
   (no role, not the signature strip) are kept on top. */
function relayAd(d, over) {
  withSize(d, () => {
    const copy = { ...adCopyOf(d), ...over }, old = d.layers || [];
    const isSig = l => l.role === 'sig' || (l.type === 'logo' && ['rtsMark', 'rtsShinbukan', 'rtsSeizanji'].includes(l.image))
      || (l.type === 'text' && !l.role && ['Harrison Saito', 'Educator. Martial Artist. Coach.'].includes(l.text));
    const own = old.filter(l => !l.role && !isSig(l));
    const fresh = adLayers({ ...copy, layout: d.ad.layout });
    for (const l of fresh) {
      if (l.type === 'rule' && l.role === 'button') { const o = old.find(x => x.type === 'rule' && x.role === 'button'); if (o && o.r) l.r = o.r; continue; }
      if (l.type !== 'text' || !l.role) continue;
      const o = old.find(x => x.type === 'text' && x.role === l.role); if (!o) continue;
      if (o.spans && o.spans.length) l.spans = JSON.parse(JSON.stringify(o.spans));
      if (o.grad) l.grad = JSON.parse(JSON.stringify(o.grad));
    }
    d.layers = fresh.concat(own);
  });
  d.ad.rev = AD_LAYOUT;
}
/* The copy a board carries now — its edited layers first, statics.js as the fallback. */
function adCopyOf(d) {
  const s = adSource(d.ad.setKey, d.ad.id), role = r => { const l = d.layers.find(x => x.type === 'text' && x.role === r); return l ? l.text : undefined; };
  const pick = (r, f) => { const v = role(r); return v === undefined ? (f || '') : v; };
  return { name: d.ad.name, kicker: pick('kicker', s.kicker), head: pick('head', s.head), sub: pick('sub', s.sub), line: pick('line', s.line), cta: pick('cta', s.cta) };
}
/* b: the board (bg, tall, scrim, layout, flag, pair, ctaRef, dir) · frame: a key of AD_FRAMES · copy: kicker/head/sub/line/cta/name */
function adDoc(set, b, frame, copy) {
  const fr = AD_FRAMES[frame] || AD_FRAMES['4x5'];
  const d = baseDoc(`Static ${b.id} · ${copy.name || b.id}`);
  d.w = fr.w; d.h = fr.h;
  d.subject = { ...d.subject, on: false }; d.grain = 0.04;
  // a picture taller than the frame keeps one end: 'bottom' for the v2 stills (every original board was the
  // bottom 1350 of the 1920-tall still), 'top' for a 4:5 plate on a square. bg.y is a fraction of
  // max(slack, H/4) (bgBox), so the exact edge is slack / that, not ±1. Unloaded pictures are taken as 9:16.
  const im = getImg(b.bg), ratio = im && im.naturalWidth ? im.naturalHeight / im.naturalWidth : 16 / 9;
  const slack = Math.max(0, (fr.w * ratio - fr.h) / 2);
  const y = b.anchor && slack > 0 ? (b.anchor === 'bottom' ? -1 : 1) * slack / Math.max(slack, fr.h * .25) : 0;
  d.bg = { ...d.bg, type: 'image', image: b.bg, fit: 'fill', scale: 1, x: 0, y, blur: 0, bright: 1, sat: 1, pad: RTS.ink };
  d.overlay = { type: b.scrim ? 'scrim' : 'none', color: '#0c0905', opacity: b.scrim || 0 };
  d.layers = withSize(fr, () => adLayers({ ...copy, layout: b.layout }));
  d.ad = { set: AD_SET, rev: AD_LAYOUT, key: `${set.key}:${b.id}:${frame}`, setKey: set.key, id: b.id, name: copy.name || b.id, layout: b.layout || 'cover', frame, ver: set.ver || '01', flag: b.flag || '', pair: b.pair || '', ctaRef: b.ctaRef || '', dir: b.dir || '' };
  return d;
}
async function seedAdSet() {
  const cfg = rtsAds(); if (!cfg.sets || !cfg.sets.length) return false;
  setStatus('loading the static ads…');
  await loadAdFonts();
  const have = new Set(covers.filter(c => c.doc && c.doc.ad).map(c => c.doc.ad.key));
  await preloadAssets([...new Set(cfg.sets.flatMap(s => s.boards.map(b => b.bg))), 'rtsMark', 'rtsShinbukan', 'rtsSeizanji']);
  // boards laid out by an earlier adLayers are laid out again from their own copy (see relayAd)
  const relaid = covers.filter(c => c.doc && c.doc.ad && c.doc.ad.rev !== AD_LAYOUT);
  for (const c of relaid) { try { relayAd(c.doc); } catch (e) { console.warn('re-lay', c.doc.ad.id, e); } }
  if (relaid.length) await store.saveCovers(relaid);
  // stamped older than the covers, so the studio still opens on the latest cover
  let t = Math.min(Date.now(), ...covers.map(c => c.createdAt || Date.now())) - 72e5;
  const recs = [];
  for (const set of cfg.sets) for (const b of set.boards) {
    if (have.has(`${set.key}:${b.id}:4x5`)) continue;          // an edited board is never rebuilt
    const s = adSource(set.key, b.id);
    const d = adDoc(set, { layout: s.layout || 'cover', ...b }, '4x5', { name: s.name || b.id, kicker: s.kicker, head: s.head, sub: s.sub, line: s.line, cta: s.cta });
    d.createdAt = d.updatedAt = t++; recs.push(coverRecord(d));
  }
  if (recs.length) { await store.saveCovers(recs); covers = covers.concat(recs); }
  settings.adSet = AD_SET; settings.adLayout = AD_LAYOUT; await store.saveSettings(settings).catch(() => {});
  return recs.length > 0;
}
/* The first v3 boards set their CTA line upright; the line is italic now, like every other small line on
   the boards. Re-lay just the boards still carrying an upright line (edited words are kept, see relayAd). */
async function fixAdLines() {
  const stale = covers.filter(c => c.doc && c.doc.ad && (c.doc.layers || []).some(l => l.role === 'line' && !l.italic));
  if (stale.length) {
    if (!(await adFontsReady())) return;   // try again on the next visit rather than lay out on a fallback face
    await preloadAssets(['rtsMark', 'rtsShinbukan', 'rtsSeizanji']);
    for (const c of stale) { try { relayAd(c.doc); } catch (e) { console.warn('re-lay line', c.doc.ad.id, e); } }
    await store.saveCovers(stale);
  }
  settings.adLines = 2; await store.saveSettings(settings).catch(() => {});
}

/* ---------------- the static ads view ---------------- */
const adIdKey = id => String(id).replace(/\d+/g, m => m.padStart(3, '0'));
const adFrameRank = f => Object.keys(AD_FRAMES).indexOf(f);
/* The submission set (final.js) sits first; then the sets in ads.js order; then anything else (imported). Inside a
   set a board with a hand-set `ad.order` (from a drag) comes before the rest, which keep id order. */
const FINAL_KEY = 'final';
const rtsFinal = () => window.__RTS_FINAL__ || { key: FINAL_KEY, set: '', title: 'FINAL ADS SUBMISSION', boards: [] };
const adOrderOf = a => (typeof a.order === 'number' ? a.order : 1e9);
function adSetMeta(setKey) {
  const cfg = rtsAds(), m = (cfg.sets || []).find(s => s.key === setKey);
  if (m) return m;
  if (setKey === FINAL_KEY) { const f = rtsFinal(); return { key: FINAL_KEY, title: f.title || 'FINAL ADS SUBMISSION', note: f.note || '', ver: '01', final: true }; }
  if (setKey === 'imported') return { key: 'imported', title: 'Imported boards', note: 'Pictures broken down into layers with Break down a picture. Each board is an ordinary editable ad.', ver: '01' };
  return { key: setKey, title: `Static set ${setKey}`, ver: '01' };
}
function adGroups() {
  const cfg = rtsAds(), order = new Map((cfg.sets || []).map((s, i) => [s.key, i + 1])); order.set(FINAL_KEY, 0);
  const by = new Map();
  for (const c of covers) {
    const a = c.doc && c.doc.ad; if (!a) continue;
    let g = by.get(a.setKey);
    if (!g) {
      const meta = adSetMeta(a.setKey);
      by.set(a.setKey, g = { key: a.setKey, title: meta.title, date: meta.date || '', note: meta.note || '', ver: meta.ver || a.ver || '01', final: !!meta.final, boards: [] });
    }
    g.boards.push(c);
  }
  for (const g of by.values()) g.boards.sort((x, y) => adOrderOf(x.doc.ad) - adOrderOf(y.doc.ad) || adIdKey(x.doc.ad.id).localeCompare(adIdKey(y.doc.ad.id)) || adFrameRank(x.doc.ad.frame) - adFrameRank(y.doc.ad.frame));
  return [...by.values()].sort((x, y) => (order.has(x.key) ? order.get(x.key) : 99) - (order.has(y.key) ? order.get(y.key) : 99));
}
/* Every set a board can be moved to: the ones on the tab, plus the submission set even before it has a board. */
function adSetChoices() { const g = adGroups().map(x => ({ key: x.key, title: x.title })); if (!g.some(x => x.key === FINAL_KEY)) g.unshift({ key: FINAL_KEY, title: adSetMeta(FINAL_KEY).title }); return g; }
/* Move boards into a set, before `beforeId` (or at the end), and write the order of the whole target set. A moved
   board keeps its id and its ad.key, so the seeders still see it as present and never rebuild it in its old set. */
async function moveToSet(recs, setKey, beforeId) {
  recs = recs.filter(r => isAd(r.doc)); if (!recs.length) return;
  const moving = new Set(recs.map(r => r.id));
  const cur = (adGroups().find(g => g.key === setKey) || { boards: [] }).boards.filter(r => !moving.has(r.id));
  let at = beforeId ? cur.findIndex(r => r.id === beforeId) : -1; if (at < 0) at = cur.length;
  const seq = [...cur.slice(0, at), ...recs, ...cur.slice(at)];
  seq.forEach((r, i) => { const d = r.id === doc?.id ? doc : r.doc; d.ad = { ...d.ad, setKey, order: i }; if (r.id === doc?.id) r.doc = JSON.parse(JSON.stringify(doc)); r.updatedAt = d.updatedAt = Date.now(); });
  await store.saveCovers(seq);
  const to = adSetMeta(setKey).title;
  renderAds(); renderCoverList(); toast(recs.length === 1 ? `${recs[0].doc.ad.id} → ${to}` : `${recs.length} boards → ${to}`);
}
/* The submission set: one board per picture in final.js, the picture as the whole board. Only boards whose key is
   missing are added, so an edited, moved or deleted one is never brought back (bump `set` in final.js to add new pictures). */
const FINAL_SET = (window.__RTS_FINAL__ || {}).set || '';
async function seedFinalSet() {
  const f = rtsFinal(); if (!f.boards || !f.boards.length) return false;
  const have = new Set(covers.filter(c => c.doc && c.doc.ad).map(c => c.doc.ad.key));
  let t = Math.min(Date.now(), ...covers.map(c => c.createdAt || Date.now())) - 36e5;
  const recs = [];
  f.boards.forEach((b, i) => {
    const key = `${FINAL_KEY}:${b.id}:4x5`; if (have.has(key)) return;
    const d = baseDoc(`Static ${b.id} · ${b.name}`); d.w = 1080; d.h = 1350;
    d.subject = { ...d.subject, on: false }; d.grain = 0;
    d.bg = { ...d.bg, type: 'image', image: b.id, fit: 'fill', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1, pad: RTS.ink };
    d.overlay = { type: 'none', color: '#0c0905', opacity: 0 };
    d.layers = [];
    d.ad = { set: FINAL_SET, rev: AD_LAYOUT, key, setKey: FINAL_KEY, id: b.id, name: b.name, layout: 'photo', frame: '4x5', ver: '01', flag: '', pair: '', ctaRef: '', dir: b.src ? `From Downloads · ${b.src}` : '', order: i };
    d.createdAt = d.updatedAt = t++; recs.push(coverRecord(d));
  });
  if (recs.length) { await store.saveCovers(recs); covers = covers.concat(recs); }
  settings.finalSet = FINAL_SET; await store.saveSettings(settings).catch(() => {});
  return recs.length > 0;
}
let adFilter = 'all';
function renderAds() {
  const wrap = $('#adList'); if (!wrap) return;
  wrap.innerHTML = '';
  const all = adGroups();
  $('#adEmpty').hidden = all.length > 0;
  const flagged = all.reduce((k, g) => k + g.boards.filter(r => r.doc.ad.flag).length, 0);
  const chips = [['all', 'All sets', all.reduce((k, g) => k + g.boards.length, 0)]]
    .concat(all.map(g => [g.key, g.title.replace(/ — .*$/, ''), g.boards.length]))
    .concat(flagged ? [['flag', 'Needs sign-off', flagged]] : []);
  if (!chips.some(c => c[0] === adFilter)) adFilter = 'all';
  const cc = $('#adChips'); cc.innerHTML = '';
  chips.forEach(([v, label, n]) => {
    const b = document.createElement('button'); b.className = 'chip'; b.type = 'button';
    b.setAttribute('aria-pressed', v === adFilter); b.innerHTML = `${escapeHtml(label)}<i>${n}</i>`;
    b.onclick = () => { adFilter = v; renderAds(); };
    cc.appendChild(b);
  });
  const og = $('#adOrg'); if (og) { og.innerHTML = ''; og.appendChild(orgBar('ads')); }
  const of = orgFilter('ads');
  all.filter(g => adFilter === 'all' || adFilter === 'flag' || g.key === adFilter)
    .map(g => adFilter === 'flag' ? { ...g, boards: g.boards.filter(r => r.doc.ad.flag) } : g)
    .map(g => orgActive(of) ? { ...g, boards: g.boards.filter(r => orgMatch(r, of)) } : g)
    .filter(g => g.boards.length)
    .forEach(g => wrap.appendChild(adCard(g)));
}
function adCard(g) {
  const el = document.createElement('article'); el.className = 'pcard acard'; el.dataset.set = g.key;
  const head = document.createElement('header'), meta = document.createElement('div');
  meta.innerHTML = `<span class="kicker">${g.final ? `${g.boards.length} board${g.boards.length === 1 ? '' : 's'} · in the order shown` : `${escapeHtml(g.date)}${g.date ? ' · ' : ''}exports as v${escapeHtml(g.ver)}`}</span>`
    + `<h3>${escapeHtml(g.title)}${g.final ? '<em>CLIENT SUBMISSION</em>' : ''}</h3>`
    + (g.note ? `<p class="insight">${escapeHtml(g.note)}</p>` : '');
  const acts = document.createElement('div'); acts.className = 'acts';
  acts.innerHTML = `<button class="small${g.final ? ' primary' : ''}">${g.final ? 'Export submission' : 'Export set'}</button>`
    + (g.final ? '<button class="small ghost">Submission CTA</button>' : '')
    + '<button class="small ghost">+ Board</button>';
  const btns = $$('button', acts); const exp = btns.shift();
  if (g.final) {
    const cta = btns.shift();
    cta.title = 'One call to action across every board in the submission';
    cta.onclick = async () => {
      const t = (prompt('The call to action on every board in the submission:', settings.finalCtaText || FINAL_CTA) || '').trim();
      if (!t) return;
      const n = await applyFinalCta(t);
      toast(n ? `“${t}” is on ${n} board${n === 1 ? '' : 's'}` : 'No board in the set carries a call to action');
    };
  }
  const add = btns.shift();
  exp.onclick = () => exportAdSet(g); add.onclick = () => newAdBoard(g);
  head.append(meta, acts); el.appendChild(head);
  if (g.final) el.classList.add('final');
  // a board dragged onto the card (its header, or the space after the tiles) joins this set at the end
  el.addEventListener('dragover', e => { if (!dtHasRcs(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; el.classList.add('dropin'); });
  el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) el.classList.remove('dropin'); });
  el.addEventListener('drop', e => { if (!dtHasRcs(e)) return; e.preventDefault(); e.stopPropagation(); el.classList.remove('dropin'); $$('.pslide.dropbefore', el).forEach(x => x.classList.remove('dropbefore')); let ids = []; try { ids = JSON.parse(e.dataTransfer.getData('text/rcs')); } catch {} const before = e.target.closest('.pslide.ad'); moveToSet(ids.map(recOf).filter(Boolean), g.key, before ? before.dataset.id : null); });
  const row = document.createElement('div'); row.className = 'pslides';
  const frames = new Map();
  g.boards.forEach(r => { const a = r.doc.ad; if (!frames.has(a.id)) frames.set(a.id, new Set()); frames.get(a.id).add(a.frame); });
  g.boards.forEach(r => row.appendChild(adTile(r, frames.get(r.doc.ad.id))));
  el.appendChild(row);
  return el;
}
function adTile(r, have) {
  const a = r.doc.ad, live = r.id === doc?.id ? doc : r.doc, fr = AD_FRAMES[a.frame] || AD_FRAMES['4x5'];
  const el = document.createElement('div'); el.className = 'pslide ad'; el.setAttribute('aria-current', r.id === doc?.id); el.dataset.id = r.id;
  const b = document.createElement('button'); b.className = 'tile'; b.type = 'button'; b.title = `Open ${a.id} (${fr.label}) in the editor`;
  b.appendChild(lazyCanvas(live, 158));
  const no = document.createElement('span'); no.className = 'no'; no.textContent = a.frame === '4x5' ? a.id : `${a.id} · ${a.frame.replace('x', ':')}`; b.appendChild(no);
  b.onclick = () => { loadDoc(live); switchView('editor'); };
  const cap = document.createElement('div'); cap.className = 'cap';
  cap.innerHTML = `<b>${escapeHtml(fr.label)}${a.pair ? ' · with ' + escapeHtml(a.pair) : ''}${a.ctaRef ? ' · ' + escapeHtml(a.ctaRef) : ''}</b>${escapeHtml(a.name)}`
    + (a.dir ? `<span class="dir">${escapeHtml(a.dir)}</span>` : '')
    + (a.flag ? `<span class="flag">~ ${escapeHtml(a.flag)}</span>` : '');
  el.append(b, cap); orgDecor(el, r, 'ads');
  el.addEventListener('dragover', e => { if (!dtHasRcs(e)) return; $$('.pslide.dropbefore').forEach(x => { if (x !== el) x.classList.remove('dropbefore'); }); el.classList.add('dropbefore'); });
  el.addEventListener('dragleave', e => { if (!el.contains(e.relatedTarget)) el.classList.remove('dropbefore'); });
  if (a.frame === '4x5' && a.layout !== 'photo') {
    const vars = document.createElement('div'); vars.className = 'vars';
    for (const [k, f] of Object.entries(AD_FRAMES)) {
      if (k === '4x5' || (have && have.has(k))) continue;
      const v = document.createElement('button'); v.className = 'small ghost'; v.type = 'button'; v.textContent = '+ ' + f.label;
      v.title = `Make a ${f.label} version of ${a.id} with the same copy`;
      v.onclick = () => addAdVariant(r, k);
      vars.appendChild(v);
    }
    if (vars.children.length) el.appendChild(vars);
  }
  return el;
}
const adFile = d => `Static ${d.ad.id} - ${d.ad.name} - ${d.ad.frame} v${d.ad.ver}`.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim();
const adDocs = g => g.boards.map(r => r.id === doc?.id ? doc : r.doc);
async function exportAdSet(g) {
  if (!g.boards.length) return;
  setStatus('rendering…'); toast(`Rendering ${g.boards.length} boards…`);
  await loadAdFonts(); await awaitSlidePhotos(adDocs(g));
  const zip = new JSZip();
  const docs = adDocs(g);
  for (let i = 0; i < docs.length; i++) { const d = docs[i]; zip.file(g.final ? `${String(i + 1).padStart(2, '0')} - ${d.ad.name.replace(/[\\/:*?"<>|]+/g, '').trim()}.png` : `${adFile(d)}.png`, await renderBlob(d, 1)); }
  const ok = await store.download(g.final ? `FINAL ADS SUBMISSION - ${new Date().toISOString().slice(0, 10)}.zip` : `static-set-${g.key}-${new Date().toISOString().slice(0, 10)}.zip`, await zip.generateAsync({ type: 'blob' }));
  setStatus('saved · this browser', 'ok'); toast(ok ? `${g.boards.length} boards exported` : 'Export cancelled');
}
async function exportAllAds() {
  const all = adGroups(); if (!all.length) return toast('No static ads yet');
  const n = all.reduce((k, g) => k + g.boards.length, 0);
  setStatus('rendering…'); toast(`Rendering ${n} boards…`);
  await loadAdFonts();
  for (const g of all) await awaitSlidePhotos(adDocs(g));
  const zip = new JSZip();
  for (const g of all) for (const d of adDocs(g)) zip.file(`${g.key}/${adFile(d)}.png`, await renderBlob(d, 1));
  const ok = await store.download(`static-ads-${new Date().toISOString().slice(0, 10)}.zip`, await zip.generateAsync({ type: 'blob' }));
  setStatus('saved · this browser', 'ok'); toast(ok ? `${n} boards exported` : 'Export cancelled');
}
/* A square or story version of a board: the same copy and the same picture
   (including a swapped one), laid out again on the new frame. */
async function addAdVariant(r, frame) {
  const src = r.id === doc?.id ? doc : r.doc, a = src.ad;
  const key = `${a.setKey}:${a.id}:${frame}`;
  const exists = covers.find(c => c.doc && c.doc.ad && c.doc.ad.key === key);
  if (exists) { loadDoc(exists.doc); switchView('editor'); return; }
  const set = rtsAds().sets.find(s => s.key === a.setKey) || { key: a.setKey, ver: a.ver };
  const cfg = adBoardCfg(a.setKey, a.id) || {};
  const im = getImg(src.bg.image), fr = AD_FRAMES[frame];
  // a picture taller than the new frame keeps the end the board was showing (its plate's anchor, or the way
  // it was dragged); a 4:5 plate on a square keeps its top, where the faces and the drawings are
  const ratio = im && im.naturalWidth ? im.naturalHeight / im.naturalWidth : 16 / 9;
  const anchor = ratio <= fr.h / fr.w + 0.01 ? '' : src.bg.image === cfg.bg && cfg.anchor ? cfg.anchor : ratio > 1.7 ? (src.bg.y < 0 ? 'bottom' : 'top') : 'top';
  const scrim = src.overlay && src.overlay.type === 'scrim' ? src.overlay.opacity : 0;
  await loadAdFonts();
  const d = adDoc(set, { ...cfg, id: a.id, layout: a.layout, flag: a.flag, pair: a.pair, ctaRef: a.ctaRef, dir: a.dir, bg: src.bg.image, anchor, scrim }, frame, adCopyOf(src));
  d.bg = { ...d.bg, bright: src.bg.bright, sat: src.bg.sat, blur: src.bg.blur };
  d.createdAt = d.updatedAt = Date.now();
  const rec = coverRecord(d); covers.push(rec); await store.saveCovers([rec]);
  renderAds(); toast(`${fr.label} version of ${a.id} added`);
}
/* A blank board in a set, on the calm frontal still, ready to write. */
async function newAdBoard(g) {
  const set = rtsAds().sets.find(s => s.key === g.key) || { key: g.key, ver: g.ver };
  const used = new Set(covers.filter(c => c.doc && c.doc.ad).map(c => c.doc.ad.id));
  let n = 1; while (used.has(`N${n}`)) n++;
  await loadAdFonts();
  const d = adDoc(set, { id: `N${n}`, layout: 'cover', bg: BUILTIN.d1s47 ? 'd1s47' : 'rtsA41', anchor: 'bottom', scrim: 0.95 }, '4x5',
    { name: 'New board', kicker: 'Return to Self', head: 'Your headline here.', sub: 'One line underneath it.', cta: 'See how the 12 weeks work' });
  d.ad.key = `${g.key}:N${n}:x${uid()}`;      // hand-made, so re-seeding can never touch it
  d.createdAt = d.updatedAt = Date.now();
  const rec = coverRecord(d); covers.push(rec); await store.saveCovers([rec]);
  adFilter = 'all'; renderAds(); toast('Board added — open it to write it');
}
$('#btnExportAds').onclick = () => exportAllAds();

/* ---------------- organiser ----------------
   Albums, favourites and colour labels over every document in the studio —
   covers, carousel slides and static ad boards alike — plus delete, duplicate
   and multi-select straight from a tile. The marks live on the RECORD
   (rec.fav / rec.album / rec.label), not the document, so restoring an old
   version or pasting a doc never moves a board out of its album; persistCurrent
   only rewrites name, time and doc, and Back up / Restore carry the records as
   they are. Albums and label names live in settings.
   Each tab keeps its own filter (ORG.f[scope]); the selection is shared, so a
   Shift+click in one place and a Delete in another act on the same set. */
const ALBUM_COLORS = ['#d9a441', '#7fb3a6', '#e07a6a', '#8fb6d9', '#b48ead', '#7cc08a', '#e9d9b5', '#c48a5a'];
const LABELS = [['red', '#e07a6a', 'Redo'], ['amber', '#d9a441', 'Review'], ['green', '#7cc08a', 'Approved'], ['teal', '#7fb3a6', 'Hero'], ['blue', '#8fb6d9', 'Idea'], ['purple', '#b48ead', 'Client'], ['grey', '#8c8377', 'Archive']];
const labelHex = id => (LABELS.find(l => l[0] === id) || [])[1] || '#8c8377';
const labelName = id => (settings.labelNames || {})[id] || (LABELS.find(l => l[0] === id) || [])[2] || id;
const ORG = { f: { covers: {}, posts: {}, ads: {} }, sel: new Set(), selectMode: false };
const albums = () => Array.isArray(settings.albums) ? settings.albums : (settings.albums = []);
const albumOf = id => albums().find(a => a.id === id) || null;
const ORG_SCOPE = { covers: r => !isFeed(r.doc), posts: r => isPost(r.doc), ads: r => isAd(r.doc) };
const orgItems = scope => covers.filter(ORG_SCOPE[scope] || (() => true));
const orgFilter = scope => ORG.f[scope] || (ORG.f[scope] = {});
const orgMatch = (r, f) => !(f.fav && !r.fav) && !(f.album && r.album !== f.album) && !(f.label && r.label !== f.label);
const orgActive = f => !!(f.fav || f.album || f.label);
const orgNoun = (scope, n) => scope === 'ads' ? (n === 1 ? 'board' : 'boards') : scope === 'posts' ? (n === 1 ? 'slide' : 'slides') : (n === 1 ? 'cover' : 'covers');
const recOf = id => covers.find(c => c.id === id);
const orgScopeOf = r => isAd(r.doc) ? 'ads' : isPost(r.doc) ? 'posts' : 'covers';
function orgSave(recs) { return store.saveCovers(recs).catch(e => console.warn(e)); }
/* Re-draw whichever lists are showing. The editor rail always is. */
function orgRerender() {
  renderCoverList();
  if ($('#view-posts').classList.contains('active')) renderPosts();
  if ($('#view-ads').classList.contains('active')) renderAds();
  if ($('#view-grid').classList.contains('active')) renderGrid();
  orgPaintSel();   // the body's select state follows the selection, which a delete may just have emptied
}
async function setFav(recs, on) { recs.forEach(r => { r.fav = !!on; }); await orgSave(recs); orgRerender(); }
async function setLabel(recs, id) { recs.forEach(r => { if (id) r.label = id; else delete r.label; }); await orgSave(recs); orgRerender(); }
async function moveToAlbum(recs, id) {
  recs.forEach(r => { if (id) r.album = id; else delete r.album; }); await orgSave(recs); orgRerender();
  const a = albumOf(id); toast(recs.length === 1 ? (a ? `Moved to ${a.name}` : 'Taken out of its album') : (a ? `${recs.length} moved to ${a.name}` : `${recs.length} taken out of their albums`));
}
function newAlbum(scope) {
  const name = (prompt('Name the album') || '').trim(); if (!name) return null;
  const a = { id: 'al' + uid(), name, color: ALBUM_COLORS[albums().length % ALBUM_COLORS.length], at: Date.now() };
  albums().push(a); saveSettingsSoon(); if (scope) { orgFilter(scope).album = a.id; } orgRerender(); return a;
}
function renameAlbum(a) { const n = (prompt('Rename the album', a.name) || '').trim(); if (!n) return; a.name = n; saveSettingsSoon(); orgRerender(); }
async function deleteAlbum(a) {
  const inside = covers.filter(r => r.album === a.id);
  if (!confirm(`Delete the album “${a.name}”?${inside.length ? ` Its ${inside.length} item${inside.length === 1 ? '' : 's'} stay in the studio, just out of the album.` : ''}`)) return;
  inside.forEach(r => delete r.album); if (inside.length) await orgSave(inside);
  settings.albums = albums().filter(x => x.id !== a.id); Object.values(ORG.f).forEach(f => { if (f.album === a.id) delete f.album; });
  saveSettingsSoon(); orgRerender();
}
/* Delete any documents at once. A carousel that loses slides is renumbered; the grid order is
   pruned; an open document that goes is replaced by the newest cover left. */
async function deleteRecs(ids, quiet) {
  ids = [...new Set(ids)].filter(recOf); if (!ids.length) return false;
  const recs = ids.map(recOf), scopes = new Set(recs.map(orgScopeOf));
  const what = scopes.size === 1 ? orgNoun([...scopes][0], ids.length) : (ids.length === 1 ? 'item' : 'items');
  if (!quiet && !confirm(ids.length === 1 ? `Delete “${recs[0].name}”?` : `Delete ${ids.length} ${what}? This cannot be undone.`)) return false;
  const gone = new Set(ids), cids = new Set(recs.filter(r => isPost(r.doc)).map(r => r.doc.post.cid));
  for (const id of ids) await store.deleteCover(id).catch(() => {});
  covers = covers.filter(c => !gone.has(c.id));
  settings.gridOrder = (settings.gridOrder || []).filter(x => !gone.has(x)); saveSettingsSoon();
  ids.forEach(id => { ORG.sel.delete(id); picked.delete(id); });
  for (const cid of cids) { const left = covers.filter(c => c.doc?.post?.cid === cid).sort((a, b) => (a.doc.post.slide || 0) - (b.doc.post.slide || 0)); if (left.length) { renumberSlides(left); await orgSave(left); } }
  if (doc && gone.has(doc.id)) { const next = [...covers].filter(c => !isFeed(c.doc)).sort((a, b) => b.updatedAt - a.updatedAt)[0] || covers[0]; if (next) loadDoc(next.doc); else newCover(); }
  orgRerender(); renderPickState();
  toast(ids.length === 1 ? 'Deleted' : `${ids.length} ${what} deleted`);
  return true;
}
/* A copy of one record, kept in the same family: a board stays in its set with a lettered id, a slide
   lands after its original and the carousel is renumbered, a cover is a plain copy. */
async function duplicateRec(r) {
  const src = r.id === doc?.id ? doc : r.doc, d = JSON.parse(JSON.stringify(src));
  d.id = uid(); d.createdAt = d.updatedAt = Date.now();
  if (isAd(d)) {
    const used = new Set(covers.filter(c => isAd(c.doc)).map(c => c.doc.ad.id));
    const base = String(d.ad.id).replace(/[a-z]$/, ''); let sfx = 'b'; while (used.has(base + sfx)) sfx = String.fromCharCode(sfx.charCodeAt(0) + 1);
    d.ad = { ...d.ad, id: base + sfx, key: `${d.ad.setKey}:${base + sfx}:x${uid()}` }; d.name = d.name.replace(/^Static \S+/, `Static ${base + sfx}`);
    const rec = { ...coverRecord(d), fav: r.fav, label: r.label, album: r.album }; covers.push(rec); await orgSave([rec]);
  } else if (isPost(d)) {
    d.post = { ...d.post, key: `${d.post.cid}:x${uid()}` };
    const rec = { ...coverRecord(d), fav: r.fav, label: r.label, album: r.album };
    const sib = covers.filter(c => c.doc?.post?.cid === d.post.cid).sort((a, b) => (a.doc.post.slide || 0) - (b.doc.post.slide || 0));
    const at = sib.findIndex(c => c.id === r.id); sib.splice(at < 0 ? sib.length : at + 1, 0, rec);
    renumberSlides(sib); covers.push(rec); await orgSave(sib);
  } else {
    d.name = r.name + ' copy';
    const rec = { ...coverRecord(d), fav: r.fav, label: r.label, album: r.album }; covers.push(rec); await orgSave([rec]);
    const o = settings.gridOrder || [], i = o.indexOf(r.id); if (i >= 0) { o.splice(i + 1, 0, rec.id); saveSettingsSoon(); }
  }
  orgRerender(); toast('Duplicated');
}
async function exportRecs(recs, label) {
  if (!recs.length) return;
  const scale = +$('#exportScale').value || 1;
  await loadAdFonts(); await awaitSlidePhotos(recs.map(r => r.id === doc?.id ? doc : r.doc));
  if (recs.length === 1) { const r = recs[0], d = r.id === doc?.id ? doc : r.doc, ds = sizeOf(d); await store.download(`${slug(r.name)}-${ds.w * (scale === 'jpg' ? 1 : scale)}x${ds.h * (scale === 'jpg' ? 1 : scale)}.${scale === 'jpg' ? 'jpg' : 'png'}`, await renderBlob(d, scale === 'jpg' ? 1 : scale, scale === 'jpg' ? 'jpg' : 'png')); return toast('Exported'); }
  toast(`Rendering ${recs.length}…`); const zip = new JSZip();
  for (let i = 0; i < recs.length; i++) { const r = recs[i], d = r.id === doc?.id ? doc : r.doc; zip.file(`${String(i + 1).padStart(2, '0')}-${slug(r.name)}.png`, await renderBlob(d, scale === 'jpg' ? 1 : scale)); }
  await store.download(`${label || 'selection'}-${recs.length}.zip`, await zip.generateAsync({ type: 'blob' })); toast(`${recs.length} exported`);
}
/* ---- selection ---- */
function orgToggleSel(id, on) { if (on === undefined) on = !ORG.sel.has(id); if (on) ORG.sel.add(id); else ORG.sel.delete(id); orgPaintSel(); }
function orgClearSel() { ORG.sel.clear(); ORG.selectMode = false; orgPaintSel(); }
function orgPaintSel() {
  $$('[data-org-id]').forEach(el => el.classList.toggle('selected', ORG.sel.has(el.dataset.orgId)));
  $$('.orgbar').forEach(bar => { if (bar._sync) bar._sync(); });
  document.body.classList.toggle('org-select', ORG.selectMode || ORG.sel.size > 0);
}
const selRecs = () => [...ORG.sel].map(recOf).filter(Boolean);
/* ---- popover menu ---- */
let orgMenuEl = null;
function orgMenuClose() { if (orgMenuEl) { orgMenuEl.remove(); orgMenuEl = null; } }
function orgMenu(anchor, items) {
  orgMenuClose();
  const m = document.createElement('div'); m.className = 'orgmenu'; m.setAttribute('role', 'menu');
  items.forEach(it => {
    if (it === '-') { const hr = document.createElement('hr'); m.appendChild(hr); return; }
    if (it.head) { const h = document.createElement('div'); h.className = 'orgmenu__head'; h.textContent = it.head; m.appendChild(h); return; }
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'menuitem'); b.className = it.danger ? 'danger' : ''; b.disabled = !!it.disabled;
    b.innerHTML = (it.dot ? `<i class="dot" style="background:${it.dot}"></i>` : it.icon ? `<i class="ic">${it.icon}</i>` : '<i class="ic"></i>') + `<span>${escapeHtml(it.label)}</span>` + (it.on ? '<b>✓</b>' : '');
    b.onclick = e => { e.stopPropagation(); orgMenuClose(); it.run && it.run(); };
    m.appendChild(b);
  });
  document.body.appendChild(m); orgMenuEl = m;
  const r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight;
  let x = r.right - mw, y = r.bottom + 4; if (x < 8) x = Math.min(r.left, innerWidth - mw - 8); if (y + mh > innerHeight - 8) y = Math.max(8, r.top - mh - 4);
  m.style.left = x + 'px'; m.style.top = y + 'px';
  setTimeout(() => { const off = e => { if (!m.contains(e.target)) { orgMenuClose(); window.removeEventListener('pointerdown', off, true); } }; window.addEventListener('pointerdown', off, true); }, 0);
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') orgMenuClose(); });
/* Items of the ⋯ menu for one record, or for the selection it belongs to. */
function orgMenuItems(recs, opts = {}) {
  const one = recs.length === 1, r = recs[0], allFav = recs.every(x => x.fav), label = one ? r.label : null, album = one ? r.album : null;
  const items = [];
  if (opts.open && one) items.push({ label: 'Open in the editor', icon: '↗', run: () => { loadDoc(r.id === doc?.id ? doc : r.doc); switchView('editor'); } });
  items.push({ label: allFav ? 'Remove from favourites' : 'Add to favourites', icon: allFav ? '★' : '☆', run: () => setFav(recs, !allFav) });
  items.push({ head: 'Label' });
  LABELS.forEach(([id, hex]) => items.push({ label: labelName(id), dot: hex, on: label === id, run: () => setLabel(recs, label === id ? null : id) }));
  if (label) items.push({ label: 'No label', icon: '○', run: () => setLabel(recs, null) });
  items.push({ head: 'Album' });
  albums().forEach(a => items.push({ label: a.name, dot: a.color, on: album === a.id, run: () => moveToAlbum(recs, album === a.id ? null : a.id) }));
  items.push({ label: '+ New album…', icon: '+', run: () => { const a = newAlbum(); if (a) moveToAlbum(recs, a.id); } });
  if (album) items.push({ label: 'Take out of its album', icon: '○', run: () => moveToAlbum(recs, null) });
  if (recs.every(x => isAd(x.doc))) {
    items.push({ head: 'Set' });
    const cur = one ? r.doc.ad.setKey : null;
    adSetChoices().forEach(s => items.push({ label: s.title.replace(/ — .*$/, ''), icon: s.key === FINAL_KEY ? '★' : '▦', on: cur === s.key, disabled: cur === s.key, run: () => moveToSet(recs, s.key) }));
  }
  items.push('-');
  if (one) items.push({ label: 'Duplicate', icon: '⧉', run: () => duplicateRec(r) });
  items.push({ label: one ? 'Export' : `Export ${recs.length}`, icon: '⤓', run: () => exportRecs(recs, one ? slug(r.name) : 'selection') });
  items.push({ label: one ? 'Delete' : `Delete ${recs.length}`, icon: '✕', danger: true, run: () => deleteRecs(recs.map(x => x.id)) });
  return items;
}
/* The corner controls on a tile or row: a star, the label dot and the ⋯ menu. `el` gets the
   selection hooks too — Shift+click (or Select mode) toggles it, and dragging it onto an
   album chip files it. */
function orgDecor(el, r, scope) {
  el.dataset.orgId = r.id; el.classList.toggle('selected', ORG.sel.has(r.id));
  el.classList.toggle('fav', !!r.fav);
  if (r.label) { el.dataset.label = r.label; el.style.setProperty('--lab', labelHex(r.label)); } else { delete el.dataset.label; el.style.removeProperty('--lab'); }
  const a = albumOf(r.album); if (a) el.style.setProperty('--alb', a.color); else el.style.removeProperty('--alb');
  const acts = document.createElement('div'); acts.className = 'orgacts';
  const star = document.createElement('button'); star.type = 'button'; star.className = 'star'; star.title = r.fav ? 'Remove from favourites' : 'Add to favourites'; star.textContent = r.fav ? '★' : '☆'; star.setAttribute('aria-pressed', !!r.fav);
  star.onclick = e => { e.stopPropagation(); e.preventDefault(); setFav([r], !r.fav); };
  const more = document.createElement('button'); more.type = 'button'; more.className = 'more'; more.title = 'Label, album, duplicate, delete'; more.textContent = '⋯';
  more.onclick = e => { e.stopPropagation(); e.preventDefault(); const recs = ORG.sel.has(r.id) && ORG.sel.size > 1 ? selRecs() : [r]; orgMenu(more, orgMenuItems(recs, { open: true })); };
  const tick = document.createElement('button'); tick.type = 'button'; tick.className = 'tick'; tick.title = 'Select'; tick.textContent = '✓';
  tick.onclick = e => { e.stopPropagation(); e.preventDefault(); ORG.selectMode = true; orgToggleSel(r.id); };
  acts.append(tick, star, more); el.appendChild(acts);
  if (r.label || a) { const tag = document.createElement('div'); tag.className = 'orgtag'; if (a) { const s = document.createElement('span'); s.className = 'alb'; s.textContent = a.name; s.title = 'Album'; tag.appendChild(s); } if (r.label) { const s = document.createElement('span'); s.className = 'lab'; s.title = 'Label'; s.textContent = labelName(r.label); tag.appendChild(s); } el.appendChild(tag); }
  el.addEventListener('click', e => { if (e.shiftKey || (ORG.selectMode && !e.target.closest('.orgacts'))) { e.stopImmediatePropagation(); e.preventDefault(); orgToggleSel(r.id); } }, true);
  el.addEventListener('contextmenu', e => { e.preventDefault(); const recs = ORG.sel.has(r.id) && ORG.sel.size > 1 ? selRecs() : [r]; orgMenu(e.target.closest('[data-org-id]') || el, orgMenuItems(recs, { open: true })); });
  if (!el.draggable) { el.draggable = true; }
  el.addEventListener('dragstart', e => { const ids = ORG.sel.has(r.id) ? [...ORG.sel] : [r.id]; e.dataTransfer.setData('text/rcs', JSON.stringify(ids)); e.dataTransfer.effectAllowed = 'move'; el.classList.add('dragging'); document.body.classList.add('org-drag'); });
  el.addEventListener('dragend', () => { el.classList.remove('dragging'); document.body.classList.remove('org-drag'); });
}
const dtHasRcs = e => [...(e.dataTransfer ? e.dataTransfer.types : [])].includes('text/rcs');
function orgDropTarget(chip, albumId) {
  chip.addEventListener('dragover', e => { if (!dtHasRcs(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; chip.classList.add('drop'); });
  chip.addEventListener('dragleave', () => chip.classList.remove('drop'));
  chip.addEventListener('drop', e => { if (!dtHasRcs(e)) return; e.preventDefault(); chip.classList.remove('drop'); let ids = []; try { ids = JSON.parse(e.dataTransfer.getData('text/rcs')); } catch {} const recs = ids.map(recOf).filter(Boolean); if (recs.length) moveToAlbum(recs, albumId); });
}
/* The filter rail for a tab: favourites, the albums (drop targets), the labels, Select, and — while
   anything is selected — the actions for the lot. `compact` is the editor rail's narrow form. */
function orgBar(scope, compact) {
  const f = orgFilter(scope), items = orgItems(scope), bar = document.createElement('div'); bar.className = 'orgbar' + (compact ? ' compact' : ''); bar.dataset.scope = scope;
  const row = document.createElement('div'); row.className = 'orgrow';
  const chip = (label, on, n, run, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip ' + (cls || ''); b.setAttribute('aria-pressed', !!on); b.innerHTML = escapeHtml(label) + (n != null ? `<i>${n}</i>` : ''); b.onclick = run; return b; };
  const nFav = items.filter(r => r.fav).length;
  row.appendChild(chip('All', !orgActive(f), items.length, () => { ORG.f[scope] = {}; orgRerender(); }));
  row.appendChild(chip('★ Favourites', f.fav, nFav, () => { f.fav = !f.fav; orgRerender(); }, 'fav'));
  albums().forEach(a => {
    const n = items.filter(r => r.album === a.id).length, on = f.album === a.id;
    const c = chip(a.name, on, n, () => { f.album = on ? null : a.id; if (!f.album) delete f.album; orgRerender(); }, 'alb'); c.style.setProperty('--alb', a.color);
    c.title = `Album · drop tiles here to file them${on ? ' · right-click to rename or delete' : ''}`;
    c.oncontextmenu = e => { e.preventDefault(); orgMenu(c, [{ head: a.name }, { label: 'Rename', icon: '✎', run: () => renameAlbum(a) }, { head: 'Colour' }, ...ALBUM_COLORS.map(h => ({ label: h === a.color ? 'This colour' : ' ', dot: h, on: h === a.color, run: () => { a.color = h; saveSettingsSoon(); orgRerender(); } })), '-', { label: 'Delete album', icon: '✕', danger: true, run: () => deleteAlbum(a) }]); };
    orgDropTarget(c, a.id); row.appendChild(c);
  });
  const plus = chip('+ Album', false, null, () => newAlbum(scope), 'ghostchip'); plus.title = 'Make an album, then drag tiles onto it'; row.appendChild(plus);
  const unfiled = document.createElement('span'); unfiled.className = 'chip drop-out'; unfiled.textContent = 'out of album'; unfiled.title = 'Drop a tile here to take it out of its album'; orgDropTarget(unfiled, null); row.appendChild(unfiled);
  const labs = document.createElement('span'); labs.className = 'orglabels'; labs.title = 'Labels · click to filter · double-click to rename';
  LABELS.forEach(([id, hex]) => { const n = items.filter(r => r.label === id).length; const b = document.createElement('button'); b.type = 'button'; b.className = 'labdot'; b.style.setProperty('--lab', hex); b.setAttribute('aria-pressed', f.label === id); b.title = `${labelName(id)}${n ? ` · ${n}` : ''}`; b.innerHTML = n ? `<i>${n}</i>` : ''; b.onclick = () => { f.label = f.label === id ? null : id; if (!f.label) delete f.label; orgRerender(); }; b.ondblclick = e => { e.preventDefault(); const nm = (prompt(`Name for the ${id} label`, labelName(id)) || '').trim(); if (!nm) return; settings.labelNames = { ...(settings.labelNames || {}), [id]: nm }; saveSettingsSoon(); orgRerender(); }; labs.appendChild(b); });
  row.appendChild(labs);
  const selBtn = chip('Select', ORG.selectMode, null, () => { ORG.selectMode = !ORG.selectMode; if (!ORG.selectMode) ORG.sel.clear(); orgPaintSel(); }, 'selchip'); selBtn.title = 'Tick tiles to act on several at once (or Shift+click them)'; row.appendChild(selBtn);
  bar.appendChild(row);
  const acts = document.createElement('div'); acts.className = 'orgsel'; bar.appendChild(acts);
  bar._sync = () => {
    selBtn.setAttribute('aria-pressed', ORG.selectMode || ORG.sel.size > 0);
    const recs = selRecs(); acts.innerHTML = ''; acts.hidden = !recs.length; if (!recs.length) return;
    const n = document.createElement('b'); n.textContent = `${recs.length} selected`; acts.appendChild(n);
    const mk = (label, run, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'small ' + (cls || ''); b.textContent = label; b.onclick = run; acts.appendChild(b); return b; };
    const allFav = recs.every(r => r.fav); mk(allFav ? '☆ Unfavourite' : '★ Favourite', () => setFav(recs, !allFav));
    const lb = mk('Label ▾', () => orgMenu(lb, [{ head: 'Label' }, ...LABELS.map(([id, hex]) => ({ label: labelName(id), dot: hex, run: () => setLabel(recs, id) })), { label: 'No label', icon: '○', run: () => setLabel(recs, null) }]));
    const mv = mk('Move to ▾', () => orgMenu(mv, [{ head: 'Album' }, ...albums().map(a => ({ label: a.name, dot: a.color, run: () => moveToAlbum(recs, a.id) })), { label: '+ New album…', icon: '+', run: () => { const a = newAlbum(); if (a) moveToAlbum(recs, a.id); } }, { label: 'Out of album', icon: '○', run: () => moveToAlbum(recs, null) }]));
    mk('Export', () => exportRecs(recs, scope));
    mk('Delete', () => deleteRecs(recs.map(r => r.id)), 'danger');
    mk('Clear', () => orgClearSel(), 'ghost');
  };
  bar._sync();
  return bar;
}
/* Delete or Escape on a selection, from any tab. The editor's own key handling runs only there and only
   on a layer, so this never fights it. */
window.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName; if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (!ORG.sel.size) return;
  if (e.key === 'Escape') { orgClearSel(); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && (!$('#view-editor').classList.contains('active') || !sel)) { e.preventDefault(); deleteRecs([...ORG.sel]); }
});

/* ---------------- deconstruct: a picture → layers ----------------
   "Break down a picture": a finished poster, ad or screenshot comes apart into
   the things the editor already knows — text layers (read off the pixels with
   Tesseract, on-device once the library has loaded), the subject as a cutout
   (MediaPipe, the same model the Cutout tab uses), marks and rules sitting on
   flat ground as logo / rule layers — and what is left, with every element
   patched out, becomes the background plate. Everything the analysis finds is
   listed and can be left out before the layers are built; nothing is uploaded.
   All analysis coordinates are in "source space": the picture as loaded, capped
   at 2400 px on its long side like every other upload. */
const TESS_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
const DEC = { img: null, name: '', res: null, target: 'auto', plate: 'keep', busy: false, hover: null, view: null, tess: null };
const DEC_KIND = { text: { c: '#d9a441', k: 'TEXT' }, subject: { c: '#7fb3a6', k: 'CUT' }, mark: { c: '#e07a6a', k: 'MARK' }, rule: { c: '#8fb6d9', k: 'RULE' } };
function loadScript(url) { return new Promise((res, rej) => { if ([...document.scripts].some(s => s.src === url)) return res(); const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = () => rej(new Error('script failed: ' + url)); document.head.appendChild(s); }); }
async function decTesseract(onProgress) {
  if (DEC.tess) return DEC.tess;
  await withTimeout(loadScript(TESS_URL), 20000);
  if (typeof Tesseract === 'undefined') throw new Error('Tesseract missing');
  DEC.tess = await withTimeout(Tesseract.createWorker('eng', 1, { logger: m => { if (onProgress && m && typeof m.progress === 'number') onProgress(m); } }), 90000);
  return DEC.tess;
}
const decStatus = (t, cls) => { const el = $('#deconStatus'); if (el) { el.textContent = t; el.className = 'decon__status mono' + (cls ? ' ' + cls : ''); } };
/* ---- pixel helpers (RGBA Uint8ClampedArray, index by pixel) ---- */
const px = (d, i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
const cdist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const toHex = c => '#' + c.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function medianColor(list) { if (!list.length) return null; const ch = k => { const a = list.map(c => c[k]).sort((x, y) => x - y); return a[a.length >> 1]; }; return [ch(0), ch(1), ch(2)]; }
function median(a) { if (!a.length) return 0; a = a.slice().sort((x, y) => x - y); return a[a.length >> 1]; }
/* Grow a 0/1 mask by r pixels (square). */
function dilate(m, w, h, r) {
  if (!r) return m; const t = new Uint8Array(m.length), o = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -r; k <= r && !v; k++) { const xx = x + k; if (xx >= 0 && xx < w && m[y * w + xx]) v = 1; } t[y * w + x] = v; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -r; k <= r && !v; k++) { const yy = y + k; if (yy >= 0 && yy < h && t[yy * w + x]) v = 1; } o[y * w + x] = v; }
  return o;
}
/* Fill the pixels marked in `hole` from their known neighbours, working inwards from the edge
   of each hole (a breadth-first sweep), then soften the fill so no streaks show. Flat ground
   comes back exactly flat; a photo comes back as a smear, which is what sits behind moved
   text well enough. */
function bfsFill(d, w, h, hole) {
  const n = w * h, st = new Uint8Array(n); for (let i = 0; i < n; i++) st[i] = hole[i] ? 0 : 1;   // 1 known, 0 unknown, 2 queued
  const q = new Int32Array(n); let qh = 0, qt = 0;
  const nb4 = [-1, 1, -w, w];
  for (let i = 0; i < n; i++) if (!st[i]) { const x = i % w; for (const o of nb4) { const j = i + o; if (j < 0 || j >= n || (o === -1 && x === 0) || (o === 1 && x === w - 1)) continue; if (st[j] === 1) { st[i] = 2; q[qt++] = i; break; } } }
  while (qh < qt) {
    const i = q[qh++], x = i % w, y = (i / w) | 0; let r = 0, g = 0, b = 0, k = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (st[j] === 1) { r += d[j * 4]; g += d[j * 4 + 1]; b += d[j * 4 + 2]; k++; } }
    if (k) { d[i * 4] = r / k; d[i * 4 + 1] = g / k; d[i * 4 + 2] = b / k; d[i * 4 + 3] = 255; }
    st[i] = 1;
    for (const o of nb4) { const j = i + o; if (j < 0 || j >= n || (o === -1 && x === 0) || (o === 1 && x === w - 1)) continue; if (st[j] === 0) { st[j] = 2; q[qt++] = j; } }
  }
  // two passes of a 3×3 mean over the filled pixels only
  const soft = dilate(hole, w, h, 1);
  for (let pass = 0; pass < 2; pass++) {
    const c = new Uint8ClampedArray(d);
    for (let i = 0; i < n; i++) { if (!soft[i]) continue; const x = i % w, y = (i / w) | 0; let r = 0, g = 0, b = 0, k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = (yy * w + xx) * 4; r += c[j]; g += c[j + 1]; b += c[j + 2]; k++; } d[i * 4] = r / k; d[i * 4 + 1] = g / k; d[i * 4 + 2] = b / k; }
  }
}
/* A big hole (the subject) gets a defocused fill: filled small, blurred hard, then scaled back up. */
function blurFill(SRC, hole) {
  const w = SRC.width, h = SRC.height, k = 4, sw = Math.ceil(w / k), sh = Math.ceil(h / k);
  const small = new ImageData(sw, sh), sd = small.data, shole = new Uint8Array(sw * sh), d = SRC.data;
  // any cell touching the hole counts as hole, so the fill always covers it with margin
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let r = 0, g = 0, b = 0, n = 0, hc = 0; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const xx = x * k + dx, yy = y * k + dy; if (xx >= w || yy >= h) continue; const i = yy * w + xx; if (hole[i]) { hc++; continue; } r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; n++; } const j = (y * sw + x) * 4; if (n) { sd[j] = r / n; sd[j + 1] = g / n; sd[j + 2] = b / n; } sd[j + 3] = 255; shole[y * sw + x] = hc > 0 ? 1 : 0; }
  bfsFill(sd, sw, sh, shole);
  for (let pass = 0; pass < 3; pass++) { const c = new Uint8ClampedArray(sd); const R = 5; for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let r = 0, g = 0, b = 0, n = 0; for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= sh) continue; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx < 0 || xx >= sw) continue; const j = (yy * sw + xx) * 4; r += c[j]; g += c[j + 1]; b += c[j + 2]; n++; } } const j = (y * sw + x) * 4; sd[j] = r / n; sd[j + 1] = g / n; sd[j + 2] = b / n; } }
  const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh; sc.getContext('2d').putImageData(small, 0, 0);
  const bc = document.createElement('canvas'); bc.width = w; bc.height = h; const bx = bc.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(sc, 0, 0, w, h);
  const bd = bx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) { if (!hole[i]) continue; d[i * 4] = bd[i * 4]; d[i * 4 + 1] = bd[i * 4 + 1]; d[i * 4 + 2] = bd[i * 4 + 2]; }
  // then blur the seam itself, a band either side of the hole's edge, so the sharp picture meets the soft fill gradually
  const outer = dilate(hole, w, h, 7), innerGap = dilate(hole.map(v => v ? 0 : 1), w, h, 7);   // innerGap = 1 outside or within 7px inside the edge
  const band = new Uint8Array(w * h); for (let i = 0; i < w * h; i++) band[i] = outer[i] && innerGap[i] ? 1 : 0;
  for (let pass = 0; pass < 2; pass++) { const c = new Uint8ClampedArray(d); const R = 3; for (let i = 0; i < w * h; i++) { if (!band[i]) continue; const x = i % w, y = (i / w) | 0; let r = 0, g = 0, b = 0, n = 0; for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) continue; const j = (yy * w + xx) * 4; r += c[j]; g += c[j + 1]; b += c[j + 2]; n++; } } d[i * 4] = r / n; d[i * 4 + 1] = g / n; d[i * 4 + 2] = b / n; } }
}
/* ---- open / close ---- */
const deconEl = $('#decon');
function decOpen(src, opts = {}) {
  DEC.target = opts.target || 'auto'; DEC.res = null; DEC.hover = null; DEC.busy = false;
  if (!deconEl.open) deconEl.showModal();
  decSyncChips(); decList();
  if (!src) { DEC.img = null; DEC.name = ''; $('#deconDrop').hidden = false; $('#deconBuild').disabled = true; $('#deconAgain').disabled = true; decStatus('Drop a picture, or choose a file'); decDraw(); return; }
  decLoad(src, opts.name);
}
async function decLoad(src, name) {
  let im = src;
  if (src instanceof Blob) { if (!src.type.startsWith('image/')) return toast('That file isn’t an image'); name = name || src.name.replace(/\.[^.]+$/, ''); im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = URL.createObjectURL(src); }); }
  if (!im || !im.naturalWidth) return toast('Couldn’t read that picture');
  // source space: the picture as loaded, capped like an upload
  const k = Math.min(1, 2400 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, w, h);
  let SRC; try { SRC = x.getImageData(0, 0, w, h); } catch (e) { console.warn(e); return toast('That picture can’t be read back — pick the file itself instead'); }
  DEC.img = c; DEC.src = SRC; DEC.name = (name || 'Picture').slice(0, 40);
  $('#deconDrop').hidden = true; $('#deconAgain').disabled = false;
  decDraw(); decAnalyse();
}
deconEl.addEventListener('close', () => { DEC.res = null; DEC.img = null; decDraw(); });
$('#deconCancel').onclick = () => deconEl.close();
$('#deconPick').onclick = () => pickFile(f => decLoad(f));
$('#deconAgain').onclick = () => { if (DEC.img && !DEC.busy) decAnalyse(); };
$('#deconBuild').onclick = () => decBuild();
['dragenter', 'dragover'].forEach(ev => deconEl.addEventListener(ev, e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); deconEl.classList.add('filedrop'); }));
deconEl.addEventListener('dragleave', () => deconEl.classList.remove('filedrop'));
deconEl.addEventListener('drop', e => { if (!dtHasFiles(e)) return; e.preventDefault(); e.stopPropagation(); deconEl.classList.remove('filedrop'); const f = [...e.dataTransfer.files].find(x => x.type.startsWith('image/')); if (f) decLoad(f); });
$('#deconTarget').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; DEC.target = b.dataset.v; decSyncChips(); };
$('#deconPlate').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; DEC.plate = b.dataset.v; decSyncChips(); };
/* Which frame the result gets. 'auto' follows the picture's shape: tall → a reel cover, 4:5 or square → a static ad board. */
function decTarget() {
  const im = DEC.img, r = im ? im.height / im.width : 16 / 9;
  const adFrame = r >= 1.55 ? '9x16' : r >= 1.12 ? '4x5' : '1x1';
  let t = DEC.target;
  if (t === 'auto') t = r >= 1.55 ? 'cover' : 'ad';
  if (t === 'apply') return { kind: 'apply', ...sizeOf(doc), label: `the open ${isAd(doc) ? 'board' : isPost(doc) ? 'slide' : 'cover'} (${sizeOf(doc).w} × ${sizeOf(doc).h})` };
  if (t === 'cover') return { kind: 'cover', w: 1080, h: 1920, label: 'reel cover 1080 × 1920' };
  if (t === 'slide') return { kind: 'slide', w: 1080, h: 1350, label: 'carousel slide 1080 × 1350' };
  const f = AD_FRAMES[adFrame]; return { kind: 'ad', w: f.w, h: f.h, frame: adFrame, label: `static ad ${f.label} ${f.w} × ${f.h}` };
}
function decSyncChips() {
  const t = decTarget();
  $$('#deconTarget .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === DEC.target));
  $('#deconTarget [data-v=auto]').textContent = `Auto · ${t.kind === 'cover' ? 'cover' : t.kind === 'ad' ? 'static ad' : t.kind}`;
  $('#deconTarget [data-v=apply]').hidden = !doc;
  $$('#deconPlate .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === DEC.plate));
  $('#deconTargetNote').textContent = DEC.img ? `Becomes a ${t.label}.` : '';
}
/* ---- the preview: the picture with every found element boxed, click to keep or drop it ---- */
const deconCanvas = $('#deconCanvas');
function decDraw() {
  const c = deconCanvas, im = DEC.img;
  if (!im) { c.width = 540; c.height = 720; c.getContext('2d').clearRect(0, 0, c.width, c.height); c.style.width = ''; return; }
  const st = $('#deconStage'), maxW = Math.max(200, st.clientWidth - 24), maxH = Math.max(200, st.clientHeight - 24);
  const s = Math.min(maxW / im.width, maxH / im.height, 1), dpr = Math.min(devicePixelRatio || 1, 2);
  c.style.width = Math.round(im.width * s) + 'px'; c.style.height = Math.round(im.height * s) + 'px';
  c.width = Math.round(im.width * s * dpr); c.height = Math.round(im.height * s * dpr);
  const x = c.getContext('2d'); x.setTransform(s * dpr, 0, 0, s * dpr, 0, 0); x.drawImage(im, 0, 0);
  DEC.view = { s };
  const R = DEC.res; if (!R) return;
  x.lineWidth = 2 / s;
  for (const e of R.elems) {
    const b = e.bbox, col = DEC_KIND[e.kind].c, hot = DEC.hover === e.id;
    x.save(); x.strokeStyle = col; x.globalAlpha = e.on ? 1 : .45; x.setLineDash(e.on ? [] : [8 / s, 6 / s]); x.lineWidth = (hot ? 3.5 : 2) / s;
    x.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
    if (e.on) { x.fillStyle = col; x.globalAlpha = hot ? .2 : .1; x.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); }
    x.globalAlpha = 1; x.fillStyle = col; const fs = 13 / s; x.font = `600 ${fs}px "JetBrains Mono"`; const lab = `${e.n}`, tw = x.measureText(lab).width + 8 / s;
    x.fillRect(b.x0, Math.max(0, b.y0 - fs * 1.35), tw, fs * 1.35); x.fillStyle = '#16150f'; x.textBaseline = 'middle'; x.fillText(lab, b.x0 + 4 / s, Math.max(0, b.y0 - fs * 1.35) + fs * .68);
    x.restore();
  }
}
function decHit(ev) {
  const R = DEC.res, v = DEC.view; if (!R || !v) return null;
  const r = deconCanvas.getBoundingClientRect(), X = (ev.clientX - r.left) / v.s, Y = (ev.clientY - r.top) / v.s;
  const hits = R.elems.filter(e => X >= e.bbox.x0 && X <= e.bbox.x1 && Y >= e.bbox.y0 && Y <= e.bbox.y1);
  return hits.sort((a, b) => ((a.bbox.x1 - a.bbox.x0) * (a.bbox.y1 - a.bbox.y0)) - ((b.bbox.x1 - b.bbox.x0) * (b.bbox.y1 - b.bbox.y0)))[0] || null;   // the smallest box under the pointer
}
deconCanvas.addEventListener('pointermove', e => { const h = decHit(e); const id = h ? h.id : null; if (id !== DEC.hover) { DEC.hover = id; decDraw(); decList(); } deconCanvas.style.cursor = h ? 'pointer' : ''; });
deconCanvas.addEventListener('pointerleave', () => { if (DEC.hover) { DEC.hover = null; decDraw(); decList(); } });
deconCanvas.addEventListener('click', e => { const h = decHit(e); if (h) { h.on = !h.on; decDraw(); decList(); } });
window.addEventListener('resize', () => { if (deconEl.open) decDraw(); });
function decList() {
  const c = $('#deconList'); c.innerHTML = ''; const R = DEC.res;
  if (!R) { c.innerHTML = `<div class="empty">${DEC.busy ? 'Looking…' : DEC.img ? '' : 'Nothing analysed yet.'}</div>`; return; }
  if (!R.elems.length) { c.innerHTML = '<div class="empty">No words, subject or marks found — the picture would just be a background plate.</div>'; }
  R.elems.forEach(e => {
    const row = document.createElement('label'); row.className = 'decel'; row.dataset.kind = e.kind; row.classList.toggle('off', !e.on); row.classList.toggle('hot', DEC.hover === e.id);
    row.style.setProperty('--k', DEC_KIND[e.kind].c);
    const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = e.on; cb.onchange = () => { e.on = cb.checked; decDraw(); row.classList.toggle('off', !e.on); decBuildLabel(); };
    const k = document.createElement('span'); k.className = 'k'; k.textContent = `${e.n} ${DEC_KIND[e.kind].k}`;
    const body = document.createElement('span'); body.className = 'body';
    body.innerHTML = `<b>${escapeHtml(e.title)}</b><small>${escapeHtml(e.meta)}</small>`;
    row.append(cb, k, body);
    if (e.color) { const sw = document.createElement('i'); sw.className = 'sw'; sw.style.background = e.color; sw.title = e.color; row.appendChild(sw); }
    row.onpointerenter = () => { DEC.hover = e.id; decDraw(); $$('.decel', c).forEach(r => r.classList.toggle('hot', r === row)); };
    row.onpointerleave = () => { DEC.hover = null; decDraw(); row.classList.remove('hot'); };
    c.appendChild(row);
  });
  decBuildLabel();
}
function decBuildLabel() { const R = DEC.res, b = $('#deconBuild'); if (!R) { b.disabled = true; b.textContent = 'Build layers'; return; } const n = R.elems.filter(e => e.on).length; b.disabled = DEC.busy; b.textContent = n ? `Build ${n} layer${n === 1 ? '' : 's'} + plate` : 'Build the plate only'; }
/* ---- analysis ---- */
async function decAnalyse() {
  if (DEC.busy || !DEC.img) return; DEC.busy = true; DEC.res = null; decList(); $('#deconBuild').disabled = true;
  const SRC = DEC.src, w = SRC.width, h = SRC.height;
  const R = { w, h, elems: [], textMask: new Uint8Array(w * h), subj: null, ocr: 'none' };
  let n = 0;
  try {
    decStatus('Loading the text reader…');
    let lines = [];
    try { lines = await decOcr(SRC, m => { if (m.status === 'recognizing text') decStatus(`Reading the words… ${Math.round(m.progress * 100)}%`); else if (/loading|initializ/i.test(m.status || '')) decStatus(`Loading the text reader… ${m.status}`); }); R.ocr = 'ok'; }
    catch (e) { console.warn('ocr', e); R.ocr = 'off'; decStatus('Text reading is offline here — looking for the subject and marks only', 'warn'); }
    for (const B of groupBlocks(lines, w, h)) { const t = decTextElem(B, SRC, R.textMask); if (t) { t.id = 't' + (++n); t.n = n; R.elems.push(t); } }
    decStatus('Finding the subject…');
    try { const s = await decSubject(DEC.img, SRC); if (s) { s.id = 's' + (++n); s.n = n; R.subj = s; R.elems.push(s); } } catch (e) { console.warn('subject', e); }
    decStatus('Looking for marks and rules…');
    await new Promise(r => setTimeout(r, 10));
    const boxes = R.elems.filter(e => e.kind === 'text' && e.box).map(e => e.box);
    for (const m of decMarks(SRC, R.textMask, R.subj, boxes)) { m.id = 'm' + (++n); m.n = n; R.elems.push(m); }
    R.elems.sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0); R.elems.forEach((e, i) => { e.n = i + 1; });
    DEC.res = R;
    const nt = R.elems.filter(e => e.kind === 'text').length, nm = R.elems.filter(e => e.kind === 'mark' || e.kind === 'rule').length;
    decStatus(`Found ${nt} text block${nt === 1 ? '' : 's'}${R.subj ? ', a subject' : ''}${nm ? `, ${nm} mark${nm === 1 ? '' : 's'}` : ''}${R.ocr === 'off' ? ' · text reading was offline' : ''}. Untick anything to leave it in the plate.`, 'ok');
  } catch (e) { console.warn(e); decStatus('The analysis failed: ' + (e.message || e), 'warn'); DEC.res = R; }
  DEC.busy = false; decDraw(); decList();
}
/* OCR on a contrast-stretched grey copy (inverted when the picture is dark, since light-on-dark
   type reads far worse), at ~1800 px. A second pass in sparse mode, then the other polarity, only when
   the first finds almost nothing. Boxes come back in source space. */
async function decOcr(SRC, onProgress) {
  const worker = await decTesseract(onProgress);
  const w = SRC.width, h = SRC.height, k = clamp(1800 / Math.max(w, h), 0.5, 2.5);
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingQuality = 'high'; x.drawImage(DEC.img, 0, 0, c.width, c.height);
  const id = x.getImageData(0, 0, c.width, c.height), d = id.data, n = c.width * c.height, g = new Float32Array(n), hist = new Uint32Array(256);
  let sum = 0; for (let i = 0; i < n; i++) { const v = d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114; g[i] = v; sum += v; hist[v | 0]++; }
  let lo = 0, hi = 255, acc = 0; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= n * .02) { lo = i; break; } } acc = 0; for (let i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= n * .02) { hi = i; break; } }
  const dark = sum / n < 118, span = Math.max(30, hi - lo);
  const paint = inv => { for (let i = 0; i < n; i++) { let v = clamp((g[i] - lo) / span * 255, 0, 255); if (inv) v = 255 - v; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; } x.putImageData(id, 0, 0); };
  const run = async psm => { await worker.setParameters({ tessedit_pageseg_mode: String(psm), preserve_interword_spaces: '1' }); const { data } = await worker.recognize(c, {}, { blocks: true, text: true, hocr: false, tsv: false }); return linesOf(data); };
  const good = ls => ls.reduce((s, l) => s + l.words.length, 0);
  paint(dark);
  let ls = await run(3);
  ls = mergeLines(ls, await run(11));   // sparse mode picks up the lines auto layout skips: a button, a small footer
  /* The other polarity always runs too: type sitting on a BRIGHT patch of a dark
     picture was invisible to the main pass, and the old under-3-words gate meant
     it was never looked for once the dark areas had read well. */
  paint(!dark); ls = mergeLines(ls, await run(3)); ls = mergeLines(ls, await run(11));
  ls.forEach(l => { const sc = b => ({ x0: b.x0 / k, y0: b.y0 / k, x1: b.x1 / k, y1: b.y1 / k }); l.bbox = sc(l.bbox); l.words.forEach(wd => { wd.bbox = sc(wd.bbox); }); });
  ls = ls.filter(l => l.bbox.y1 - l.bbox.y0 >= 7 && l.bbox.y1 - l.bbox.y0 < h * .5 && l.bbox.x1 - l.bbox.x0 >= 4);
  // a lone glyph taller than every real line of type is a mark the reader took for a letter (a ring for a C);
  // left out of the text it is picked up by the mark pass instead, so it still becomes a movable layer
  const tallest = Math.max(0, ...ls.filter(l => l.text.replace(/\s/g, '').length >= 3).map(l => l.bbox.y1 - l.bbox.y0));
  return ls.filter(l => { const short = l.text.replace(/\s/g, '').length <= 2; if (!short) return true; if (l.conf < 80) return false; return !(tallest && l.bbox.y1 - l.bbox.y0 > tallest * 1.3); });
}
function linesOf(data) {
  const raw = data.blocks ? data.blocks.flatMap(b => (b.paragraphs || []).flatMap(p => p.lines || [])) : (data.lines || []);
  const out = [];
  for (const ln of raw) {
    const words = (ln.words || []).filter(wd => wd.confidence >= (DEC.minConf || 52) && /[A-Za-z0-9]/.test(wd.text) && wd.bbox && wd.bbox.x1 > wd.bbox.x0);   // DEC.minConf: erasure wants every glyph, however badly it read
    if (!words.length) continue;
    const text = words.map(wd => wd.text).join(' ').trim(); if (!text || (text.length <= 2 && words[0].confidence < 75)) continue;
    const bb = { x0: Math.min(...words.map(wd => wd.bbox.x0)), y0: Math.min(...words.map(wd => wd.bbox.y0)), x1: Math.max(...words.map(wd => wd.bbox.x1)), y1: Math.max(...words.map(wd => wd.bbox.y1)) };
    out.push({ text, conf: words.reduce((s, wd) => s + wd.confidence, 0) / words.length, bbox: bb, words: words.map(wd => ({ text: wd.text, conf: wd.confidence, bbox: { ...wd.bbox } })) });
  }
  return out;
}
const bbOverlap = (a, b) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
function mergeLines(a, b) { const out = a.slice(); for (const l of b) { const area = (l.bbox.x1 - l.bbox.x0) * (l.bbox.y1 - l.bbox.y0); if (!out.some(o => bbOverlap(o.bbox, l.bbox) > area * .4)) out.push(l); } return out; }
/* Lines → blocks: consecutive lines of about the same height, close together and sharing an edge or a
   centre. A headline and its sub-line differ in height, so they come out as separate layers, which is
   how the editor wants them. */
function groupBlocks(lines, w, h) {
  const ls = lines.slice().sort((a, b) => a.bbox.y0 - b.bbox.y0 || a.bbox.x0 - b.bbox.x0), blocks = [];
  for (const L of ls) {
    const lh = L.bbox.y1 - L.bbox.y0, cx = (L.bbox.x0 + L.bbox.x1) / 2;
    let best = null;
    for (const B of blocks) {
      const last = B.lines[B.lines.length - 1], bh = B.lh;
      const gap = L.bbox.y0 - last.bbox.y1, ratio = lh / bh;
      if (gap < -lh * .5 || gap > Math.max(lh, bh) * 0.95) continue;
      if (ratio < 0.68 || ratio > 1.45) continue;
      const bw = Math.max(B.bbox.x1 - B.bbox.x0, L.bbox.x1 - L.bbox.x0), bcx = (B.bbox.x0 + B.bbox.x1) / 2;
      const xo = Math.min(B.bbox.x1, L.bbox.x1) - Math.max(B.bbox.x0, L.bbox.x0);
      const aligned = Math.abs(L.bbox.x0 - B.bbox.x0) < bw * .12 || Math.abs(L.bbox.x1 - B.bbox.x1) < bw * .12 || Math.abs(cx - bcx) < bw * .12;
      if (xo <= 0 && !aligned) continue;
      if (!best || gap < best.gap) best = { B, gap };
    }
    if (best) { const B = best.B; B.lines.push(L); B.lh = (B.lh * (B.lines.length - 1) + lh) / B.lines.length; B.bbox = { x0: Math.min(B.bbox.x0, L.bbox.x0), y0: Math.min(B.bbox.y0, L.bbox.y0), x1: Math.max(B.bbox.x1, L.bbox.x1), y1: Math.max(B.bbox.y1, L.bbox.y1) }; }
    else blocks.push({ lines: [L], lh, bbox: { ...L.bbox } });
  }
  return blocks;
}
/* One text block → the description of a text layer, in source space. Colour is read from the pixels,
   size from the line height and the letters present, alignment from the line edges, weight from the
   stem width, the face from the stroke contrast. It also paints the block's glyphs into `textMask`. */
function decTextElem(B, SRC, textMask) {
  const w = SRC.width, h = SRC.height, d = SRC.data;
  const text = B.lines.map(l => l.text).join('\n');
  const ring = [], inner = [];
  const sample = (x0, y0, x1, y1, into, step) => { for (let y = Math.max(0, y0 | 0); y < Math.min(h, y1); y += step) for (let x = Math.max(0, x0 | 0); x < Math.min(w, x1); x += step) into.push(px(d, y * w + x)); };
  for (const L of B.lines) { const b = L.bbox; sample(b.x0 - 5, b.y0 - 5, b.x1 + 5, b.y0 - 2, ring, 2); sample(b.x0 - 5, b.y1 + 2, b.x1 + 5, b.y1 + 5, ring, 2); sample(b.x0 - 5, b.y0, b.x0 - 2, b.y1, ring, 2); sample(b.x1 + 2, b.y0, b.x1 + 5, b.y1, ring, 2); for (const wd of L.words) sample(wd.bbox.x0 + 1, wd.bbox.y0 + 1, wd.bbox.x1 - 1, wd.bbox.y1 - 1, inner, 1); }
  const bgc = medianColor(ring) || [0, 0, 0];
  const far = inner.filter(c => cdist(c, bgc) > 55);
  if (far.length < Math.max(12, inner.length * .03)) return null;   // nothing that reads as ink here: an OCR ghost
  const textc = medianColor(far);
  // glyph mask, per line, and stroke statistics
  const runsH = [], runsV = []; let inkArea = 0;
  for (const L of B.lines) {
    const b = L.bbox, x0 = Math.max(0, (b.x0 - 3) | 0), y0 = Math.max(0, (b.y0 - 3) | 0), x1 = Math.min(w, (b.x1 + 3) | 0), y1 = Math.min(h, (b.y1 + 3) | 0);
    for (let y = y0; y < y1; y++) { let run = 0; for (let x = x0; x < x1; x++) { const c = px(d, y * w + x), ink = cdist(c, bgc) > 30 && cdist(c, textc) < cdist(c, bgc); if (ink) { textMask[y * w + x] = 1; inkArea++; run++; } else if (run) { runsH.push(run); run = 0; } } if (run) runsH.push(run); }
    for (let x = x0; x < x1; x++) { let run = 0; for (let y = y0; y < y1; y++) { if (textMask[y * w + x]) run++; else if (run) { runsV.push(run); run = 0; } } if (run) runsV.push(run); }
  }
  const hRun = median(runsH.filter(r => r > 1)) || 2, vRun = median(runsV.filter(r => r > 1)) || 2;
  // font size from the line height and what the letters contain
  const letters = text.replace(/[^A-Za-z]/g, ''), caps = letters.length > 0 && letters === letters.toUpperCase();
  const hasDesc = /[gjpqyQ,;()]/.test(text), hasAsc = /[A-Zbdfhklt0-9]/.test(text);
  const lh = median(B.lines.map(l => l.bbox.y1 - l.bbox.y0));
  let size = caps ? lh / 0.70 : hasAsc && hasDesc ? lh / 0.93 : hasAsc || hasDesc ? lh / 0.72 : lh / 0.50;
  const contrast = Math.max(hRun, vRun) / Math.max(1, Math.min(hRun, vRun)), stem = Math.min(hRun, vRun) / size;
  const adv = B.lines.reduce((s, l) => s + (l.bbox.x1 - l.bbox.x0) / Math.max(1, l.text.length), 0) / B.lines.length / size;
  const font = contrast >= 1.35 ? 'Fraunces' : caps && adv < 0.44 ? 'Bebas Neue' : 'Manrope';
  const fdef = FONTS.find(f => f.n === font), want = stem >= 0.19 ? 900 : stem >= 0.14 ? 700 : stem >= 0.105 ? 600 : stem >= 0.08 ? 500 : 400;
  const weight = fdef.w.reduce((a, b) => Math.abs(b - want) < Math.abs(a - want) ? b : a, fdef.w[0]);
  // alignment from the line edges
  const bw = B.bbox.x1 - B.bbox.x0, cx = (B.bbox.x0 + B.bbox.x1) / 2;
  let align = 'left';
  if (B.lines.length > 1) {
    const dev = f => B.lines.reduce((s, l) => s + Math.abs(f(l.bbox)), 0) / B.lines.length;
    const dl = dev(b => b.x0 - B.bbox.x0), dr = dev(b => b.x1 - B.bbox.x1), dc = dev(b => (b.x0 + b.x1) / 2 - cx);
    align = dc <= dl && dc <= dr ? 'center' : dr < dl ? 'right' : 'left';
  } else if (Math.abs(cx - w / 2) < w * .035) align = 'center';
  // width calibration against the editor's own face
  const probe = newText({ text, font, weight, size: Math.round(size), track: 0, upper: false, line: 1.1, width: 1 });
  const mx = measureCtx(); mx.font = fontString(probe); mx.letterSpacing = '0px';
  let measured = 0, chars = 0; B.lines.forEach(l => { measured = Math.max(measured, mx.measureText(l.text).width); chars = Math.max(chars, l.text.length); });
  const widest = Math.max(...B.lines.map(l => l.bbox.x1 - l.bbox.x0));
  let ratio = measured > 0 ? widest / measured : 1;
  if (ratio < 0.85 || ratio > 1.15) { size *= clamp(ratio, 0.72, 1.35); mx.font = fontString({ ...probe, size: Math.round(size) }); measured = Math.max(...B.lines.map(l => mx.measureText(l.text).width)); ratio = measured > 0 ? widest / measured : 1; }
  const track = clamp((widest - measured) / Math.max(1, chars - 1) / size, -0.08, 0.3);
  // leading from the baseline pitch; baseline of a line sits at its ink foot, less the descender if it has one
  const base = l => l.bbox.y1 - (/[gjpqyQ,;()]/.test(l.text) ? 0.22 * size : 0.03 * size);
  const first = base(B.lines[0]), last = base(B.lines[B.lines.length - 1]);
  const line = B.lines.length > 1 ? clamp((last - first) / (B.lines.length - 1) / size, 0.85, 1.9) : 1.05;
  const top = first - (size * line / 2 + 0.34 * size);
  // a block sitting on its own box (a button, a pill)
  let box = null;
  const outer = []; const pad = lh * 1.3;
  sample(B.bbox.x0 - pad - 4, B.bbox.y0 - pad - 4, B.bbox.x1 + pad + 4, B.bbox.y0 - pad, outer, 3); sample(B.bbox.x0 - pad - 4, B.bbox.y1 + pad, B.bbox.x1 + pad + 4, B.bbox.y1 + pad + 4, outer, 3);
  const outc = medianColor(outer);
  const ringSpread = ring.length ? ring.reduce((s, c) => s + cdist(c, bgc), 0) / ring.length : 99;
  if (outc && cdist(outc, bgc) > 45 && ringSpread < 16) {
    // grow from the words until the colour changes, to find the box's edges
    const near = (x, y) => { x = clamp(x | 0, 0, w - 1); y = clamp(y | 0, 0, h - 1); return cdist(px(d, y * w + x), bgc) < 28; };
    const lim = lh * 3; let x0 = B.bbox.x0, x1 = B.bbox.x1, y0 = B.bbox.y0, y1 = B.bbox.y1; const ym = (y0 + y1) / 2, xm = (x0 + x1) / 2;
    while (x0 > B.bbox.x0 - lim && x0 > 0 && near(x0 - 2, ym) && near(x0 - 2, ym - lh * .3) && near(x0 - 2, ym + lh * .3)) x0 -= 2;
    while (x1 < B.bbox.x1 + lim && x1 < w - 1 && near(x1 + 2, ym) && near(x1 + 2, ym - lh * .3) && near(x1 + 2, ym + lh * .3)) x1 += 2;
    while (y0 > B.bbox.y0 - lim && y0 > 0 && near(xm, y0 - 2) && near(x0 + 4, y0 - 2) && near(x1 - 4, y0 - 2)) y0 -= 2;
    while (y1 < B.bbox.y1 + lim && y1 < h - 1 && near(xm, y1 + 2) && near(x0 + 4, y1 + 2) && near(x1 - 4, y1 + 2)) y1 += 2;
    if (x0 < B.bbox.x0 - 3 && x1 > B.bbox.x1 + 3 && y0 < B.bbox.y0 - 1 && y1 > B.bbox.y1 + 1) box = { x0, y0, x1, y1, color: toHex(bgc) };
  }
  const anchorX = align === 'left' ? B.bbox.x0 : align === 'right' ? B.bbox.x1 : cx;
  const first1 = text.split('\n')[0];
  return {
    kind: 'text', on: true, bbox: box ? { x0: box.x0, y0: box.y0, x1: box.x1, y1: box.y1 } : { ...B.bbox }, textBox: { ...B.bbox }, lines: B.lines, box,
    title: first1.length > 44 ? first1.slice(0, 42) + '…' : first1, meta: `${font} ${weight}${caps ? ' · caps' : ''} · ${Math.round(size)} px · ${align}${B.lines.length > 1 ? ` · ${B.lines.length} lines` : ''}${box ? ' · on a box' : ''}`,
    color: toHex(textc), text, font, weight, size, track: +track.toFixed(3), line: +line.toFixed(2), align, anchorX, top, caps, widthPx: Math.max(widest, measured) * 1.04 + size * .1,
  };
}
/* The subject, through the same on-device model as the Cutout tab. Skipped when it covers almost none or
   nearly all of the picture (a poster with no one in it, or a portrait that is all face). */
async function decSubject(c, SRC) {
  const w = SRC.width, h = SRC.height;
  if (!cut.seg) { if (typeof SelfieSegmentation === 'undefined') return null; cut.seg = new SelfieSegmentation({ locateFile: f => 'mp/' + f }); cut.seg.setOptions({ modelSelection: 1, selfieMode: false }); await withTimeout(cut.seg.initialize(), 25000); }
  const mw = 1024, sc = Math.min(1, mw / Math.max(w, h)); const inC = document.createElement('canvas'); inC.width = Math.round(w * sc); inC.height = Math.round(h * sc); inC.getContext('2d').drawImage(c, 0, 0, inC.width, inC.height);
  const res = await withTimeout(new Promise(r => { cut.seg.onResults(r); cut.seg.send({ image: inC }); }), 30000);
  // the model's mask is coarse (256 px across) — soften it as it is scaled up, or the cutout's edge comes out in steps
  const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const mcx = mc.getContext('2d'); mcx.filter = `blur(${Math.max(2, Math.round(Math.max(w, h) / 400))}px)`; mcx.drawImage(res.segmentationMask, 0, 0, w, h); mcx.filter = 'none';
  const md = mcx.getImageData(0, 0, w, h).data, mask = new Uint8Array(w * h);
  let n = 0, x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++) { const v = md[i * 4]; mask[i] = v; if (v > 128) { n++; const x = i % w, y = (i / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const cov = n / (w * h); if (cov < 0.02 || cov > 0.9) return null;
  // a person fills their own box; a stray low-confidence smear over a poster does not
  const fill = n / Math.max(1, (x1 - x0 + 1) * (y1 - y0 + 1));
  let conf = 0; for (let i = 0; i < w * h; i++) if (mask[i] > 128) conf += mask[i]; conf /= Math.max(1, n);
  if (fill < 0.28 || conf < 185) return null;
  return { kind: 'subject', on: true, mask, bbox: { x0, y0, x1: x1 + 1, y1: y1 + 1 }, cov, title: 'Subject cutout', meta: `${Math.round(cov * 100)}% of the picture · becomes the movable cutout`, color: null };
}
/* Marks and rules: things that differ from the ground around them, sit on flat colour, and are not
   words or the subject. Worked out on a small copy, extracted from the full picture. */
function decMarks(SRC, textMask, subj, boxes = []) {
  const w = SRC.width, h = SRC.height, ws = Math.min(1, 640 / Math.max(w, h)), ww = Math.max(1, Math.round(w * ws)), wh = Math.max(1, Math.round(h * ws));
  const sc = document.createElement('canvas'); sc.width = ww; sc.height = wh; const sx = sc.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(DEC.img, 0, 0, ww, wh);
  const D = sx.getImageData(0, 0, ww, wh).data, N = ww * wh;
  const K = new Uint8Array(N); const inv = 1 / ws;
  const inBox = (X, Y) => boxes.some(b => X >= b.x0 - 2 && X <= b.x1 + 2 && Y >= b.y0 - 2 && Y <= b.y1 + 2);
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) { const X = Math.min(w - 1, Math.round((x + .5) * inv)), Y = Math.min(h - 1, Math.round((y + .5) * inv)); const i = Y * w + X; K[y * ww + x] = textMask[i] || (subj && subj.mask[i] > 100) || (boxes.length && inBox(X, Y)) ? 1 : 0; }
  const blocked = dilate(K, ww, wh, 3); for (let i = 0; i < N; i++) K[i] = blocked[i] ? 0 : 1;
  // the subject's box, a little wider: bits of a person the model missed are not marks
  const sb = subj ? { x0: (subj.bbox.x0 - w * .04) * ws, y0: (subj.bbox.y0 - h * .04) * ws, x1: (subj.bbox.x1 + w * .04) * ws, y1: (subj.bbox.y1 + h * .04) * ws } : null;
  // mask-aware box blur of the picture = the ground it sits on
  const R = Math.max(6, Math.round(0.09 * Math.max(ww, wh))), sat = ch => { const t = new Float64Array((ww + 1) * (wh + 1)); for (let y = 1; y <= wh; y++) { let row = 0; for (let x = 1; x <= ww; x++) { const i = (y - 1) * ww + (x - 1); row += K[i] ? (ch < 0 ? 1 : D[i * 4 + ch]) : 0; t[y * (ww + 1) + x] = t[(y - 1) * (ww + 1) + x] + row; } } return t; };
  const S = [sat(0), sat(1), sat(2)], SK = sat(-1);
  const area = (t, x0, y0, x1, y1) => t[y1 * (ww + 1) + x1] - t[y0 * (ww + 1) + x1] - t[y1 * (ww + 1) + x0] + t[y0 * (ww + 1) + x0];
  const diff = new Uint8Array(N), flat = new Uint8Array(N), grey = i => D[i * 4] * .299 + D[i * 4 + 1] * .587 + D[i * 4 + 2] * .114;
  for (let y = 0; y < wh; y++) for (let x = 0; x < ww; x++) {
    const i = y * ww + x, x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(ww, x + R + 1), y1 = Math.min(wh, y + R + 1), k = area(SK, x0, y0, x1, y1);
    if (K[i] && k > 0) { const b = [area(S[0], x0, y0, x1, y1) / k, area(S[1], x0, y0, x1, y1) / k, area(S[2], x0, y0, x1, y1) / k]; diff[i] = Math.min(255, cdist(px(D, i), b)); }
    const gx = x > 0 && x < ww - 1 ? Math.abs(grey(i + 1) - grey(i - 1)) : 0, gy = y > 0 && y < wh - 1 ? Math.abs(grey(i + ww) - grey(i - ww)) : 0;
    flat[i] = gx + gy < 10 ? 1 : 0;
  }
  // connected components of "differs from the ground"
  const lab = new Int32Array(N).fill(-1), comps = []; const stack = [];
  for (let s = 0; s < N; s++) {
    if (lab[s] >= 0 || !K[s] || diff[s] <= 40) continue;
    const id = comps.length, c = { id, n: 0, x0: ww, y0: wh, x1: 0, y1: 0, pix: [] }; comps.push(c); stack.push(s); lab[s] = id;
    while (stack.length) { const i = stack.pop(); const x = i % ww, y = (i / ww) | 0; c.n++; c.pix.push(i); if (x < c.x0) c.x0 = x; if (x > c.x1) c.x1 = x; if (y < c.y0) c.y0 = y; if (y > c.y1) c.y1 = y;
      for (const o of [-1, 1, -ww, ww]) { const j = i + o; if (j < 0 || j >= N || (o === -1 && x === 0) || (o === 1 && x === ww - 1)) continue; if (lab[j] < 0 && K[j] && diff[j] > 40) { lab[j] = id; stack.push(j); } } }
  }
  // a poster is mostly flat ground; a photograph is not, and a "mark" on one is nearly always picture detail
  let flatK = 0, allK = 0; for (let i = 0; i < N; i++) if (K[i]) { allK++; if (flat[i]) flatK++; }
  const photo = allK ? flatK / allK < 0.75 : true;
  const lim = photo ? { flat: 0.85, ring: 8, pal: 16 } : { flat: 0.62, ring: 18, pal: 48 };
  const ringOf = (x0, y0, x1, y1) => { const ringPx = []; let flatN = 0, ringN = 0;
    for (let y = y0 - 6; y <= y1 + 6; y++) for (let x = x0 - 6; x <= x1 + 6; x++) { if (x < 0 || y < 0 || x >= ww || y >= wh) continue; if (x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1) continue; const i = y * ww + x; if (!K[i]) continue; ringN++; if (flat[i]) flatN++; ringPx.push(px(D, i)); }
    const rc = medianColor(ringPx); return { rc, n: ringN, flat: ringN ? flatN / ringN : 0, spread: rc ? ringPx.reduce((s, p) => s + cdist(p, rc), 0) / ringPx.length : 99 }; };
  const keep = [];
  for (const c of comps) {
    let bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1, ba = bw * bh;
    if (ba < 90 || ba < N * .0003 || ba > N * .22 || c.n / ba < 0.06) continue;
    if (sb && (c.x0 + c.x1) / 2 > sb.x0 && (c.x0 + c.x1) / 2 < sb.x1 && (c.y0 + c.y1) / 2 > sb.y0 && (c.y0 + c.y1) / 2 < sb.y1) continue;
    // the blur that stands for the ground bleeds a halo of ground pixels into the component around a strong
    // element: shrink to the pixels that really differ from the ring colour, then judge the ring again
    let r = ringOf(c.x0, c.y0, c.x1, c.y1); if (!r.rc || r.n < 12) continue;
    const pix = c.pix.filter(i => cdist(px(D, i), r.rc) > 40); if (pix.length < 30) continue;
    let x0 = ww, y0 = wh, x1 = 0, y1 = 0; for (const i of pix) { const x = i % ww, y = (i / ww) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    bw = x1 - x0 + 1; bh = y1 - y0 + 1; ba = bw * bh; if (ba < 60 || pix.length / ba < 0.06) continue;
    r = ringOf(x0, y0, x1, y1); if (!r.rc || r.n < 12 || r.flat < lim.flat || r.spread > lim.ring) continue;
    // a graphic is a few flat colours; picture detail shades continuously
    const mc = medianColor(pix.filter((_, k) => k % 2 === 0).map(i => px(D, i))), pal = pix.reduce((s, i) => s + cdist(px(D, i), mc), 0) / pix.length;
    if (pal > lim.pal) continue;
    keep.push({ x0, y0, x1: x1 + 1, y1: y1 + 1, n: pix.length, ring: r.rc, pix });
  }
  // pieces of one mark (two crests, a broken stroke) join up
  let merged = true;
  while (merged) { merged = false; outer: for (let i = 0; i < keep.length; i++) for (let j = i + 1; j < keep.length; j++) { const a = keep[i], b = keep[j]; const P = 5; if (a.x0 - P < b.x1 && b.x0 - P < a.x1 && a.y0 - P < b.y1 && b.y0 - P < a.y1) { keep[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1), n: a.n + b.n, ring: a.n >= b.n ? a.ring : b.ring, pix: a.pix.concat(b.pix) }; keep.splice(j, 1); merged = true; break outer; } } }
  const out = [];
  for (const c of keep) {
    const bw = c.x1 - c.x0, bh = c.y1 - c.y0, ba = bw * bh; if (ba > N * .22) continue;
    const aspect = bw / bh, rule = aspect >= 8 && bh <= wh * .015;
    const inkc = medianColor(c.pix.filter((_, k) => k % 3 === 0).map(i => px(D, i)));
    const pad = 3;
    const bbox = { x0: Math.max(0, (c.x0 - pad) * inv), y0: Math.max(0, (c.y0 - pad) * inv), x1: Math.min(w, (c.x1 + pad) * inv), y1: Math.min(h, (c.y1 + pad) * inv) };
    const W0 = Math.round(bw * inv), H0 = Math.round(bh * inv);
    out.push({ kind: rule ? 'rule' : 'mark', on: true, bbox, raw: { w: bw * inv, h: bh * inv }, ring: c.ring, color: toHex(inkc), title: rule ? 'Rule' : 'Mark', meta: rule ? `${W0} × ${H0} px line · becomes a rule layer` : `${W0} × ${H0} px on flat ground · becomes a logo layer` });
  }
  return out.slice(0, 12);
}
/* Alpha for a mark: how far each pixel is from the ground colour under it. */
function markCutout(SRC, e) {
  const w = SRC.width, d = SRC.data, b = e.bbox, x0 = b.x0 | 0, y0 = b.y0 | 0, bw = Math.max(1, Math.round(b.x1 - b.x0)), bh = Math.max(1, Math.round(b.y1 - b.y0));
  const c = document.createElement('canvas'); c.width = bw; c.height = bh; const x = c.getContext('2d'); const id = x.createImageData(bw, bh), o = id.data;
  for (let y = 0; y < bh; y++) for (let xx = 0; xx < bw; xx++) { const i = (y0 + y) * w + (x0 + xx), j = (y * bw + xx) * 4, p = px(d, i); const t = clamp((cdist(p, e.ring) - 14) / 40, 0, 1); o[j] = p[0]; o[j + 1] = p[1]; o[j + 2] = p[2]; o[j + 3] = Math.round(255 * t * t * (3 - 2 * t)); }
  x.putImageData(id, 0, 0); return c;
}
function subjectCutout(SRC, s) {
  const w = SRC.width, d = SRC.data, b = s.bbox, x0 = b.x0, y0 = b.y0, bw = b.x1 - b.x0, bh = b.y1 - b.y0;
  const c = document.createElement('canvas'); c.width = bw; c.height = bh; const x = c.getContext('2d'); const id = x.createImageData(bw, bh), o = id.data;
  for (let y = 0; y < bh; y++) for (let xx = 0; xx < bw; xx++) { const i = (y0 + y) * w + (x0 + xx), j = (y * bw + xx) * 4; const v = s.mask[i] / 255; let a = clamp((v - 0.42) / 0.16, 0, 1); a = a * a * (3 - 2 * a); o[j] = d[i * 4]; o[j + 1] = d[i * 4 + 1]; o[j + 2] = d[i * 4 + 2]; o[j + 3] = Math.round(255 * a); }
  x.putImageData(id, 0, 0); return c;
}
const canvasBlob = (c, type, q) => new Promise(r => c.toBlob(r, type, q));
/* ---- build: assets, the plate, then the document ---- */
async function decBuild() {
  const R = DEC.res; if (!R || DEC.busy) return; DEC.busy = true; decBuildLabel();
  try {
    const SRC = DEC.src, w = R.w, h = R.h, en = R.elems.filter(e => e.on), t = decTarget();
    const name = DEC.name || 'Picture';
    // frame mapping: the plate fills the frame, centred, like every uploaded background
    const s = Math.max(t.w / w, t.h / h), offX = (t.w - w * s) / 2, offY = (t.h - h * s) / 2;
    const fx = X => offX + X * s, fy = Y => offY + Y * s;
    decStatus('Cutting the elements out…');
    const layers = [], assetsMade = [];
    let subject = null;
    for (const e of en) {
      if (e.kind === 'text') {
        // words on their own box come out the way the editor's CTA button is built: a thick rule under a text layer
        if (e.box) { const b = e.box, bw = b.x1 - b.x0, bh = b.y1 - b.y0; layers.push(newRule({ x: +(fx(b.x0 + bw / 2) / t.w).toFixed(4), y: +(fy(b.y0 + bh / 2) / t.h).toFixed(4), width: +clamp(bw * s / t.w, 0.02, 1).toFixed(4), thick: Math.max(2, Math.round(bh * s)), color: b.color, alpha: 1 })); }
        const l = newText({ text: e.text, font: e.font, weight: e.weight, italic: false, upper: false, size: Math.round(e.size * s), line: e.line, track: e.track, width: clamp(e.widthPx * s / t.w, 0.05, 1), align: e.align, color: e.color, shadow: 0, outline: 0, box: 'none', x: +(fx(e.anchorX) / t.w).toFixed(4), y: +(fy(e.top) / t.h).toFixed(4) });
        layers.push(l);
      } else if (e.kind === 'rule') {
        const bw = e.bbox.x1 - e.bbox.x0, bh = e.bbox.y1 - e.bbox.y0;
        layers.push(newRule({ x: +(fx(e.bbox.x0 + bw / 2) / t.w).toFixed(4), y: +(fy(e.bbox.y0 + bh / 2) / t.h).toFixed(4), width: +clamp((e.raw ? e.raw.w : bw) * s / t.w, 0.02, 1).toFixed(4), thick: Math.max(2, Math.round((e.raw ? e.raw.h : bh - 6) * s)), color: e.color, alpha: 1 }));
      } else if (e.kind === 'mark') {
        const c = markCutout(SRC, e), blob = await canvasBlob(c, 'image/png');
        const rec = await store.putAsset(blob, 'logo', `${name} mark ${e.n}`); assetsMade.push(rec.id);
        const bw = e.bbox.x1 - e.bbox.x0, bh = e.bbox.y1 - e.bbox.y0;
        layers.push(newLogo({ image: rec.id, x: +(fx(e.bbox.x0 + bw / 2) / t.w).toFixed(4), y: +(fy(e.bbox.y0 + bh / 2) / t.h).toFixed(4), size: +clamp(bw * s / t.w, 0.02, 0.8).toFixed(4), alpha: 1 }));
      } else if (e.kind === 'subject') {
        const c = subjectCutout(SRC, e), blob = await canvasBlob(c, 'image/png');
        const rec = await store.putAsset(blob, 'cutout', `${name} subject`); assetsMade.push(rec.id);
        const bw = e.bbox.x1 - e.bbox.x0, bh = e.bbox.y1 - e.bbox.y0;
        subject = { on: true, image: rec.id, scale: +clamp(bh * s / t.h, 0.05, 8).toFixed(4), x: +(fx(e.bbox.x0 + bw / 2) / t.w).toFixed(4), y: +(fy(e.bbox.y1) / t.h).toFixed(4), shadow: 0, sat: 1, flip: false };
      }
    }
    decStatus('Cleaning the plate…'); await new Promise(r => setTimeout(r, 10));
    const plate = new ImageData(new Uint8ClampedArray(SRC.data), w, h), hole = new Uint8Array(w * h);
    for (const e of en) {
      if (e.kind === 'text') {
        if (e.box) { for (let y = Math.max(0, e.box.y0 | 0); y < Math.min(h, e.box.y1 + 1); y++) for (let x = Math.max(0, e.box.x0 | 0); x < Math.min(w, e.box.x1 + 1); x++) hole[y * w + x] = 1; }
        else for (const L of e.lines) { const b = L.bbox; for (let y = Math.max(0, (b.y0 - 3) | 0); y < Math.min(h, b.y1 + 3); y++) for (let x = Math.max(0, (b.x0 - 3) | 0); x < Math.min(w, b.x1 + 3); x++) if (R.textMask[y * w + x]) hole[y * w + x] = 1; }
      } else if (e.kind === 'mark' || e.kind === 'rule') {
        const b = e.bbox; for (let y = Math.max(0, b.y0 | 0); y < Math.min(h, b.y1); y++) for (let x = Math.max(0, b.x0 | 0); x < Math.min(w, b.x1); x++) if (cdist(px(SRC.data, y * w + x), e.ring) > 14) hole[y * w + x] = 1;
      }
    }
    const grown = dilate(hole, w, h, 2); bfsFill(plate.data, w, h, grown);
    if (subject && DEC.plate === 'fill') { const sh = new Uint8Array(w * h); const sm = R.subj.mask; for (let i = 0; i < w * h; i++) sh[i] = sm[i] > 60 ? 1 : 0; blurFill({ width: w, height: h, data: plate.data }, dilate(sh, w, h, 4)); }
    const pc = document.createElement('canvas'); pc.width = w; pc.height = h; pc.getContext('2d').putImageData(plate, 0, 0);
    const plateRec = await store.putAsset(await canvasBlob(pc, 'image/jpeg', 0.93), 'bg', `${name} plate`); assetsMade.push(plateRec.id);
    await preloadAssets(assetsMade);
    layers.forEach(l => { if (l.type === 'text') ensureFont(l.font, l.weight, l.italic); });
    layers.sort((a, b) => a.y - b.y);
    // the document
    const bg = { type: 'image', image: plateRec.id, fit: 'fill', pad: '#16150f', scale: 1, x: 0, y: 0, blur: 0, bright: 1, sat: 1 };
    if (t.kind === 'apply') {
      pushUndo(); doc.bg = { ...doc.bg, ...bg }; doc.overlay = { ...doc.overlay, type: 'none' }; doc.layers = layers; doc.subject = subject ? { ...doc.subject, ...subject } : { ...doc.subject, on: false };
      commit(); syncAll(); refreshAssetSelects(); renderBgPick();
    } else {
      const d = baseDoc(name); d.bg = { ...d.bg, ...bg }; d.overlay = { ...d.overlay, type: 'none', opacity: 0 }; d.grain = 0; d.layers = layers;
      d.subject = subject ? { ...d.subject, ...subject } : { ...d.subject, on: false };
      if (t.kind !== 'cover') { d.w = t.w; d.h = t.h; }
      if (t.kind === 'ad') {
        const used = new Set(covers.filter(c => isAd(c.doc)).map(c => c.doc.ad.id)); let n = 1; while (used.has(`P${n}`)) n++;
        d.name = `Static P${n} · ${name}`;
        d.ad = { set: AD_SET, rev: AD_LAYOUT, key: `imported:P${n}:x${uid()}`, setKey: 'imported', id: `P${n}`, name, layout: 'cover', frame: t.frame, ver: '01', flag: '', pair: '', ctaRef: '', dir: 'Broken down from a picture' };
      } else if (t.kind === 'slide') {
        const n = Math.max(0, ...postGroups().map(g => g.n || 0)) + 1, cid = 'c' + uid();
        d.name = `${String(n).padStart(2, '0')}.1 · ${name}`;
        d.post = { set: POST_SET, key: `${cid}:x${uid()}`, cid, n, slide: 1, of: 1, style: 'photo', title: name, category: '', insight: '', pick: '', visual: 'Broken down from a picture', photo: '' };
      }
      d.createdAt = d.updatedAt = Date.now();
      const rec = coverRecord(d); covers.push(rec); await store.saveCovers([rec]);
      if (t.kind === 'cover') { settings.gridOrder = [d.id, ...(settings.gridOrder || [])]; saveSettingsSoon(); }
      loadDoc(d);
    }
    deconEl.close(); switchView('editor'); refreshAssetSelects(); renderBgPick();
    toast(`${layers.length} layer${layers.length === 1 ? '' : 's'}${subject ? ' + the subject' : ''} on a clean plate — drag anything`);
  } catch (e) { console.warn(e); decStatus('Building failed: ' + (e.message || e), 'warn'); }
  DEC.busy = false; decBuildLabel();
}
$('#bgDeconstruct').onclick = () => {
  const a = doc.bg.type === 'image' && assets[doc.bg.image], im = a && getImg(doc.bg.image);
  if (im && im.naturalWidth) decOpen(im, { name: a.name, target: 'apply' }); else decOpen(null, { target: 'apply' });
};
$('#btnAdFromImage').onclick = () => decOpen(null, { target: 'ad' });
$('#btnPostFromImage').onclick = () => decOpen(null, { target: 'slide' });
$('#btnCoverFromImage').onclick = () => decOpen(null, { target: 'cover' });

/* ---------------- views ---------------- */
function switchView(v) {
  $$('nav.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.view === v));
  $$('.view').forEach(s => s.classList.toggle('active', s.id === 'view-' + v));
  if (v === 'grid') { renderGrid(); renderMosaicPreview(); } if (v === 'cutout') renderCutoutView(); if (v === 'editor') renderAll(); if (v === 'batch') renderBatchView(); if (v === 'posts') renderPosts(); if (v === 'ads') renderAds();
}
$$('nav.tabs button').forEach(b => b.onclick = () => switchView(b.dataset.view));
document.fonts.addEventListener('loadingdone', () => { renderAll(); renderCoverList(); renderTemplates(); if ($('#view-grid').classList.contains('active')) renderGrid(); });

/* A read-only handle on the live state, for the console and for tests. */
window.__rcs = { get settings() { return settings; }, get covers() { return covers; }, get doc() { return doc; }, get spanOpts() { return spanOpts; }, get mosaicOpts() { return mosaicOpts; }, assetsOf, setSpanAt, switchView, adGroups, renderAds, renderBlob,
  get ORG() { return ORG; }, get DEC() { return DEC; }, deleteRecs, moveToAlbum, setFav, setLabel, newAlbum, decOpen, decLoad, decAnalyse, decBuild, orgRerender, moveToSet, adSetChoices, seedFinalSet, bfsFill, dilate,
  // test hook: the drawn box of every layer of a doc, at 1:1
  layerBoxes(d) { const b = {}, sz = sizeOf(d), c = document.createElement('canvas'); c.width = sz.w; c.height = sz.h; render(c.getContext('2d'), d, 1, b); return b; } };

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
  refreshAssetSelects(); renderTemplates(); bindBatch(); bindMosaic(); bindSpan(); bindBlocks(); bindCtas();
  batchOpts.pool = assetsOf('photo').filter(p => p.still).map(p => p.id);
  let seeded = false;
  if (settings.demoSet !== DEMO_SET) { try { seeded = await seedDemoSet(); } catch (e) { console.warn('demo set', e); } }
  if (settings.staticSet !== STATIC_SET) { try { await seedStaticSet(); } catch (e) { console.warn('static set', e); } }
  if (settings.mosaicSet !== MOSAIC_SET) { try { await seedMosaicSet(); } catch (e) { console.warn('mosaic set', e); } }
  if (settings.postSet !== POST_SET) { try { await seedPostSet(); } catch (e) { console.warn('post set', e); } }
  if (settings.adSet !== AD_SET || settings.adLayout !== AD_LAYOUT) { try { await seedAdSet(); } catch (e) { console.warn('ad set', e); } }
  if (settings.adLines !== 2) { try { await fixAdLines(); } catch (e) { console.warn('ad lines', e); } }
  if (FINAL_SET && settings.finalSet !== FINAL_SET) { try { await seedFinalSet(); } catch (e) { console.warn('final set', e); } }
  try { await seedFinalCta(); } catch (e) { console.warn('final cta', e); }
  try { await seedFinalCtaRound(); } catch (e) { console.warn('final cta round', e); }
  try { await seedFinalEditable(); } catch (e) { console.warn('final editable', e); }
  if (settings.adSig !== AD_SIG) { try { await enlargeAdSigs(); } catch (e) { console.warn('ad footer', e); } }
  const todo = location.hash === '#todo';
  if (todo && settings.reelSet !== REEL_SET) { try { await seedReelSet(); } catch (e) { console.warn('reel set', e); } }
  if (settings.demoView !== DEMO_VIEW) { settings.shape = '34'; settings.demoView = DEMO_VIEW; store.saveSettings(settings).catch(() => {}); }
  if (settings.feedView !== FEED_VIEW && igFeed()) { settings.gridView = 'live'; settings.feedView = FEED_VIEW; store.saveSettings(settings).catch(() => {}); }
  if (covers.length) loadDoc([...covers].sort((a, b) => b.updatedAt - a.updatedAt)[0].doc);
  else { // seed a first set from the templates so the studio opens with something to look at
    for (const t of TEMPLATES.slice(0, 3)) { const d = t.make(); d.id = uid(); covers.push({ id: d.id, name: d.name, createdAt: d.createdAt, updatedAt: d.updatedAt - 1000, doc: d, versions: [] }); }
    for (const r of covers) { try { await store.saveCover(r); } catch {} }
    settings.gridOrder = covers.map(c => c.id); store.saveSettings(settings).catch(() => {});
    loadDoc(covers[0].doc);
  }
  setStatus('saved in this browser', 'ok');
  getImg('photo'); getImg('cutout');
  const fromPoster = await importFromPoster();
  await loadShared();   // the live sets use shared photographs, so they have to be listed first
  if (settings.waLive !== WA_LIVE) { try { await seedWaSets(); } catch (e) { console.warn('live sets', e); } }
  // a first visit, or a link ending #grid, opens straight on the profile
  if (!fromPoster && (seeded || todo || location.hash === '#grid')) switchView('grid');
  if (location.hash === '#posts') switchView('posts');   // a link straight to the carousels
  if (location.hash === '#ads') switchView('ads');       // a link straight to the static ads
  if (todo) { // the statics sit above the queue, so bring the first cover still to do into view
    const next = (settings.gridOrder || []).find(id => onPlaceholder(covers.find(c => c.id === id)?.doc));
    $$('#igrid .tile').find(t => t.dataset.id === next)?.scrollIntoView({ block: 'center' });
  }
})();
})();
