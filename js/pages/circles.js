// LIQD — Circles: pooled capital for assets one wallet can't reach.
// Demo-grade: joins persist locally; escrow/trustee rails land with the backend.

import { S, save } from '../state.js';
import { fmtINR } from '../util.js';
import { meter } from '../charts.js';

const CIRCLES = [
  { key: 'cre-blr', name: 'Prestige Tech Park — Grade-A floor', kind: 'SM-REIT (fractional CRE)', target: 5e7, ticket: 5e5,
    members: 62, filled: 3.4e7, yield: '8.9% rental + appreciation', lock: '3yr, platform exit window quarterly',
    note: 'Pre-leased to a listed IT tenant, 4.5yr weighted lease.' },
  { key: 'ncd-lot', name: 'AA+ NCD primary lot — 9.4% coupon', kind: 'Bond lot (₹10L face min)', target: 2e7, ticket: 2e5,
    members: 41, filled: 1.55e7, yield: '9.4% annual, monthly payout', lock: '36 months, exchange-listed',
    note: 'Circle splits an institutional lot; each member holds demat units.' },
  { key: 'gold-loan', name: 'Founders\' credit circle — bulk LAS rate', kind: 'Loan against securities (group)', target: 1e8, ticket: 1e6,
    members: 18, filled: 6.2e7, yield: 'Negotiated 9.1% vs 10.5% retail', lock: 'Open credit line, 12mo review',
    note: 'Aggregated collateral gets institutional pricing; each line stays individual.' },
  { key: 'art-01', name: 'Modern masters basket — Husain/Raza', kind: 'Art (fractional, insured, vaulted)', target: 3e7, ticket: 3e5,
    members: 27, filled: 1.2e7, yield: 'Appreciation only — 8–12% modelled', lock: '5yr, auction exit',
    note: 'Authenticated, insured, third-party vault; sale by member quorum.' },
];

export function renderCircles(main) {
  S.circles = S.circles || [];

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">07 · Circles</div>
      <h1 class="page-title">Ten wallets, one asset</h1>
      <p class="page-sub">Pooled access to assets above one ticket size — with quorum, escrow and exit rules set before a rupee moves.</p>
    </div>
    <div class="grid g2" id="grid"></div>
    <div class="card" style="margin-top:16px">
      <h3 class="card-title">How a circle works</h3>
      <div class="kv" style="grid-template-columns:auto 1fr;gap:8px 18px">
        <span class="muted small">1 · Form</span><span class="small dim">Min ticket + member cap + target set upfront; funds sit in escrow until filled.</span>
        <span class="muted small">2 · Hold</span><span class="small dim">Ownership is unitised per member (demat/SPV as the asset requires); statements monthly.</span>
        <span class="muted small">3 · Exit</span><span class="small dim">Exit windows and quorum rules are in the deed — a majority can trigger sale, any member can sell within the circle first.</span>
        <span class="muted small">Status</span><span class="small dim">Demo — escrow and trustee rails ship with the backend phase.</span>
      </div>
    </div>`;

  const grid = main.querySelector('#grid');
  for (const c of CIRCLES) {
    const joined = S.circles.includes(c.key);
    const filled = c.filled + (joined ? c.ticket : 0);
    const pct = Math.min(100, filled / c.target * 100);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="row between"><b style="font-size:15px">${c.name}</b><span class="badge">${c.kind}</span></div>
      <div class="row" style="gap:22px;margin:10px 0;flex-wrap:wrap" >
        <span class="small"><span class="muted">Ticket</span> <b class="tnum">${fmtINR(c.ticket)}</b></span>
        <span class="small"><span class="muted">Members</span> <b class="tnum">${c.members + (joined ? 1 : 0)}</b></span>
        <span class="small"><span class="muted">Returns</span> <b>${c.yield}</b></span>
        <span class="small"><span class="muted">Lock</span> <b>${c.lock}</b></span>
      </div>
      <div class="m"></div>
      <div class="row between small" style="margin-top:6px"><span class="muted">${fmtINR(filled)} of ${fmtINR(c.target)}</span><b class="tnum">${pct.toFixed(0)}%</b></div>
      <p class="small muted" style="margin:8px 0 12px">${c.note}</p>
      <button class="btn sm ${joined ? 'ghost' : 'primary'}" data-k="${c.key}">${joined ? 'Leave circle' : `Join · ${fmtINR(c.ticket)}`}</button>`;
    meter(card.querySelector('.m'), pct, { color: pct >= 100 ? '#0ca30c' : '#0d6a5c', track: 'rgba(26,36,32,0.07)' });
    card.querySelector('button').onclick = () => {
      const i = S.circles.indexOf(c.key);
      i >= 0 ? S.circles.splice(i, 1) : S.circles.push(c.key);
      save(); renderCircles(main);
    };
    grid.appendChild(card);
  }
}
