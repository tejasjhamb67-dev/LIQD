// GET/PUT /api/sync — cross-device state sync, keyed by device id.
// Identity is device-scoped (header X-LIQD-Device); account auth (Google OAuth)
// replaces it in the next phase. Requires KV env vars; degrades to 503 otherwise.

import { getStore, json, readBody, deviceId } from './_store.js';

const MAX_BYTES = 64 * 1024;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const store = getStore();
  if (!store) return json(res, 503, { ok: false, reason: 'storage_not_configured' });
  const id = deviceId(req);
  if (!id) return json(res, 401, { ok: false, reason: 'missing_device_id' });
  const key = `liqd:state:${id}`;

  try {
    if (req.method === 'GET') {
      const doc = await store.get(key);
      return json(res, 200, { ok: true, doc });
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readBody(req);
      if (!body || typeof body.state !== 'object') return json(res, 400, { ok: false, reason: 'bad_body' });
      if (JSON.stringify(body.state).length > MAX_BYTES) return json(res, 413, { ok: false, reason: 'too_large' });
      const doc = { state: body.state, updatedAt: Date.now() };
      await store.set(key, doc);
      return json(res, 200, { ok: true, updatedAt: doc.updatedAt });
    }
    return json(res, 405, { ok: false });
  } catch (e) {
    return json(res, 500, { ok: false, reason: 'store_error' });
  }
}
