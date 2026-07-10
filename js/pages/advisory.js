// LIQD — Advisory: the human layer, tier-gated. Product 10 of 10.

import { S, active } from '../state.js';
import { riskScore } from '../engine.js';
import { INVESTOR_TYPES } from '../data.js';
import { fmtINR, fmtPct } from '../util.js';
import { go } from '../app.js';

const TIERS = [
  { key: 'henry', name: 'HENRY', fee: '₹9,000/yr', has: ['Full engine + all ten products', 'Quarterly rebalance alerts', 'IPS + annual policy review (self-serve)'], not: 'Human reviews unlock at HNI' },
  { key: 'hni', name: 'HNI', fee: '₹36,000/yr', has: ['Everything in HENRY', 'Quarterly 45-min review with a SEBI-RIA advisor', 'Tax-harvesting execution calendar', 'PMS/AIF access desk'], not: 'Bespoke mandates unlock at UHNI' },
  { key: 'uhni', name: 'UHNI / Family Office', fee: '₹1,00,000+/yr', has: ['Everything in HNI', 'Dedicated mandate desk, multi-entity book', 'Unlisted & pre-IPO access', 'Estate & structuring reviews', 'Reporting API'], not: null },
];

export function renderAdvisory(main) {
  const m = active();
  const rs = riskScore(S);
  const myTier = ['uhni', 'family'].includes(S.investorType) ? 'uhni' : S.investorType === 'hni' ? 'hni' : 'henry';
  const tier = INVESTOR_TYPES.find(t => t.key === S.investorType);

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">10 · Advisory</div>
      <h1 class="page-title">The human layer</h1>
      <p class="page-sub">The engine runs the portfolio. Humans handle what engines can't: judgment calls, structuring, and you.</p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <div>
          <h3 class="card-title" style="margin-bottom:4px">Your standing review pack</h3>
          <span class="small muted">${tier.label} · risk score ${rs.score}/100 · ${m ? m.label + ' policy at ' + fmtPct(m.mu, 1) + ' expected' : 'no policy deployed yet'}</span>
        </div>
        <span class="row">
          <button class="btn sm ghost" id="toIps">Open IPS →</button>
          <button class="btn primary" id="reqReview">${myTier === 'henry' ? 'Book an intro review' : 'Request quarterly review'}</button>
        </span>
      </div>
      <div class="divider"></div>
      <div class="kv" style="grid-template-columns:auto 1fr;gap:8px 18px">
        <span class="muted small">Agenda</span><span class="small dim">Policy compliance vs bands · realised vs modelled outcomes · life-event changes · tax calendar for the coming quarter${myTier !== 'henry' ? ' · alternates pipeline (PMS/AIF/unlisted)' : ''}</span>
        <span class="muted small">You bring</span><span class="small dim">Nothing. Your blueprint, drift, trades and IPS are already on the advisor's screen — the meeting starts at the decision, not the data-gathering.</span>
        <span class="muted small">Status</span><span class="small dim">Booking rails ship with payments; requests queue locally until then.</span>
      </div>
    </div>

    <div class="grid g3" id="tiers"></div>

    <div class="card" style="margin-top:16px">
      <h3 class="card-title">Where the human beats the engine</h3>
      <div class="kv" style="grid-template-columns:auto 1fr;gap:8px 18px">
        <span class="muted small">Behaviour</span><span class="small dim">The advisor's real job in a −30% quarter is keeping you from firing your own plan.</span>
        <span class="muted small">Structuring</span><span class="small dim">HUF vs individual, gifting to parents in lower slabs, trusts, cross-border moves — rules engines advise, humans decide edge cases.</span>
        <span class="muted small">Access</span><span class="small dim">Allocations in oversubscribed AIFs and pre-IPO blocks are negotiated, not clicked.</span>
        <span class="muted small">Boundaries</span><span class="small dim">Advisors are salaried, SEBI-registered, and paid zero commission — the same conflict-free rule as the engine.</span>
      </div>
    </div>`;

  main.querySelector('#tiers').innerHTML = TIERS.map(t => `
    <div class="card" style="${t.key === myTier ? 'border-color:var(--accent-line)' : ''}">
      <div class="row between"><b>${t.name}</b>${t.key === myTier ? '<span class="badge brand">YOUR TIER</span>' : ''}</div>
      <div style="font-size:22px;font-weight:720;margin:6px 0 10px">${t.fee}</div>
      <div class="small dim" style="line-height:1.8">${t.has.map(h => '· ' + h).join('<br>')}</div>
      ${t.not ? `<div class="small muted" style="margin-top:10px">${t.not}</div>` : ''}
    </div>`).join('');

  main.querySelector('#toIps').onclick = () => go('ips');
  const btn = main.querySelector('#reqReview');
  btn.onclick = () => {
    S.reviewRequested = new Date().toISOString().slice(0, 10);
    btn.textContent = 'Requested ✓ — queued';
    btn.disabled = true;
  };
  if (S.reviewRequested) { btn.textContent = `Requested ${S.reviewRequested} — queued`; btn.disabled = true; }
}
