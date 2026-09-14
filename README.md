# Reel Cover Studio

A browser-based designer for 1080×1920 Instagram reel covers. Static site — no build step,
no backend, no accounts. Everything runs in the visitor's browser.

## What it does

**Editor** — WYSIWYG 1080×1920 canvas. Drag captions and the subject cutout directly on the
artwork, double-click text to edit. Layers can be text, badges, rules or logos, each with font,
weight, tracking, leading, box style, outline, shadow and rotation. Six starting templates.
Guides mark the 3:4 profile-grid crop and the zone Instagram's reel UI covers. Selecting a layer
lifts its panel — and Layers with it — to the top of the inspector, so editing a caption never
means scrolling past Background and Overlay to reach the controls.

**Resize by dragging** — a selected element gets corner grips. Drag one to scale it and the
opposite corner stays pinned, so it grows the way you are pulling. Text scales its wrap width
with the font size, so a caption grows as a block instead of re-wrapping as it gets bigger. The
same grips resize logos, rules and the subject cutout, staying inside the limits the sliders use.
A thin element keeps only the bottom-right grip, so there is still something left to grab when
moving it.

**Part colour** — select any words inside a caption and give just those a different colour, so
one heading can carry an accent without being split into separate layers. Select in the text
box, then pick from **Part colour**; **Clear** returns the selection to the layer colour, or
resets the whole layer when nothing is selected. The colour is stored as a range over the text
rather than baked into it, so it follows the words as the caption is edited, and survives word
wrap, CAPS and re-alignment.

**Backgrounds** — tile picker of every image in the library, plus upload, or drag a file
anywhere onto the canvas. Drag the canvas to pan, scroll to zoom, or use Fill / Fit / Reset.
Also solid colours, gradients and six generated textures.

**Drop photos** — drag pictures in from the desktop. On the canvas the first one becomes the
background (a transparent PNG becomes the subject cutout instead) and any others become covers
of their own, so a whole shoot can go in at once. **Dropped on the profile grid they become
finished example covers in place** — photo as the background, a template's type over it, landing
in the slot they were dropped on — which is the quickest way to see how a set of photos reads as
a row of reels. Templates cycle as you drop, so a batch comes out varied rather than nine copies
of one caption.

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
