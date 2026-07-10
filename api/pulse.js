// GET/POST /api/pulse — the shared setups feed.
// House rule enforced server-side too: no thesis + no invalidation = 400.

import { getStore, json, readBody, deviceId } from './_store.js';

const KEY = 'liqd:pulse:feed';
const clean = (s, n) => String(s || '').replace(/[<>]/g, '').slice(0, n).trim();

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const store = getStore();
  if (!store) return json(res, 503, { ok: false, reason: 'storage_not_configured' });

  try {
    if (req.method === 'GET') {
      const posts = await store.list(KEY, 60);
      return json(res, 200, { ok: true, posts }, 'public, s-maxage=15, stale-while-revalidate=60');
    }
    if (req.method === 'POST') {
      if (!deviceId(req)) return json(res, 401, { ok: false, reason: 'missing_device_id' });
      const b = await readBody(req);
      const entry = +b.entry, target = +b.target, stop = +b.stop;
      const dir = b.dir === 'short' ? 'short' : 'long';
      const post = {
        user: clean(b.user, 32) || 'member',
        sym: clean(b.sym, 16).toUpperCase(),
        dir, entry, target, stop,
        thesis: clean(b.thesis, 600),
        invalid: clean(b.invalid, 300),
        likes: 0, at: Date.now(),
      };
      const levelsOk = entry > 0 && target > 0 && stop > 0 &&
        (dir === 'long' ? target > entry && stop < entry : target < entry && stop > entry);
      if (!post.sym || !levelsOk || post.thesis.length < 20 || post.invalid.length < 10)
        return json(res, 400, { ok: false, reason: 'incomplete_setup' });
      await store.push(KEY, post, 500);
      return json(res, 200, { ok: true, post });
    }
    return json(res, 405, { ok: false });
  } catch (e) {
    return json(res, 500, { ok: false, reason: 'store_error' });
  }
}
