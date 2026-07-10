// LIQD API — key-value storage over Upstash Redis REST (or Vercel KV, same protocol).
// No env vars configured → returns null and endpoints degrade to 503 with a clear
// reason, so the front-end silently falls back to local-only mode.

export function getStore() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const call = async (cmd) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    });
    if (!r.ok) throw new Error(`store ${r.status}`);
    return (await r.json()).result;
  };

  return {
    async get(key) {
      const v = await call(['GET', key]);
      return v == null ? null : JSON.parse(v);
    },
    async set(key, value) {
      await call(['SET', key, JSON.stringify(value)]);
    },
    // newest-first list, capped
    async push(key, value, cap = 200) {
      await call(['LPUSH', key, JSON.stringify(value)]);
      await call(['LTRIM', key, 0, cap - 1]);
    },
    async list(key, n = 50) {
      const v = await call(['LRANGE', key, 0, n - 1]);
      return (v || []).map(x => JSON.parse(x));
    },
  };
}

export function json(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-LIQD-Device');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (cache) res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

// tight device-id format: liqd_<16-32 hex/alnum chars>
export function deviceId(req) {
  const id = req.headers['x-liqd-device'] || '';
  return /^liqd_[a-z0-9-]{8,40}$/i.test(id) ? id : null;
}
