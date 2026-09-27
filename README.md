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

**Carousel posts** — the **Carousel posts** tab is a second builder, for Meta carousels at
1080 × 1350 instead of a 1080 × 1920 reel cover. It opens with the twenty Wa storyboards: three
slides each, the hook, the practice and the event, with the art direction printed under every
slide. Opening a slide puts it in the ordinary editor, where the rail lists that carousel rather
than the covers, the guides show the 4:5 safe area and the export menu follows the frame.
**Export carousel** gives a ZIP of the slides in posting order. Carousels can be added, copied
and deleted, and **+ Slide** extends one, renumbering the `01 / 03` footers that have not been
rewritten by hand. Posts never appear in the cover list, the profile grid or the mosaic.

A document now carries its own `w`/`h`; one with neither is a cover, so nothing had to be
migrated. Everything that draws or measures runs inside `withSize`, which sets the frame for the
document in hand and puts back what was there. The copy lives in `posts.js`, and `seedPostSet`
only ever adds a slide that is missing, so re-seeding cannot overwrite finished work.

**Gradient fill** — a text layer, or just the words selected in its box, can take a gradient
instead of a flat colour: twelve presets, two or three colours, an angle, and a sweep that runs
once per line (which reads as foil) or once across the whole block. On selected words it is
stored on the same ranges part colour uses, so it follows the words through edits and wraps.
Picking a flat Colour switches a layer's gradient back off.

**Shared photos** — "Upload for everyone" in the photo library (or the arrow on one of your own
photos) sends a photo to the server, and every browser that opens the studio then lists it under
**Shared**. It needs the team upload key once per device. `api/photos.js` is the whole back end:
it keeps the files in the Vercel Blob store connected to the project (`BLOB_READ_WRITE_TOKEN`)
and checks the key (`STUDIO_UPLOAD_KEY`) on anything that writes. Photos are shrunk to 2400 px
JPEG in the browser first. Covers still live only in the browser that made them. Run
`npx vercel dev` rather than a plain static server to have the shared library locally.

**Part colour** — select any words inside a caption and give just those a different colour, so
one heading can carry an accent without being split into separate layers. Select in the text
box, then pick from **Part colour**; **Clear** returns the selection to the layer colour, or
resets the whole layer when nothing is selected. The selected words stay highlighted in the box
and on the poster itself while you pick, including inside the native colour picker, which
takes focus away from the box (Chrome otherwise hides a textarea's selection the moment it
loses focus). The colour is stored as a range over the text
rather than baked into it, so it follows the words as the caption is edited, and survives word
wrap, CAPS and re-alignment.

**Photo library** — the background picker is one row until it is opened: the photo in use,
its name and how many are in the library. Open, it is grouped (an imported set named
`P01 - testimony - …` groups by the middle word; shoot stills, static plates and studio photos
have groups of their own), searchable, and scrolls inside its own window, so a library of a
hundred photos never lengthens the inspector. **+ Folder** adds every image in a folder in one
go, skipping any already there; they stay in that browser, nothing is uploaded.

**People photos** — 78 graded stills of Harrison with students, clients, his father and the
dojo are built in (`people.js`, `assets/people/`), grouped Testimony / Students / Father /
People / Dojo / Karate / Women. The library grid loads 270×480 thumbnails; the 1080×1920 plate is
fetched only when a cover uses it. A photo imported by folder before it was built in is kept
(covers may point at it) but not listed twice. The folder is served `noindex, noimageindex`.
Regenerate with `_cover-photo-sourcing/publish_to_studio.py`; a changed picture needs a new
`-vN` suffix, because `/assets` is cached for a year.

**Copy and paste** — `Ctrl+C` copies the selected element, `Ctrl+V` pastes it onto this cover
or any other (`Ctrl+X` cuts). Inside a text box the keys keep their usual meaning.

**Backgrounds** — upload, or drag a file
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

**Blocks** — ready-made groups of layers pasted onto whichever cover is open: the signature
strip (ensō mark, name, role line, both dojo crests) at the foot or inside the 3:4 grid crop,
the ensō mark, the dojo crests, the reel caption look, the static headline look and a CTA
button. **Save as block** keeps the open cover's layers — or only the selected layer — as a
block of your own, so a lock-up built once on any cover can be pasted onto every other one.
Own blocks live in that browser's settings; every paste is ordinary layers and one undo step.

**CTA badges** — one click puts a call to action on the open cover: a positioning line and,
if it has one, a button. **Every entry is listed as the line it actually says**, with its code
kept as a quiet label on the right — picking one used to mean opening *CTA 01*, *CTA 02* and the
rest in turn to find out what they were. They come in three groups: the submission CTA, the eight
lines from Harrison's static ad brief (`ads.js`, `ctas`, each with the *See how the 12 weeks work*
button), and the lines the boards in **FINAL ADS SUBMISSION** were actually exported with, read
off the pictures themselves and de-duplicated against the brief (`final.js`, `ctaNow`) — several
of those were edited in the studio before export and existed nowhere else. Type a different line or
button in the fields under the badges to use your own, and **Save as badge** keeps it for every
cover in that browser. On a static ad a badge replaces the board's own footer line and button and
lays the board out again inside the safe box; on anything else it lands as ordinary layers near
the foot. Either way it is one undo step.

**One call to action across the submission.** The boards in FINAL ADS SUBMISSION are finished
pictures with their old call to action printed on them, so a new one is laid over the top: a bar
the exact size of the old one, in the same vermilion, with the line centred on it. `final.js`
carries that rectangle (`cta`) and the old wording (`ctaNow`) for every board, measured from the
picture. **Submission CTA** on the set card sets the line for the whole set; `FINAL_CTA` is what
a browser seeds with and bumping `FINAL_CTA_REV` pushes a new line to browsers that already hold
the set. Three boards needed their rectangle widened by hand because the call to action ran past
the bar: F16 has the button as plain text under it, F17 puts only the first of two lines on the
bar, and F06 and F07 are faulty exports where the bar sits across the middle of the line with a
dead layer reading *and regulate your fear* underneath. F01 is a bare portrait with no call to
action on it and is left alone.

**Ad footer** — on every static ad the signature strip (ensō mark, name, role line, both dojo
crests) is drawn 1.3× the reel-cover size (`AD_SIG` in `app.js`), with its top edge where the
smaller strip's was, so it grows into the bottom margin and the copy above does not move. Boards
made before the change get the bigger strip once, and only where the strip is still as the layout
left it; one moved or resized by hand is left alone.

**Static Set v3 — nine angles** — the nine headline-led angles from the static ad copy bank
(25 Sep 2026), boards A5.1–A5.9 on the Static Ads tab, each on an unused Day 1 still (A5.9 on the
type plate, as the brief asks for a quiet visual) with the CTA line that matches its angle as a
small footer. The copy lives on the boards in `ads.js`, and the brief's art direction is printed
under each tile. Headlines are in sentence case like the other sets; **CAPS** on the headline
layer sets them the way the brief has them.

**Reel to-do set** — the working queue for re-covering the live reels. Open the link ending
`#todo` once and that browser is given one cover for each reel whose cover can still be
swapped after publishing (`reels.js`, from the updater's manifest: 55 reels plus #51, which
still needs copy). Each carries its cover text on a placeholder plate and takes the grid slot
of the generated cover with the same post number, so the grid stays in posting order and the
placeholder tiles are the ones left to do. **Drop a photo on a placeholder tile and it becomes
that cover's photo in place**; double-click to reposition it. The generated covers stay in the
library. The set is opt-in, so the client demo never shows placeholders, and re-seeding only
adds post numbers that have no to-do cover yet — bumping `REEL_SET` cannot wipe finished work.
**Export the set as a ZIP** takes the to-do cover for a post over the generated one and leaves
out any cover still on the placeholder, so a placeholder can never reach the updater.

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

**FINAL ADS SUBMISSION** — the first set on the Static Ads tab is the client submission. It is
seeded from `final.js` + `assets/final/` (the 23 finished boards Dion collected in
`Downloads\Statics Ads 1` and `Statics Ads 2`, rebuilt as 1080-wide JPEGs and listed in the photo
library under *Final submission*): each is a board with the picture as the whole board and no
layers, so it exports exactly as it is. **Any board from any other set can be moved in** — drag
its tile onto the submission card (or onto a tile inside it, to land before that one), or use
the tile's ⋯ menu → *Set*; drag within the set to put it in order. A moved board keeps its id and
its seed key, so the seeders never rebuild it in its old set; the order is `ad.order`, written for
the whole target set on every move. **Export submission** gives `FINAL ADS SUBMISSION - <date>.zip`
with the files numbered in that order. Bump `set` in `final.js` after adding pictures to the
manifest to seed them into browsers that already hold the set; edited, moved or deleted boards
are never brought back.

**Organise: albums, favourites, labels** — every tile in the studio (a cover in the rail, a
carousel slide, a static ad board) carries the same corner controls: a star, a ⋯ menu and, in
Select mode, a tick. The bar above each list filters by **★ Favourites**, by **album** and by
**label** (seven colours, named by double-clicking a dot: Redo, Review, Approved, Hero, Idea,
Client, Archive to begin with). **+ Album** makes an album; drag any tile onto an album chip to
file it, right-click the chip to rename, recolour or delete it (its contents stay). The ⋯ menu on
a tile — or a right-click — does favourite, label, album, duplicate, export and **delete** for
that one item; on a carousel card it acts on every slide. **Shift+click** tiles (or turn on
Select) to pick several, then the bar offers favourite, label, move, export and delete for the
lot; `Delete` on the keyboard does the same, `Esc` clears. Deleting a slide renumbers the rest of
its carousel; duplicating a board keeps it in its set with a lettered id. The marks live on the
record (`rec.fav`, `rec.album`, `rec.label`), not in the document, so restoring a version or
pasting a doc never moves anything; albums and label names live in settings. Back up carries them.

**Break down a picture** — a finished poster, ad or screenshot comes apart into the editor's
own layers. Open it from **Break down…** in the Background panel (on the photo in use, or a file),
**From picture** in the Covers panel, or **+ From a picture** on the Carousel posts and Static
Ads tabs, or drop a picture on the dialog. On-device, nothing uploaded:

- the **words** are read off the pixels with Tesseract (loaded from jsdelivr on first use, then
  cached by the browser) and become text layers — size from the line height and the letters
  present, colour sampled from the glyphs, alignment from the line edges, weight from the stem
  width, a serif or sans guess from the stroke contrast, the line breaks kept; words sitting on
  their own box (a button) come out as a thick rule under a text layer, the way the CTA button is
  built;
- the **person** goes through the same MediaPipe model as the Cutout tab and becomes the movable
  subject cutout (skipped when the mask is sparse or low-confidence, so a poster with nobody in it
  does not grow a phantom);
- **marks and rules** — things that differ from the ground around them, sit on flat colour and
  are not words or the subject — become logo and rule layers (on a photograph the test is much
  stricter, since picture detail is not a mark);
- what is left, with every element patched out (a breadth-first fill from the surrounding pixels,
  softened), becomes the **background plate**; *Fill behind subject* also fills in behind the
  cutout with a defocused version of the ground so it can move without a ghost.

Everything found is boxed on the preview and listed with a checkbox; untick anything to leave it
in the plate. **Make it** chooses the result: Auto (a tall picture becomes a reel cover, a 4:5 or
square one a static ad board in the **Imported boards** set), Cover, Static ad, Slide, or the
open document itself (one undo step). The plate fills the frame the way any uploaded background
does, and every position is mapped through that same fit.

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
app.js       renderer, editor, storage, export, organiser (albums/favourites/labels), Break down a picture
assets/      shipped photo, studio-grade cutout, mosaic source
assets/stills/  day-1 REEL COVER stills (the default batch photo set)
captions.js  the 72 cover captions, with hand-set line breaks
final.js     the FINAL ADS SUBMISSION manifest (23 boards) · assets/final/  their 1080-wide plates and thumbs
statics.js   the static-set boards (copy, plate, layout): v3, the "if this is you" 3x3 mosaic (nine tiles of one picture); v2, 18 on self-worth from the 26 Aug stills; v1, 18 from Nathan's videos
assets/statics/  static-set plates · assets/brand/  Harrison's marks
mp/          MediaPipe Selfie Segmentation runtime and models (~12 MB)
vendor/      JSZip (ZIP export)
vercel.json  cache headers
```

Third-party at runtime: Google Fonts, and Tesseract.js from jsdelivr the first time Break down a picture is used. JSZip is vendored in `vendor/`.
