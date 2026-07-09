// LIQD — Investment Policy Statement: the printable mandate document.
// Everything the client agreed to, on one page, generated from live state.

import { S, active } from '../state.js';
import { riskScore, contributionSchedule, simulate, goalProbabilityMC, glideSchedule, riskContributions, runScenario } from '../engine.js';
import { INVESTOR_TYPES, GOALS, TOLERANCE, CONSTRAINTS, SCENARIOS } from '../data.js';
import { esc, fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';

const BAND = 5;

export function renderIPS(main) {
  const m = active();
  const rs = riskScore(S);
  const tier = INVESTOR_TYPES.find(t => t.key === S.investorType);
  const goal = GOALS.find(g => g.key === S.goalType);
  const tol = TOLERANCE.find(t => t.v === S.tolerance);
  const sched = contributionSchedule(S, S.tenure);
  const g = S.glide ? glideSchedule(m, m.weights, S.tenure) : null;
  const sim = simulate(S.corpus, sched,
    g ? g.rows.map(r => r.mu) : m.mu,
    g ? g.rows.map(r => r.sigma) : m.sigma, S.tenure);
  const end = sim.rows[sim.rows.length - 1];
  const gp = goalProbabilityMC(sim.terminal, S.goalAmount);
  const rc = riskContributions(m.sleeves);
  const worst = SCENARIOS.filter(s => s.key !== 'melt')
    .map(s => ({ s, r: runScenario(s, m.weights, S.corpus, m.mu) }))
    .sort((a, b) => a.r.impact - b.r.impact)[0];
  const totalIn = S.corpus + sched.reduce((s, r) => s + r.annual, 0);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = S.client.name || 'Client';

  const row = (l, v) => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line-soft)"><span class="dim">${l}</span><b class="tnum" style="text-align:right">${v}</b></div>`;

  main.innerHTML = `
    <div class="page-head no-print">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <div>
          <div class="eyebrow">Policy Statement</div>
          <h1 class="page-title">Your mandate, on one page</h1>
          <p class="page-sub">The Investment Policy Statement is the contract between you and your own plan — the document you re-read in a drawdown instead of panic-selling. Generated live from your blueprint; print it, sign it, keep it.</p>
        </div>
        <button class="btn primary" id="printBtn">Print / save as PDF</button>
      </div>
    </div>

    <div class="card pad-lg ips-doc" id="ipsDoc">
      <div class="row between" style="align-items:flex-start">
        <div>
          <div style="font-weight:800;font-size:19px;letter-spacing:0.22em;color:var(--accent)">LIQD</div>
          <div class="small muted" style="letter-spacing:0.12em">INVESTMENT POLICY STATEMENT</div>
        </div>
        <div class="small muted" style="text-align:right">Prepared for<br><b style="color:var(--ink-1);font-size:15px">${esc(name)}</b><br>${today}</div>
      </div>
      <div class="divider"></div>

      <div class="grid g2" style="gap:26px">
        <div>
          <h3 class="card-title">1 · Mandate</h3>
          ${row('Investor profile', `${tier.label}, age ${S.client.age}`)}
          ${row('Objective', goal.label)}
          ${row('Investment horizon', S.tenure + ' years')}
          ${row('Initial corpus', fmtINR(S.corpus))}
          ${row('Systematic investment', `${fmtINR(S.monthly)}/mo, +${S.stepUp}%/yr`)}
          ${S.incomeEvents.length ? row('Income events', S.incomeEvents.map(e => `Y${e.year} +${e.pct}%`).join(' · ')) : ''}
          ${row('Total planned capital', fmtINR(totalIn))}
          ${S.goalAmount ? row('Target', `${fmtINR(S.goalAmount)} (${gp}% modelled probability)`) : ''}

          <h3 class="card-title" style="margin-top:22px">2 · Risk profile</h3>
          ${row('LIQD risk score', rs.score + ' / 100')}
          ${row('Capacity · Willingness', `${rs.capacity} · ${rs.willingness}`)}
          ${row('Declared drawdown tolerance', '−' + tol.dd + '%')}
          ${row('Modelled stress drawdown', m.maxDD + '%')}
          ${row('Worst stress scenario', `${worst.s.name}: ${fmtPct(worst.r.hitPct, 1)}`)}

          <h3 class="card-title" style="margin-top:22px">3 · Constraints</h3>
          <div class="small dim">${S.constraints.length
            ? S.constraints.map(k => '· ' + (CONSTRAINTS.find(c => c.key === k) || {}).label).join('<br>')
            : 'No client-imposed constraints.'}</div>
        </div>

        <div>
          <h3 class="card-title">4 · Policy allocation — ${m.label}${m.customized ? ' (customised)' : ''}</h3>
          <table class="tbl"><thead><tr><th>Class</th><th class="num">Target</th><th class="num">Band</th><th class="num">Risk share</th></tr></thead>
          <tbody>${CLASS_ORDER.map(k => `<tr>
            <td><span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label}</span></td>
            <td class="num">${m.weights[k]}%</td>
            <td class="num">±${BAND} pts</td>
            <td class="num">${rc[k].toFixed(0)}%</td></tr>`).join('')}</tbody></table>
          <div class="small muted" style="margin-top:8px">Expected ${fmtPct(m.mu, 1)} CAGR · ${fmtPct(m.sigma, 1)} volatility · Sharpe ${m.sharpe}. Median modelled outcome at year ${S.tenure}: <b style="color:var(--ink-1)">${fmtINR(end.p50)}</b> (stress case ${fmtINR(end.p10)}).</div>

          <h3 class="card-title" style="margin-top:22px">5 · Glide path</h3>
          <div class="small dim">${g
            ? `Enabled. From year ${g.startYear}, equity steps from ${m.weights.eq}% to 28% over ${g.window} years, landing at ${CLASS_ORDER.map(k => `${g.rows[g.rows.length - 1].weights[k]}%`).join(' / ')} (Eq/FI/Alt/Tac) — protecting the largest corpus from sequence-of-returns risk.`
            : 'Disabled. The policy mix is held for the full horizon; revisit as the goal date approaches.'}</div>

          <h3 class="card-title" style="margin-top:22px">6 · Rebalancing & review protocol</h3>
          <div class="small dim">
            · Rebalance when any class drifts beyond ±${BAND} pts of target, or quarterly — whichever comes first.<br>
            · Trades sequence realised gains against the ₹1.25L annual LTCG exemption; arbitrage funds bridge debt exposure for tax efficiency.<br>
            · Linked external accounts are counted in drift monitoring; external positions migrate staged, never fire-sold.<br>
            · Full policy review annually, or on any material life event (income change beyond planned events, new goal, liquidity need).
          </div>

          <h3 class="card-title" style="margin-top:22px">7 · Fees</h3>
          <div class="small dim">Flat subscription of <b style="color:var(--ink-1)">${fmtINR(tierFee())}/yr</b> (${tier.label} tier). Zero AUM fees, zero commissions, direct plans only. No product in this policy pays LIQD anything.</div>
        </div>
      </div>

      <div class="divider"></div>
      <h3 class="card-title">8 · The commitment</h3>
      <p class="small dim" style="max-width:none">This policy was constructed from my own inputs on ${today}, including my declared tolerance of a −${tol.dd}% drawdown. Market declines within the modelled range (stress case ${m.maxDD}%) are expected behaviour of this portfolio, not a failure of the plan. I will act on drift, on schedule, or on changed circumstances — not on headlines.</p>
      <div class="row" style="gap:60px;margin-top:34px">
        <div style="flex:1"><div style="border-top:1px solid var(--baseline);padding-top:6px" class="small muted">${esc(name)}</div></div>
        <div style="flex:1"><div style="border-top:1px solid var(--baseline);padding-top:6px" class="small muted">Date</div></div>
      </div>
      <p class="small muted" style="margin-top:26px">All figures are model assumptions, not guarantees. LIQD provides tooling and research; this document is not a substitute for SEBI-registered investment advice. Assumptions and construction logic: see Blueprint · Construction.</p>
    </div>`;

  main.querySelector('#printBtn').onclick = () => window.print();
}

function tierFee() {
  return S.investorType === 'henry' ? 9000 : ['uhni', 'family'].includes(S.investorType) ? 100000 : 36000;
}
