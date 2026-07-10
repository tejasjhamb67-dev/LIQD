// GET /api/quote?symbols=RELIANCE.NS,NVDA
// Live quotes proxied from Yahoo Finance's chart endpoint (no API key needed).
// Cached at the edge for 60s so LIQD traffic never hammers the upstream.

import { json } from './_store.js';

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; LIQD/1.0)' };
const MAX_SYMBOLS = 25;

async function quoteFor(symbol) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const r = await fetch(u, { headers: UA });
  if (!r.ok) throw new Error(`upstream ${r.status}`);
  const meta = (await r.json())?.chart?.result?.[0]?.meta;
  if (!meta || meta.regularMarketPrice == null) throw new Error('no data');
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
  return {
    price: meta.regularMarketPrice,
    prevClose: prev,
    changePct: prev ? +(100 * (meta.regularMarketPrice - prev) / prev).toFixed(2) : 0,
    currency: meta.currency,
    marketState: meta.marketState || null,
    time: meta.regularMarketTime || null,
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url, 'http://x');
  const symbols = (url.searchParams.get('symbols') || '')
    .split(',').map(s => s.trim()).filter(s => /^[A-Z0-9.^=-]{1,20}$/i.test(s)).slice(0, MAX_SYMBOLS);
  if (!symbols.length) return json(res, 400, { error: 'symbols required' });

  const out = {};
  await Promise.all(symbols.map(async sym => {
    try { out[sym] = await quoteFor(sym); }
    catch { out[sym] = null; }        // per-symbol failure never fails the batch
  }));
  const anyLive = Object.values(out).some(Boolean);
  json(res, anyLive ? 200 : 502, { quotes: out, ts: Date.now() },
    'public, s-maxage=60, stale-while-revalidate=300');
}
