// LIQD — live data client. Every call fails soft: no API (localhost, outage,
// storage unconfigured) → null, and the UI keeps its deterministic demo data.

const TIMEOUT = 3500;

async function api(path, opts = {}) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    const r = await fetch('/api/' + path, { ...opts, signal: ctl.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

/* ---------- identity: device key (account OAuth replaces this in P5) ---------- */
export function device() {
  let id = localStorage.getItem('liqd.device');
  if (!id) {
    id = 'liqd_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem('liqd.device', id);
  }
  return id;
}

/* ---------- quotes ---------- */
export const ySymbol = s => s.mkt === 'US' ? s.sym : s.sym + '.NS';

let quoteCache = { ts: 0, data: {} };
export async function fetchQuotes(stocks) {
  if (Date.now() - quoteCache.ts < 60000) return quoteCache.data;
  const syms = stocks.map(ySymbol).join(',');
  const r = await api('quote?symbols=' + encodeURIComponent(syms));
  if (!r || !r.quotes) return null;
  const out = {};
  for (const s of stocks) {
    const q = r.quotes[ySymbol(s)];
    if (q && q.price != null) out[s.sym] = q;
  }
  if (!Object.keys(out).length) return null;
  quoteCache = { ts: Date.now(), data: out };
  return out;
}

export async function fetchHistory(stock, range = '3y', interval = '1wk') {
  const r = await api(`history?symbol=${encodeURIComponent(ySymbol(stock))}&range=${range}&interval=${interval}`);
  return r && r.points && r.points.length > 10 ? r.points : null;
}

/* ---------- state sync ---------- */
let syncTimer = null;
export function schedulePush(state) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    api('sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-LIQD-Device': device() },
      body: JSON.stringify({ state }),
    });
  }, 1500);
}
export async function pullState() {
  const r = await api('sync', { headers: { 'X-LIQD-Device': device() } });
  return r && r.ok && r.doc ? r.doc : null;
}

/* ---------- pulse ---------- */
export async function pulseFeed() {
  const r = await api('pulse');
  return r && r.ok ? r.posts : null;
}
export async function pulsePost(post) {
  const r = await api('pulse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-LIQD-Device': device() },
    body: JSON.stringify(post),
  });
  return r && r.ok ? r.post : null;
}

export const ago = ts => {
  const s = Math.max(1, (Date.now() - ts) / 1000);
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
};
