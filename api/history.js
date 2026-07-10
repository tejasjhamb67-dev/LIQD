// GET /api/history?symbol=RELIANCE.NS&range=3y&interval=1wk
// Real price history proxied from Yahoo Finance; edge-cached for an hour.

import { json } from './_store.js';

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; LIQD/1.0)' };
const RANGES = new Set(['1mo', '6mo', '1y', '3y', '5y', 'max']);
const INTERVALS = new Set(['1d', '1wk', '1mo']);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  const url = new URL(req.url, 'http://x');
  const symbol = url.searchParams.get('symbol') || '';
  const range = url.searchParams.get('range') || '3y';
  const interval = url.searchParams.get('interval') || '1wk';
  if (!/^[A-Z0-9.^=-]{1,20}$/i.test(symbol)) return json(res, 400, { error: 'bad symbol' });
  if (!RANGES.has(range) || !INTERVALS.has(interval)) return json(res, 400, { error: 'bad range/interval' });

  try {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const r = await fetch(u, { headers: UA });
    if (!r.ok) throw new Error(`upstream ${r.status}`);
    const result = (await r.json())?.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close || [];
    const ts = result?.timestamp || [];
    const points = ts.map((t, i) => ({ t, c: closes[i] })).filter(p => p.c != null);
    if (!points.length) throw new Error('no data');
    json(res, 200, { symbol, currency: result.meta?.currency, points },
      'public, s-maxage=3600, stale-while-revalidate=86400');
  } catch (e) {
    json(res, 502, { error: 'upstream unavailable' });
  }
}
