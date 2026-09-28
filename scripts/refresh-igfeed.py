# -*- coding: utf-8 -*-
"""Pull Harrison's actual Instagram feed into the studio, so a new post can be
   previewed against the real profile rather than the fictional demo grid.

   Run it any time the feed should catch up:   python scripts/refresh-igfeed.py

   It reads the Graph API token ig-live maintains (refresh.ps1 there keeps it
   alive; Platform Poster shares the same file), downloads each post's
   thumbnail, and writes igfeed.js + assets/feed/. Thumbnails are named by
   content hash because vercel.json serves /assets/ as immutable for a year —
   replacing a file in place would be invisible to anyone who has loaded the
   site before. Nothing secret lands in the repo: the token never leaves this
   machine, and the images are Harrison's own public posts."""
import hashlib
import io
import json
import os
import sys
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FEED_DIR = os.path.join(ROOT, "assets", "feed")
TOKEN_FILE = r"D:\CLIENTS\HARRISON\HarrisonSaito-VideoArchive\00. CONTENT LIBRARY\scripts\ig-live\.secrets\token.json"
IG_USER = "17841464493545504"
V = "v23.0"
LIMIT = 200                     # the whole account (74 posts today), newest first

try:
    from PIL import Image
except ImportError:
    Image = None

def get(path, **params):
    params["access_token"] = TOKEN
    with urllib.request.urlopen(f"https://graph.facebook.com/{V}/{path}?" + urllib.parse.urlencode(params), timeout=60) as r:
        return json.load(r)

def fetch(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()

def save_image(raw, stem):
    """Shrink to grid size and name by content, for the immutable cache."""
    if Image:
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        im.thumbnail((640, 640))
        b = io.BytesIO(); im.save(b, "JPEG", quality=82, optimize=True); raw = b.getvalue()
    name = f"{stem}-{hashlib.sha1(raw).hexdigest()[:10]}.jpg"
    with open(os.path.join(FEED_DIR, name), "wb") as f:
        f.write(raw)
    return "assets/feed/" + name

TOKEN = json.load(open(TOKEN_FILE, encoding="utf-8"))["access_token"]
os.makedirs(FEED_DIR, exist_ok=True)
for old in os.listdir(FEED_DIR):                      # hashes change name, so clear the old pull
    os.remove(os.path.join(FEED_DIR, old))

prof = get(IG_USER, fields="username,name,biography,profile_picture_url,followers_count,follows_count,media_count")
media, after = [], None
while len(media) < LIMIT:
    page = get(f"{IG_USER}/media", fields="id,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,caption",
               limit=50, **({"after": after} if after else {}))
    media += page.get("data", [])
    after = page.get("paging", {}).get("cursors", {}).get("after")
    if not after or not page.get("paging", {}).get("next"):
        break
media = media[:LIMIT]

posts = []
for i, m in enumerate(media):
    src = m.get("thumbnail_url") or m.get("media_url")
    if not src:
        continue
    try:
        thumb = save_image(fetch(src), f"p{i + 1:02d}")
    except Exception as e:
        print(f"  skip {m['id']}: {e}"); continue
    posts.append({
        "id": m["id"], "thumb": thumb, "type": m.get("media_type", ""),
        "product": m.get("media_product_type", ""), "permalink": m.get("permalink", ""),
        "ts": m.get("timestamp", ""), "caption": (m.get("caption") or "")[:120],
    })
    print(f"  {i + 1:02d} {m.get('media_product_type', ''):6} {thumb}")

avatar = ""
try:
    avatar = save_image(fetch(prof["profile_picture_url"]), "avatar")
except Exception as e:
    print("  avatar:", e)

from datetime import date
feed = {
    "at": date.today().isoformat(),
    "profile": {
        "handle": prof.get("username", ""), "name": prof.get("name", ""),
        "bio": prof.get("biography", ""), "avatar": avatar,
        "posts": prof.get("media_count", 0), "followers": prof.get("followers_count", 0),
        "following": prof.get("follows_count", 0),
    },
    "posts": posts,
}
head = ("/* Harrison's actual Instagram feed, pulled " + feed["at"] + " by scripts/refresh-igfeed.py.\n"
        "   The Profile grid's Live feed mode lays the studio's candidate post over these,\n"
        "   so a new post is judged against the real profile. Re-run the script to catch up. */\n")
with open(os.path.join(ROOT, "igfeed.js"), "w", encoding="utf-8", newline="\r\n") as f:
    f.write(head + "window.__IG_FEED__ = " + json.dumps(feed, indent=1, ensure_ascii=False) + ";\n")
print(f"wrote igfeed.js · @{prof.get('username')} · {len(posts)} posts · {prof.get('followers_count')} followers")
