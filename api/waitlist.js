// POST /api/waitlist — founding-member signups. KV-backed; 503 degrade.

import { getStore, json, readBody } from './_store.js';

const KEY = 'liqd:waitlist';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  const store = getStore();
  if (!store) return json(res, 503, { ok: false, reason: 'storage_not_configured' });
  try {
    const b = await readBody(req);
    const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
    const tier = ['henry', 'hni', 'uhni'].includes(b.tier) ? b.tier : 'henry';
    if (!EMAIL.test(email)) return json(res, 400, { ok: false, reason: 'bad_email' });
    await store.push(KEY, { email, tier, at: Date.now() }, 10000);
    return json(res, 200, { ok: true });
  } catch { return json(res, 500, { ok: false }); }
}
