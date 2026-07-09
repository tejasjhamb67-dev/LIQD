// LIQD — Terminal: security master pages + watchlist. Bloomberg depth, human surface.

import { S, save, active } from '../state.js';
import { STOCKS, bySym, priceSeries } from '../stocks.js';
import { esc, fmtPct, showTip, hideTip, tipRow } from '../util.js';
import { sparkline, lines } from '../charts.js';
import { go } from '../app.js';

const fmtPx = (s) => (s.mkt === 'US' ? '$' : '₹') + s.px.toLocaleString('en-IN');
const fmtMcap = (cr, mkt) => mkt === 'US'
  ? '$' + (cr * 1e7 / 85 / 1e12).toFixed(1) + 'T'
  : cr >= 1e7 ? '₹' + (cr / 1e5).toFixed(1) + ' L Cr' : '₹' + (cr / 1000).toFixed(0) + 'k Cr';

function star(sym) {
  S.watchlist = S.watchlist || [];
  const i = S.watchlist.indexOf(sym);
  i >= 0 ? S.watchlist.splice(i, 1) : S.watchlist.push(sym);
  save();
}

/* ================= watchlist / market grid ================= */
export function renderTerminal(main) {
  S.watchlist = S.watchlist || ['RELIANCE', 'HDFCBANK', 'NVDA'];
  let q = '', mkt = 'all';

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">02 · Terminal</div>
      <h1 class="page-title">Security master</h1>
      <p class="page-sub">Open any instrument. Demo data — live feed lands with the data layer.</p>
    </div>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <input class="input" id="tq" placeholder="Search symbol, name, sector" style="max-width:300px">
      <button class="chip on" data-m="all">All</button>
      <button class="chip" data-m="IN">India</button>
      <button class="chip" data-m="US">US · LRS</button>
      <button class="chip" data-m="wl">★ Watchlist</button>
    </div>
    <div class="card"><div id="rows"></div></div>`;

  const paint = () => {
    const list = STOCKS.filter(s =>
      (mkt === 'all' || (mkt === 'wl' ? S.watchlist.includes(s.sym) : s.mkt === mkt)) &&
      (!q || (s.sym + s.name + s.sector).toLowerCase().includes(q)));
    main.querySelector('#rows').innerHTML = list.map(s => `
      <div class="wl-row" data-s="${s.sym}">
        <span><b>${s.sym}</b> <span class="badge">${s.sector}</span>${s.route ? ' <span class="badge brand">LRS</span>' : ''}
          <div class="small muted">${esc(s.name)} · ${fmtMcap(s.mcapCr, s.mkt)}</div></span>
        <span class="spark" style="width:110px"></span>
        <span style="text-align:right"><b class="tnum">${fmtPx(s)}</b>
          <div class="small tnum" style="color:${s.ret1y >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtPct(s.ret1y, 1, true)} 1y</div></span>
        <span class="star ${S.watchlist.includes(s.sym) ? 'on' : ''}" data-star="${s.sym}">★</span>
      </div>`).join('') || '<p class="small muted" style="padding:12px">No matches.</p>';
    main.querySelectorAll('.wl-row').forEach(r => {
      const s = bySym(r.dataset.s);
      sparkline(r.querySelector('.spark'), priceSeries(s).filter((_, i) => i % 6 === 0), { color: s.ret1y >= 0 ? '#0e7a3d' : '#c43a39' });
      r.onclick = e => { if (e.target.dataset.star) return; go('stock/' + s.sym); };
      r.querySelector('.star').onclick = e => { star(e.target.dataset.star); paint(); };
    });
  };
  main.querySelector('#tq').oninput = e => { q = e.target.value.toLowerCase(); paint(); };
  main.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    mkt = b.dataset.m;
    main.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === b));
    paint();
  });
  paint();
}

/* ================= security page ================= */
export function renderStock(main, sym) {
  const s = bySym(sym);
  if (!s) { main.innerHTML = '<p class="muted">Unknown symbol.</p>'; return; }
  const series = priceSeries(s);
  const m = active();
  const inWl = (S.watchlist || []).includes(s.sym);
  const w52h = Math.max(...series.slice(-52)), w52l = Math.min(...series.slice(-52));
  const cur = (s.mkt === 'US' ? '$' : '₹');

  const kv = (pairs) => `<div class="kv">${pairs.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join('')}</div>`;
  const grade = (x, good, ok) => `<b style="color:${x >= good ? 'var(--up)' : x >= ok ? 'var(--warn)' : 'var(--down)'}">${x.toFixed(0)}</b>`;

  main.innerHTML = `
    <button class="btn sm ghost" id="back">← Terminal</button>
    <div class="card" style="margin-top:12px">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <div class="tick-head">
          <span style="font-weight:750;font-size:20px">${s.sym}</span>
          <span class="px tnum">${fmtPx(s)}</span>
          <span class="tnum" style="font-weight:650;color:${s.ret1y >= 0 ? 'var(--up)' : 'var(--down)'}">${fmtPct(s.ret1y, 1, true)} 1y</span>
          <span class="badge">${s.sector}</span><span class="badge">${s.mkt === 'US' ? 'NYSE/NASDAQ · via LRS' : 'NSE'}</span>
        </div>
        <button class="btn sm ${inWl ? '' : 'ghost'}" id="wl">${inWl ? '★ Watching' : '☆ Watch'}</button>
      </div>
      <div class="small muted" style="margin:4px 0 12px">${esc(s.name)} · ${fmtMcap(s.mcapCr, s.mkt)} · β ${s.beta}</div>
      <div class="chart-box" id="pxChart"></div>
    </div>

    <div class="grid g3" style="margin-top:16px">
      <div class="card"><h3 class="card-title">Valuation</h3>${kv([
        ['P/E', s.pe ? s.pe.toFixed(1) + 'x' : '—'], ['P/B', s.pb ? s.pb.toFixed(1) + 'x' : '—'],
        ['Dividend yield', s.divY + '%'], ['52-week range', `${cur}${w52l.toFixed(0)} – ${cur}${w52h.toFixed(0)}`],
        ['Off 52w high', fmtPct((s.px / w52h - 1) * 100, 1)]])}</div>
      <div class="card"><h3 class="card-title">Quality</h3>${kv([
        ['ROE', s.roe ? s.roe.toFixed(1) + '%' : '—'], ['ROCE', s.roce ? s.roce.toFixed(1) + '%' : '—'],
        ['Sales growth', s.salesG + '%'], ['Profit growth', s.profitG + '%'], ['Debt / equity', s.de.toFixed(2)]])}</div>
      <div class="card"><h3 class="card-title">Ownership & factors</h3>${kv([
        ['Promoter', s.promoter ? s.promoter + '%' : '—'], ['FII', s.fii ? s.fii + '%' : '—'],
        ['Quality score', grade(s.q, 70, 50)], ['Value score', grade(s.v, 55, 35)], ['Momentum score', grade(s.mo, 65, 45)]])}</div>
    </div>

    <div class="grid g3" style="margin-top:16px">
      <div class="card span2">
        <h3 class="card-title">The one-screen brief</h3>
        <div class="kv" style="grid-template-columns:110px 1fr;gap:10px 16px">
          <span>Business</span><b style="text-align:left;font-weight:500">${s.about}</b>
          <span>Moat</span><b style="text-align:left;font-weight:500">${s.moat}</b>
          <span>Key risks</span><b style="text-align:left;font-weight:500">${s.risks}</b>
          <span>Tax</span><b style="text-align:left;font-weight:500">${s.mkt === 'US'
            ? 'LTCG 12.5% after 24 months; slab before. TCS 20% on LRS remittance above ₹10L (adjustable). US estate-tax exposure above $60k.'
            : 'Equity: LTCG 12.5% beyond ₹1.25L/yr after 12 months; STCG 20%.'}</b>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">In your portfolio</h3>
        ${kv([
          ['Fits sleeve', s.mkt === 'US' ? 'Global — US & World' : s.sector.includes('ETF') ? 'Gold & Silver' : s.mcapCr > 400000 ? 'India Core — Large Cap' : 'India Growth — Flexi & Mid'],
          ['Policy cap (single stock)', '5% of equity sleeve'],
          ['Max position for you', '₹' + Math.round(S.corpus * m.weights.eq / 100 * 0.05 / 1000).toLocaleString('en-IN') + 'k'],
          ['Vol vs your portfolio', `${s.vol}% vs ${m.sigma}%`]])}
        <button class="btn sm" style="width:100%;margin-top:14px" id="toStudio">Size it in the Studio →</button>
      </div>
    </div>`;

  lines(main.querySelector('#pxChart'),
    [{ label: s.sym, color: '#2a78d6', values: series.filter((_, i) => i % 2 === 0) }],
    series.filter((_, i) => i % 2 === 0).map((_, i) => 'W' + i * 2),
    { h: 260, fmtY: v => cur + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0)) });

  main.querySelector('#back').onclick = () => go('terminal');
  main.querySelector('#toStudio').onclick = () => go('rebalance');
  main.querySelector('#wl').onclick = () => { star(s.sym); renderStock(main, sym); };
}
