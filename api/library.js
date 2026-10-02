/* Which photos are taken out of the studio library, for everyone.

     GET  /api/library                 { hidden: [asset ids] }, open to anyone who can open the site
     POST /api/library?hide=<id>       take a photo out for everyone
     POST /api/library?show=<id>       put it back

   The list is library.json in the repo itself, read and written through the GitHub
   contents API, so a removal is a commit: it shows in every browser on their next load,
   and the site's own copy of the file catches up on the deploy that commit triggers.
   (The Blob store would have been the obvious home, but a Hobby store that goes over its
   1 GB is blocked outright, reads included, and this list must never go dark with it.)

   Writing needs the team key (STUDIO_UPLOAD_KEY, x-studio-key header) and GITHUB_TOKEN:
   a fine-grained token with Contents read/write on this one repository. */
import { timingSafeEqual } from 'node:crypto';

const REPO = process.env.LIBRARY_REPO || 'neuronestaudio/REEL-COVER-EDITOR';
const BRANCH = process.env.LIBRARY_BRANCH || 'main';
const FILE = 'library.json';
const ID = /^[A-Za-z0-9_-]{1,64}$/;

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

function authed(request) {
  const want = process.env.STUDIO_UPLOAD_KEY || '', got = request.headers.get('x-studio-key') || '';
  if (!want || want.length !== got.length) return false;
  return timingSafeEqual(Buffer.from(want), Buffer.from(got));
}

function gh(path, init = {}) {
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'reel-cover-studio', 'x-github-api-version': '2022-11-28', ...init.headers };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, { ...init, headers });
}

async function readList() {
  const r = await gh(`contents/${FILE}?ref=${BRANCH}`);
  if (!r.ok) throw new Error(`GitHub said ${r.status}`);
  const f = await r.json();
  const data = JSON.parse(Buffer.from(f.content, 'base64').toString('utf8'));
  return { data, sha: f.sha };
}

export async function GET() {
  try {
    // Without a token the API allows 60 calls an hour; the raw file (cached ~5 min by GitHub) is the fallback.
    const data = await readList().then(x => x.data, async () => {
      const r = await fetch(`https://raw.githubusercontent.com/${REPO}/${BRANCH}/${FILE}`);
      if (!r.ok) throw new Error(`raw said ${r.status}`);
      return r.json();
    });
    // The edge holds the answer briefly; whoever just changed it asks with a fresh query string.
    return json({ hidden: data.hidden || [] }, 200, { 'cache-control': 'public, max-age=0, s-maxage=20, stale-while-revalidate=300' });
  } catch (err) {
    console.error(err); return json({ error: 'The library list could not be read.' }, 502);
  }
}

export async function POST(request) {
  if (!authed(request)) return json({ error: 'That upload key was not accepted.' }, 401);
  if (!process.env.GITHUB_TOKEN) return json({ error: 'Removing for everyone is not switched on yet (GITHUB_TOKEN).' }, 503);
  const q = new URL(request.url, 'http://local').searchParams;
  const id = q.get('hide') || q.get('show') || '', hide = q.has('hide');
  if (!ID.test(id)) return json({ error: 'Bad request.' }, 400);
  // Two people removing at once: the second write is refused on a stale sha, so read again and retry.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data, sha } = await readList();
      const set = new Set(data.hidden || []);
      if (hide === set.has(id)) return json({ ok: true, hidden: [...set] });
      hide ? set.add(id) : set.delete(id);
      data.hidden = [...set];
      const body = JSON.stringify(data, null, 1).replace(/\n/g, '\r\n') + '\r\n';
      const r = await gh(`contents/${FILE}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: `Library: ${hide ? 'take out' : 'put back'} ${id}`, content: Buffer.from(body).toString('base64'), sha, branch: BRANCH }),
      });
      if (r.status === 409 || r.status === 422) continue;
      if (!r.ok) throw new Error(`GitHub said ${r.status}`);
      return json({ ok: true, hidden: data.hidden });
    } catch (err) {
      console.error(err); return json({ error: 'The library could not be changed.' }, 502);
    }
  }
  return json({ error: 'Someone else was changing the library. Try again.' }, 409);
}
