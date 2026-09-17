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
resets the whole layer when nothing is selected. The selected words stay highlighted in the box
and on the poster itself while you pick, including inside the native colour picker, which
takes focus away from the box (Chrome otherwise hides a textarea's selection the moment it
loses focus). The colour is stored as a range over the text
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

**Batch 72** — generates one cover per live post on the account, captioned from the
cover-text index (`captions.js`) and set in white Fraunces with a soft shadow. The shoot
stills in `assets/stills/` are dealt evenly across the 72 by grid position, so no cover shares
its still with the one beside it or the one above it; the eight posts with no overlay text are
generated blank, ready for new copy. Every result is an ordinary editable cover.

**Demo set** — the first time any browser opens the site it is given the full set: all 72
covers plus the 3×3 mosaic, laid out on the profile grid (72 → 01, mosaic at the foot) and
opened on that view. The still order is seeded, so everyone who opens the link sees the same
grid. Covers already in that browser are kept but taken off the grid. Bump `DEMO_SET` in
`app.js` to push a changed set to browsers that already have one. A link ending `#grid` always
opens on the profile.

**Static set** — the 18 Return to Self statics (16 Sep 2026, one per video from Nathan's
shoot) are shipped as ordinary editable covers, seeded once per browser like the demo set and
placed at the top of the profile grid. Copy is in `statics.js`, the plates in `assets/statics/`
(photo at the top, ink below where the caption block sits) and Harrison's marks in
`assets/brand/` (ensō mark, Shinbukan and Seizanji crests, also available as logo layers).
The **Return to Self static** template starts a new cover in the same look. Bump `STATIC_SET`
in `app.js` to push a changed set.

**3×3 mosaic** — on the Profile grid tab: drop or upload a photo and it is cut across nine
reels at the foot of the grid, with zoom, pan and a preview of the finished block. Instagram
crops reels to 3:4 from the centre, so the mosaic is laid out across nine 1080×1440 crop
windows (3240×4320 overall) and each tile renders full-bleed 1080×1920 around its own window,
so the reel still looks whole when opened. Each photo keeps its own mosaic, so several can sit on
the grid at once; re-cutting one leaves the others alone. **Export the 9 tiles as a ZIP** names
the files in posting order — bottom-right first, top-left last — with a `POST-ORDER.txt`.
Two ship built in: the candlelight still and the match photo behind the "slowing down time"
cover (C14). Bump `MOSAIC_SET` in `app.js` to push a changed cut of the match mosaic.

**Cutout across tiles** — also on the Profile grid tab: drop a photo (the subject is cut out
on-device) or a transparent PNG, choose a block up to three tiles wide and as many rows as you
like, pick its top-left tile, then size and pan the figure over the block and **Lay across the
tiles**. Nothing new in the renderer: each tile under the block gets ordinary subject settings
that put its slice in place, so opening any tile in the editor shows its piece as the subject,
and it exports like any other cover. Re-lay to move it; **Take it off the tiles** puts back
whatever subject each tile had before.

**Select and export** — click tiles on the Profile grid (or tick covers in the Covers panel)
to select a set; **Export selected** renders just those, one as a PNG, more as a ZIP, at the
size chosen in the header.

**Export** — 1080×1920 or 2160×3840 PNG, JPG, the selected covers, or a ZIP of every cover.

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
assets/      shipped photo, studio-grade cutout, mosaic source
assets/stills/  day-1 REEL COVER stills (the default batch photo set)
captions.js  the 72 cover captions, with hand-set line breaks
statics.js   the static-set boards (copy, plate, layout): v3, the "if this is you" 3x3 mosaic (nine tiles of one picture); v2, 18 on self-worth from the 26 Aug stills; v1, 18 from Nathan's videos
assets/statics/  static-set plates · assets/brand/  Harrison's marks
mp/          MediaPipe Selfie Segmentation runtime and models (~12 MB)
vendor/      JSZip (ZIP export)
vercel.json  cache headers
```

Third-party at runtime: Google Fonts only. JSZip is vendored in `vendor/`.
