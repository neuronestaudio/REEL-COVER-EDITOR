/* The shared photo library. The studio itself is a static page and keeps a person's
   own uploads in their browser; this one function is what lets a photo be put where
   everyone who opens the studio gets it. Files live in the Vercel Blob store connected
   to this project (BLOB_READ_WRITE_TOKEN), nothing else is stored anywhere.

     GET    /api/photos                       the library, open to anyone who can open the site
     POST   /api/photos?id=&kind=&meta=       one image (kind: thumb | full), body = the bytes
     DELETE /api/photos?id=                   remove a photo for everyone

   Writing needs the team key (STUDIO_UPLOAD_KEY) in the x-studio-key header, so a
   stranger with the link can look but cannot fill the store.

   A photo is two blobs, named  library/<id>~<meta>~<kind>.<ext>  where <meta> is the
   base64url of {"n": name}. The name rides in the path because blobs carry no fields of
   their own, and it keeps the listing a single call with no manifest to get out of step. */
import { list, put, del } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

const PREFIX = 'library/';
const MAX_BYTES = Math.floor(4.3 * 1024 * 1024);   // under the platform's 4.5 MB request cap
const MAX_PHOTOS = 300;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const PATH = /^library\/([a-z0-9]{6,20})~([A-Za-z0-9_-]{1,700})~(full|thumb)\.(jpg|png|webp)$/;

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

function authed(request) {
  const want = process.env.STUDIO_UPLOAD_KEY || '', got = request.headers.get('x-studio-key') || '';
  if (!want || want.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(got));
}

function readMeta(b64) {
  try { const m = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8')); return { name: String(m.n || 'Shared photo').slice(0, 80) }; }
  catch { return { name: 'Shared photo' }; }
}

function looksLikeImage(buf, type) {
  const b = new Uint8Array(buf.slice(0, 12));
  if (type === 'image/jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (type === 'image/png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (type === 'image/webp') return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return false;
}

async function listAll(prefix) {
  const out = []; let cursor;
  do { const r = await list({ prefix, cursor, limit: 1000 }); out.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  return out;
}

export async function GET() {
  try {
    const by = new Map();
    for (const b of await listAll(PREFIX)) {
      const m = PATH.exec(b.pathname); if (!m) continue;
      const e = by.get(m[1]) || { id: m[1], ...readMeta(m[2]) };
      if (m[3] === 'full') { e.url = b.url; e.size = b.size; e.at = +new Date(b.uploadedAt); } else e.thumb = b.url;
      by.set(m[1], e);
    }
    const photos = [...by.values()].filter(e => e.url).sort((a, b) => a.at - b.at);
    // A minute at the edge keeps a busy day from turning into thousands of list calls;
    // the person who just uploaded asks with a fresh query string and skips the cache.
    return json({ photos, max: MAX_PHOTOS }, 200, { 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' });
  } catch (err) {
    console.error(err); return json({ error: 'The shared library could not be read.' }, 500);
  }
}

export async function POST(request) {
  if (!authed(request)) return json({ error: 'That upload key was not accepted.' }, 401);
  const q = new URL(request.url, 'http://local').searchParams;
  const id = q.get('id') || '', kind = q.get('kind') || '', meta = q.get('meta') || '';
  const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!/^[a-z0-9]{6,20}$/.test(id) || !/^(full|thumb)$/.test(kind) || !/^[A-Za-z0-9_-]{1,700}$/.test(meta)) return json({ error: 'Bad request.' }, 400);
  if (!TYPES[type]) return json({ error: 'Only JPEG, PNG or WebP images.' }, 415);
  if (+request.headers.get('content-length') > MAX_BYTES) return json({ error: 'That image is too large.' }, 413);
  try {
    const buf = await request.arrayBuffer();
    if (!buf.byteLength || buf.byteLength > MAX_BYTES) return json({ error: 'That image is too large.' }, 413);
    if (!looksLikeImage(buf, type)) return json({ error: 'That file is not an image.' }, 415);
    if (kind === 'full') {
      const n = (await listAll(PREFIX)).filter(b => /~full\.[a-z]+$/.test(b.pathname) && !b.pathname.startsWith(`${PREFIX}${id}~`)).length;
      if (n >= MAX_PHOTOS) return json({ error: `The shared library is full (${MAX_PHOTOS} photos). Remove some first.` }, 409);
    }
    const blob = await put(`${PREFIX}${id}~${meta}~${kind}.${TYPES[type]}`, buf, {
      access: 'public', contentType: type, addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000,
    });
    return json({ ok: true, id, kind, url: blob.url, ...readMeta(meta) });
  } catch (err) {
    console.error(err); return json({ error: 'The upload did not go through.' }, 500);
  }
}

export async function DELETE(request) {
  if (!authed(request)) return json({ error: 'That upload key was not accepted.' }, 401);
  const id = new URL(request.url, 'http://local').searchParams.get('id') || '';
  if (!/^[a-z0-9]{6,20}$/.test(id)) return json({ error: 'Bad request.' }, 400);
  try {
    const urls = (await listAll(`${PREFIX}${id}~`)).map(b => b.url);
    if (urls.length) await del(urls);
    return json({ ok: true, removed: urls.length });
  } catch (err) {
    console.error(err); return json({ error: 'The photo could not be removed.' }, 500);
  }
}
