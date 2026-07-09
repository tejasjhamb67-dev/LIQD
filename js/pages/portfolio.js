// LIQD — Portfolio: the four asset classes, every sleeve, liquidity ladder

import { S, active } from '../state.js';
import { fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { donut, allocStrip } from '../charts.js';
import { go } from '../app.js';

const CLASS_NOTES = {
  eq: 'The growth engine. Domestic core + satellite, with a USD sleeve so your wealth is not a single-country bet.',
  fi: 'The ballast. Sovereign and high-grade credit ladders that pay you to wait — and fund equity buys in crashes.',
  alt: 'The diversifier. Real assets, gold and private markets that move on different cycles from your stocks.',
  tac: 'The opportunist. A capped sleeve for rules-based momentum, income overlays and special situations.',
};

const LIQ_MAP = {
  eq_large: 'T+1', eq_flexi: 'T+2', eq_small: 'T+2', eq_intl: 'T+2 (US)',
  fi_gilt: 'T+1', fi_corp: 'T+1', fi_credit: '3–4yr lock', fi_arb: 'T+1',
  alt_reit: 'T+1', alt_gold: 'T+1', alt_aif: '4–6yr lock', alt_unlisted: 'Illiquid',
  tac_momo: 'T+1', tac_cc: 'Monthly', tac_special: 'T+1',
};

export function renderPortfolio(main) {
  const m = active();
  const sleeves = m.sleeves.filter(s => s.pct > 0.05);

  // liquidity ladder buckets
  const buckets = { 'T+0 – T+2': 0, 'Within a month': 0, 'Lock-in / illiquid': 0 };
  for (const s of sleeves) {
    const l = LIQ_MAP[s.key] || 'T+2';
    if (l.includes('lock') || l.includes('Illiquid')) buckets['Lock-in / illiquid'] += s.pct;
    else if (l === 'Monthly') buckets['Within a month'] += s.pct;
    else buckets['T+0 – T+2'] += s.pct;
  }

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Portfolio</div>
      <h1 class="page-title">${m.label} blueprint${m.customized ? ' · customised' : ''}</h1>
      <p class="page-sub">${fmtINR(S.corpus)} · ${sleeves.length} sleeves · ${fmtPct(m.mu, 1)} expected at ${fmtPct(m.sigma, 1)} vol.</p>
    </div>

    <div class="grid g4" id="classCards"></div>

    <div class="card" style="margin-top:18px">
      <div class="row between"><h3 class="card-title">Every sleeve</h3>
        <span class="row"><button class="btn sm ghost" id="toU">Browse universe →</button><button class="btn sm" id="toR">Rebalance →</button></span></div>
      <table class="tbl"><thead><tr><th>Sleeve</th><th>What's inside</th><th class="num">Weight</th><th class="num">Value</th><th class="num">Exp. return</th><th class="num">Vol</th><th>Liquidity</th></tr></thead>
        <tbody id="sleeveRows"></tbody></table>
    </div>

    <div class="grid g2" style="margin-top:18px">
      <div class="card">
        <h3 class="card-title">Liquidity ladder — the LIQD lens</h3>
        <p class="small muted" style="margin-bottom:14px">How fast this turns back into money.</p>
        <div id="liqRows"></div>
      </div>
      <div class="card">
        <h3 class="card-title">Global sleeve & LRS</h3>
        <div id="lrsBox"></div>
      </div>
    </div>`;

  // class cards
  const cc = main.querySelector('#classCards');
  for (const k of CLASS_ORDER) {
    const cs = sleeves.filter(s => s.cls === k);
    const w = m.weights[k];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row between"><span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span><b>${CLASS_META[k].label}</b></span>
        <b class="tnum" style="font-size:20px">${w}%</b></div>
      <div class="muted small tnum" style="margin:2px 0 10px">${fmtINR(S.corpus * w / 100)}</div>
      <div class="strip"></div>
      <p class="small muted" style="margin-top:10px">${CLASS_NOTES[k]}</p>`;
    allocStrip(card.querySelector('.strip'),
      cs.map((s, i) => ({ label: s.name, value: w ? s.pct / w * 100 : 0, color: shade(CLASS_META[k].hex, i, cs.length) })));
    cc.appendChild(card);
  }

  // sleeve table
  main.querySelector('#sleeveRows').innerHTML = sleeves.sort((a, b) => b.pct - a.pct).map(s => `
    <tr><td><span class="key"><span class="swatch" style="background:${CLASS_META[s.cls].hex}"></span>${s.name}</span></td>
    <td class="small">${s.note}</td>
    <td class="num">${s.pct.toFixed(1)}%</td>
    <td class="num">${fmtINR(S.corpus * s.pct / 100)}</td>
    <td class="num">${s.ret.toFixed(1)}%</td>
    <td class="num">${s.vol.toFixed(0)}%</td>
    <td class="small">${LIQ_MAP[s.key] || 'T+2'}</td></tr>`).join('');

  // liquidity ladder
  const colors = { 'T+0 – T+2': '#1baf7a', 'Within a month': '#b97f00', 'Lock-in / illiquid': '#4a3aa7' };
  main.querySelector('#liqRows').innerHTML = Object.entries(buckets).map(([k, v]) => `
    <div style="padding:10px 0;border-bottom:1px solid var(--line-soft)">
      <div class="row between small"><span class="dim">${k}</span><b class="tnum">${v.toFixed(0)}% · ${fmtINR(S.corpus * v / 100)}</b></div>
      <div style="height:8px;border-radius:6px;background:rgba(26,36,32,0.06);margin-top:7px;overflow:hidden">
        <div style="height:100%;width:${v}%;background:${colors[k]};border-radius:6px"></div></div></div>`).join('');

  // LRS box
  const intl = sleeves.find(s => s.key === 'eq_intl');
  const lrs = main.querySelector('#lrsBox');
  if (intl) {
    const usd = S.corpus * intl.pct / 100;
    lrs.innerHTML = `
      <div class="hero-num" style="font-size:34px">${fmtINR(usd)}</div>
      <div class="small dim" style="margin:2px 0 14px">allocated to global equity (${intl.pct.toFixed(1)}%)</div>
      <div class="stack small dim" style="gap:10px">
        <div>· <b style="color:var(--ink-1)">LRS route:</b> $250,000/person/FY limit. Your sleeve uses ~${Math.min(100, Math.round(usd / 85 / 250000 * 100))}% of one year's window — TCS of 20% above ₹10L applies (adjustable against tax).</div>
        <div>· <b style="color:var(--ink-1)">GIFT City route:</b> inbound funds with no LRS consumption for eligible structures — unlocked at HNI tier.</div>
        <div>· <b style="color:var(--ink-1)">Why it matters:</b> your income, home and job are already long India. The USD sleeve hedges single-country and currency risk${S.goalType === 'education' ? ' — and matches your USD education liability' : ''}.</div>
      </div>`;
  } else {
    lrs.innerHTML = `<p class="small dim">Your constraints exclude international exposure. The engine folded the global sleeve into domestic equity. <button class="btn sm ghost" id="editC">Revisit constraints →</button></p>`;
    lrs.querySelector('#editC').onclick = () => go('blueprint');
  }

  main.querySelector('#toU').onclick = () => go('universe');
  main.querySelector('#toR').onclick = () => go('rebalance');
}

// lighten a hex color stepwise for intra-class strips
function shade(hex, i, n) {
  const f = 1 - i / Math.max(n, 2) * 0.5;   // step toward the light page for later sleeves
  const c = parseInt(hex.slice(1), 16);
  const r = Math.round(((c >> 16) & 255) * f + 244 * (1 - f));
  const g = Math.round(((c >> 8) & 255) * f + 245 * (1 - f));
  const b = Math.round((c & 255) * f + 242 * (1 - f));
  return `rgb(${r},${g},${b})`;
}
