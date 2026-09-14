# Reel Cover Studio

A browser-based designer for 1080×1920 Instagram reel covers. Static site — no build step,
no backend, no accounts. Everything runs in the visitor's browser.

## What it does

**Editor** — WYSIWYG 1080×1920 canvas. Drag captions and the subject cutout directly on the
artwork, double-click text to edit. Layers can be text, badges, rules or logos, each with font,
weight, tracking, leading, box style, outline, shadow and rotation. Six starting templates.
Guides mark the 3:4 profile-grid crop and the zone Instagram's reel UI covers.

**Part colour** — select any words inside a caption and give just those a different colour, so
one heading can carry an accent without being split into separate layers. Select in the text
box, then pick from **Part colour**; **Clear** returns the selection to the layer colour, or
resets the whole layer when nothing is selected. The colour is stored as a range over the text
rather than baked into it, so it follows the words as the caption is edited, and survives word
wrap, CAPS and re-alignment.

**Backgrounds** — tile picker of every image in the library, plus upload, or drag a file
anywhere onto the canvas. Drag the canvas to pan, scroll to zoom, or use Fill / Fit / Reset.
Also solid colours, gradients and six generated textures.

**Depth** — any layer can sit behind the subject cutout. The `FRT` / `BHD` button on each
layer row, or `B` on the selected layer.

**Profile grid** — phone mock of the Reels tab showing covers side by side, drag to reorder,
toggle to the 3:4 grid crop to check captions survive it. Every part of the profile header is
editable — handle, name, category, bio, link, counts, "followed by" line and avatar — so the
mock can be set to whichever account the covers are for.

**Cutout & backgrounds** — on-device subject segmentation (MediaPipe Selfie Segmentation,
bundled in `mp/`, nothing uploaded), edge/feather/shrink controls, and background swapping.
Transparent PNG cutouts made elsewhere can be uploaded instead.

**Export** — 1080×1920 or 2160×3840 PNG, JPG, or a ZIP of every cover.

## Storage

Cover documents and settings live in `localStorage`; uploaded images and cutouts live in
IndexedDB. Both are per browser and per device — nothing syncs. Use **Back up** in the Covers
panel to write the whole library (covers, settings and images) to one JSON file, and
**Restore** to load it on another machine or hand it to someone else.

To make the library shared and synced instead, replace the `store` object in `app.js` with
calls to a backend — Supabase (Postgres + Storage) or Vercel Postgres + Blob both map onto
the same handful of methods: `listCovers`, `saveCover`, `deleteCover`, `getSettings`,
`saveSettings`, `putAsset`, `deleteAsset`.

## Run locally

Needs a server — the segmentation model and canvas exports do not work from `file://`.

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploy

```bash
npx vercel          # preview
npx vercel --prod   # production
```

Or import the repo at vercel.com — framework preset **Other**, no build command, output
directory `.`.

## Layout

```
index.html   markup and styles
app.js       renderer, editor, storage, export
assets/      shipped photo + studio-grade cutout
mp/          MediaPipe Selfie Segmentation runtime and models (~12 MB)
vendor/      JSZip (ZIP export)
vercel.json  cache headers
```

Third-party at runtime: Google Fonts only. JSZip is vendored in `vendor/`.
