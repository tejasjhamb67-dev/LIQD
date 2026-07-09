// LIQD — Advantage: the fee-drag receipt + why LIQD exists

import { S, active } from '../state.js';
import { feeDrag, contributionSchedule } from '../engine.js';
import { fmtINR, fmtPct } from '../util.js';
import { lines } from '../charts.js';

const PILLARS = [
  ['Built for HENRYs first', 'Dezerv and every PMS start at ₹50L because SEBI\'s PMS wrapper forces them to. LIQD builds the same institutional discipline on MF/ETF/bond rails — entry at ₹10L, graduation path to PMS/AIF as you grow.'],
  ['Flat fee. Not a % of you.', 'A 1% AUM fee is a 10% tax on a 10% return — forever, compounding against you. LIQD is a subscription: ₹9k–₹1L/yr by tier. As your corpus grows, our fee share of it shrinks to a rounding error.'],
  ['You see the machine', 'Aladdin-grade engine, retail glass box: risk scoring, construction logic, projection math and stress vectors are all on-screen. No "trust our experts" black box.'],
  ['API-first ingestion', 'Zerodha, Groww, Upstox, MF Central, CAS, Account Aggregator, Vested/IBKR — your existing wealth imports in minutes and is analysed against your blueprint, not ignored.'],
  ['Global-native', 'LRS and GIFT City routes are first-class citizens of every model, not an afterthought — because your career, home and income are already 100% long India.'],
  ['Liquidity as a dimension', 'Every product and every blueprint carries a liquidity ladder. Lock-ins are chosen, never discovered.'],
];

export function renderAdvantage(main) {
  const m = active() || { mu: 12 };
  const yrs = Math.max(S.tenure, 10);
  const gross = m.mu;

  const contribs = contributionSchedule(S, yrs);
  const tiers = feeDrag(S.corpus, contribs, gross, yrs, [
    { key: 'liqd', label: 'LIQD flat fee', short: 'LIQD', color: '#0d6a5c', flatFee: tierFee(), pctFee: 0 },
    { key: 'direct', label: 'DIY direct funds', short: 'DIY direct', color: '#2a78d6', pctFee: 0.15 },
    { key: 'pms', label: 'PMS 2% + 20% perf', short: 'PMS', color: '#b97f00', pctFee: 2, perfShare: 20, hurdle: 10 },
    { key: 'regular', label: 'Regular MF (distributor)', short: 'Regular MF', color: '#e34948', pctFee: 1.4 },
  ]);
  const liqd = tiers.find(t => t.key === 'liqd');
  const worst = tiers.reduce((a, b) => a.final < b.final ? a : b);
  const gap = liqd.final - worst.final;

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">LIQD Advantage</div>
      <h1 class="page-title">The fee you don't pay is the alpha you keep</h1>
      <p class="page-sub">Same gross return, same capital. The only variable is who takes a cut.</p>
    </div>

    <div class="card">
      <div class="row between" style="flex-wrap:wrap">
        <h3 class="card-title">Wealth path by fee model</h3>
        <span class="badge brand">Gap vs worst: ${fmtINR(gap)}</span>
      </div>
      <div class="chart-box" id="feeChart"></div>
      <div class="legend" id="feeLegend"></div>
    </div>

    <div class="grid g4" style="margin-top:18px" id="feeTiles"></div>

    <div class="grid g3" style="margin-top:26px" id="pillars"></div>

    <div class="card pad-lg" style="margin-top:18px">
      <h3 class="card-title">Pricing</h3>
      <div class="grid g3">
        ${[
          ['HENRY', '₹9,000/yr', '₹10L–₹1Cr · self-serve engine, all integrations, quarterly rebalance alerts'],
          ['HNI', '₹36,000/yr', '₹1Cr–₹25Cr · + PMS/AIF access, human review each quarter, tax harvesting engine'],
          ['UHNI / Family Office', '₹1,00,000+/yr', '₹25Cr+ · multi-entity, unlisted access, mandates, reporting API'],
        ].map(([t, p, d]) => `<div class="card" style="background:var(--surface-2);box-shadow:none">
          <div class="eyebrow" style="color:var(--ink-3)">${t}</div>
          <div style="font-size:26px;font-weight:750;margin:6px 0">${p}</div>
          <p class="small dim">${d}</p></div>`).join('')}
      </div>
      <p class="small muted" style="margin-top:16px">Zero AUM fees. Zero commissions — direct plans only, always. If we ever earn from a product we recommend, the recommendation is broken. The subscription is the entire business model.</p>
    </div>`;

  lines(main.querySelector('#feeChart'), tiers.map(t => ({ label: t.short, color: t.color, values: t.path })),
    Array.from({ length: yrs + 1 }, (_, i) => i ? 'Y' + i : 'Now'));
  main.querySelector('#feeLegend').innerHTML = tiers.map(t =>
    `<span class="key"><span class="swatch" style="background:${t.color}"></span>${t.label}</span>`).join('');

  main.querySelector('#feeTiles').innerHTML = tiers.map(t => `
    <div class="card stat" style="${t.key === 'liqd' ? 'border-color:var(--accent-line)' : ''}">
      <div class="label">${t.label}</div>
      <div class="value tnum" style="font-size:23px">${fmtINR(t.final)}</div>
      <div class="delta ${t.final === liqd.final ? 'pos' : 'neg'}">${t.final === liqd.final ? 'your path' : fmtINR(t.final - liqd.final, { sign: true }) + ' vs LIQD'}</div>
    </div>`).join('');

  main.querySelector('#pillars').innerHTML = PILLARS.map(([t, d]) => `
    <div class="card">
      <b style="display:block;margin:0 0 6px;font-size:15px">${t}</b>
      <p class="small dim">${d}</p></div>`).join('');
}

function tierFee() {
  return S.investorType === 'henry' ? 9000 : ['uhni', 'family'].includes(S.investorType) ? 100000 : 36000;
}
