// LIQD — Screen: factor screener over the security master.

import { STOCKS } from '../stocks.js';
import { fmtPct } from '../util.js';
import { go } from '../app.js';

const PRESETS = [
  { key: 'all', label: 'All', f: () => true },
  { key: 'coffee', label: 'Coffee-can quality', f: s => s.q >= 72 && s.roe >= 14 && s.de < 1 },
  { key: 'momo', label: 'Momentum 20', f: s => s.mo >= 60 },
  { key: 'value', label: 'Value + yield', f: s => s.v >= 45 && s.divY >= 0.8 },
  { key: 'growth', label: 'Growth > 18%', f: s => s.salesG >= 18 },
  { key: 'lrs', label: 'Global (LRS)', f: s => s.mkt === 'US' },
];

const COLS = [
  ['sym', 'Symbol', s => `<b>${s.sym}</b><div class="small muted" style="font-weight:400">${s.sector}</div>`, false],
  ['pe', 'P/E', s => s.pe ? s.pe.toFixed(1) : '—', true],
  ['roe', 'ROE %', s => s.roe ? s.roe.toFixed(1) : '—', true],
  ['salesG', 'Sales gr %', s => s.salesG.toFixed(1), true],
  ['divY', 'Yield %', s => s.divY.toFixed(2), true],
  ['ret1y', '1y %', s => `<span style="color:${s.ret1y >= 0 ? 'var(--up)' : 'var(--down)'};font-weight:620">${fmtPct(s.ret1y, 1, true)}</span>`, true],
  ['q', 'Q', s => s.q, true],
  ['v', 'V', s => s.v, true],
  ['mo', 'M', s => s.mo, true],
];

export function renderScreen(main) {
  let preset = PRESETS[0], sortKey = 'q', sortDir = -1;
  let maxPe = 150, minRoe = 0;

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">03 · Screen</div>
      <h1 class="page-title">Discovery machine</h1>
      <p class="page-sub">Q / V / M = quality, value, momentum composites (0–100). Click any row.</p>
    </div>
    <div class="row" style="gap:10px;flex-wrap:wrap;margin-bottom:8px" id="presets">
      ${PRESETS.map(p => `<button class="chip ${p === preset ? 'on' : ''}" data-p="${p.key}">${p.label}</button>`).join('')}
    </div>
    <div class="row" style="gap:22px;flex-wrap:wrap;margin-bottom:14px">
      <label class="small dim">Max P/E <input type="range" id="fPe" min="10" max="150" value="150" style="width:120px;vertical-align:middle;margin-left:8px"> <b id="fPeV" class="tnum">any</b></label>
      <label class="small dim">Min ROE <input type="range" id="fRoe" min="0" max="40" value="0" style="width:120px;vertical-align:middle;margin-left:8px"> <b id="fRoeV" class="tnum">any</b></label>
      <span class="small muted" id="count"></span>
    </div>
    <div class="card" style="overflow-x:auto"><table class="tbl"><thead><tr id="head">
      ${COLS.map(([k, l, , num]) => `<th class="${num ? 'num' : ''}" data-k="${k}" style="cursor:pointer">${l} <span class="muted" data-arrow="${k}"></span></th>`).join('')}
    </tr></thead><tbody id="body"></tbody></table></div>`;

  const paint = () => {
    const rows = STOCKS.filter(preset.f)
      .filter(s => (s.pe || 0) <= maxPe && (s.roe || 0) >= minRoe)
      .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1) * sortDir);
    main.querySelector('#count').textContent = `${rows.length} of ${STOCKS.length}`;
    main.querySelector('#body').innerHTML = rows.map(s =>
      `<tr data-s="${s.sym}" style="cursor:pointer">${COLS.map(([, , fn, num]) => `<td class="${num ? 'num tnum' : ''}">${fn(s)}</td>`).join('')}</tr>`).join('');
    main.querySelectorAll('[data-arrow]').forEach(a => a.textContent = a.dataset.arrow === sortKey ? (sortDir < 0 ? '↓' : '↑') : '');
    main.querySelectorAll('#body tr').forEach(tr => tr.onclick = () => go('stock/' + tr.dataset.s));
  };

  main.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
    preset = PRESETS.find(p => p.key === b.dataset.p);
    main.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x.dataset.p === preset.key));
    paint();
  });
  main.querySelectorAll('#head th').forEach(th => th.onclick = () => {
    const k = th.dataset.k;
    if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = -1; }
    paint();
  });
  main.querySelector('#fPe').oninput = e => { maxPe = +e.target.value; main.querySelector('#fPeV').textContent = maxPe >= 150 ? 'any' : maxPe + 'x'; paint(); };
  main.querySelector('#fRoe').oninput = e => { minRoe = +e.target.value; main.querySelector('#fRoeV').textContent = minRoe <= 0 ? 'any' : minRoe + '%'; paint(); };
  paint();
}
