// LIQD — Strategies: rules-based playbooks. Rules on-screen, stats honest,
// deployment capped by the tactical sleeve of your policy.

import { S, active } from '../state.js';
import { fmtINR } from '../util.js';
import { go } from '../app.js';

const STRATS = [
  { key: 'momo', name: 'Momentum Rotation', risk: 'High', cagr: '15–20%', dd: '−28%', win: '58%', hold: 'Monthly',
    rules: ['Rank NSE-200 by 6m + 12m return, skip last month', 'Hold top 20, equal weight', 'Rebalance monthly; exit on rank > 60', 'Hard off-switch: index below 200-DMA → 50% cash'],
    works: 'Trending markets (2014, 2017, 2021, 2024)', bleeds: 'Sharp reversals and choppy sideways years — whipsaw is the fee.' },
  { key: 'cc', name: 'Covered Call Income', risk: 'Medium', cagr: '10–13%', dd: '−14%', win: '71%', hold: 'Monthly cycle',
    rules: ['Hold index ETF core', 'Sell monthly ~4% OTM calls on 60% of holding', 'Roll at 21 DTE or 80% max profit', 'No calls when India VIX > 20'],
    works: 'Flat and grinding-up markets', bleeds: 'Melt-ups — you keep the premium, cap the rally.' },
  { key: 'arb', name: 'Arbitrage Carry', risk: 'Low', cagr: '6.5–7.5%', dd: '−1%', win: '96%', hold: 'Continuous',
    rules: ['Cash-futures basis capture via arbitrage funds', 'Equity taxation on cash-like risk', 'Parking sleeve for planned deployments and rebalance bridges'],
    works: 'Always on — this is the cash sleeve done right', bleeds: 'Never meaningfully; it just underwhelms in bull runs.' },
  { key: 'barbell', name: 'Index + Gold Barbell', risk: 'Medium', cagr: '11–13%', dd: '−18%', win: '64%', hold: 'Quarterly',
    rules: ['70% Nifty index / 30% gold ETF', 'Rebalance on ±5pt band breach', 'No discretion, no forecasts — the band does the buying'],
    works: 'Crisis years — gold bid cushions equity drawdowns (2008, 2020, 2022)', bleeds: 'Long equity-only bull runs where gold drags.' },
  { key: 'special', name: 'Special Situations', risk: 'High', cagr: '12–18%', dd: '−22%', win: '52%', hold: 'Event-based',
    rules: ['Buybacks at >10% premium, demergers, index-inclusion candidates', 'Max 5% per event, 4–6 concurrent', 'Exit at event completion — thesis expires, position expires'],
    works: 'Independent of market direction — event alpha', bleeds: 'Deal breaks and regulatory delays.' },
  { key: 'esop', name: 'ESOP / RSU Unwind', risk: 'Custom', cagr: 'Risk removal', dd: 'Cuts tail risk', win: '—', hold: '12–24 months',
    rules: ['Sell 1/12th of vested position monthly — no price opinions', 'Route proceeds into the policy mix same day', 'Accelerate on any single-stock weight > 25% of net worth', 'Tax-aware: sequence across FYs against the LTCG exemption'],
    works: 'Every professional with concentrated employer stock', bleeds: 'Feels wrong when your stock keeps ripping. That is survivorship talking.' },
];

export function renderStrategies(main) {
  const m = active();
  const tacBudget = S.corpus * (m ? m.weights.tac : 5) / 100;

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">04 · Strategies</div>
      <h1 class="page-title">Playbooks, not tips</h1>
      <p class="page-sub">Rules on-screen. Deployment capped by your tactical sleeve: <b class="tnum" style="color:var(--ink-1)">${fmtINR(tacBudget)}</b> (${m ? m.weights.tac : 5}% of policy).</p>
    </div>
    <div class="grid g2" id="grid"></div>`;

  const grid = main.querySelector('#grid');
  for (const st of STRATS) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row between"><b style="font-size:15px">${st.name}</b>
        <span class="badge ${st.risk === 'High' ? '' : st.risk === 'Low' ? 'brand' : ''}">${st.risk} risk</span></div>
      <div class="row" style="gap:20px;margin:10px 0;flex-wrap:wrap">
        <span class="small"><span class="muted">Illustrative CAGR</span> <b class="tnum">${st.cagr}</b></span>
        <span class="small"><span class="muted">Worst DD</span> <b class="tnum" style="color:var(--down)">${st.dd}</b></span>
        <span class="small"><span class="muted">Hit rate</span> <b class="tnum">${st.win}</b></span>
        <span class="small"><span class="muted">Cycle</span> <b>${st.hold}</b></span>
      </div>
      <div class="small dim" style="line-height:1.7">${st.rules.map(r => '· ' + r).join('<br>')}</div>
      <div class="divider" style="margin:12px 0"></div>
      <div class="kv" style="grid-template-columns:auto 1fr;gap:6px 14px">
        <span class="muted small">Works in</span><span class="small dim">${st.works}</span>
        <span class="muted small">Bleeds in</span><span class="small dim">${st.bleeds}</span>
      </div>
      <button class="btn sm" style="margin-top:14px" data-k="${st.key}">Size in Studio →</button>`;
    card.querySelector('button').onclick = () => go('rebalance');
    grid.appendChild(card);
  }
}
