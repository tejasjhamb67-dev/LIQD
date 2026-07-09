// LIQD — Scenario Lab: named stress tests against the live blueprint

import { S, active, models } from '../state.js';
import { runScenario } from '../engine.js';
import { SCENARIOS } from '../data.js';
import { el, fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { barsH } from '../charts.js';

export function renderScenario(main) {
  const m = active();
  let sel = SCENARIOS[0];

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Scenario Lab</div>
      <h1 class="page-title">Break it before the market does</h1>
      <p class="page-sub">Aladdin-style stress testing: each scenario is a shock vector across your four asset classes, applied to your live ${m.label} blueprint of ${fmtINR(S.corpus)}.</p>
    </div>

    <div class="grid g3">
      <div class="card">
        <h3 class="card-title">Scenarios</h3>
        <div class="scn-list" id="scnList"></div>
      </div>
      <div class="card span2">
        <div id="scnDetail"></div>
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <h3 class="card-title">All scenarios · portfolio impact on ${fmtINR(S.corpus)}</h3>
      <div class="chart-box" id="scnBars"></div>
      <p class="small muted" style="margin-top:10px">Comparison: the same shocks applied to a 100% equity portfolio would be materially deeper — diversification is the only free lunch, and this chart is the receipt.</p>
    </div>`;

  const list = main.querySelector('#scnList');
  for (const scn of SCENARIOS) {
    const r = runScenario(scn, m.weights, S.corpus, m.mu);
    const b = el('button', 'scn-item' + (scn === sel ? ' on' : ''),
      `<span><b style="font-size:13.5px">${scn.name}</b><div class="small muted">${scn.desc}</div></span>
       <span class="impact" style="color:${r.hitPct < 0 ? 'var(--neg)' : 'var(--up)'}">${fmtPct(r.hitPct, 1, true)}</span>`);
    b.onclick = () => { sel = scn; list.querySelectorAll('.scn-item').forEach(x => x.classList.remove('on')); b.classList.add('on'); paintDetail(); };
    list.appendChild(b);
  }

  function paintDetail() {
    const r = runScenario(sel, m.weights, S.corpus, m.mu);
    const eqOnly = runScenario(sel, { eq: 100, fi: 0, alt: 0, tac: 0 }, S.corpus, 12.5);
    const after = S.corpus + r.impact;
    const d = main.querySelector('#scnDetail');
    d.innerHTML = `
      <div class="eyebrow" style="color:var(--ink-3)">${sel.name}</div>
      <div class="row" style="gap:40px;margin:14px 0 4px;flex-wrap:wrap">
        <div class="stat"><div class="label">Portfolio impact</div>
          <div class="value tnum" style="color:${r.impact < 0 ? 'var(--neg)' : 'var(--up)'};font-size:36px">${fmtINR(r.impact, { sign: true })}</div>
          <div class="delta dim">${fmtPct(r.hitPct, 1, true)} · portfolio becomes ${fmtINR(after)}</div></div>
        <div class="stat"><div class="label">Est. recovery</div>
          <div class="value tnum" style="font-size:36px">${r.recoveryMonths ? r.recoveryMonths + ' mo' : '—'}</div>
          <div class="delta dim">at your ${fmtPct(m.mu, 1)} expected CAGR</div></div>
        <div class="stat"><div class="label">If you were 100% equity</div>
          <div class="value tnum" style="font-size:36px;color:${eqOnly.hitPct < 0 ? 'var(--neg)' : 'var(--up)'}">${fmtPct(eqOnly.hitPct, 1, true)}</div>
          <div class="delta dim">${fmtINR(eqOnly.impact, { sign: true })}</div></div>
      </div>
      <div class="divider"></div>
      <h3 class="card-title">Shock by asset class</h3>
      <div class="chart-box" id="shockBars"></div>
      <p class="small dim" style="margin-top:12px"><b style="color:var(--ink-1)">LIQD playbook:</b> ${playbook(sel, r)}</p>`;
    barsH(d.querySelector('#shockBars'), CLASS_ORDER.map(k => ({
      label: `${CLASS_META[k].label} (${m.weights[k]}%)`,
      value: sel.shocks[k],
      color: sel.shocks[k] < 0 ? '#e66767' : '#199e70',
      note: `Weighted impact ${fmtPct(m.weights[k] * sel.shocks[k] / 100, 1, true)}`,
    })), { max: 55 });
  }

  function playbook(scn, r) {
    if (scn.key === 'melt') return 'Melt-ups punish the under-invested. Your tactical sleeve auto-rides momentum while the rebalancing band trims into strength — you keep the upside without chasing the top.';
    if (r.hitPct > -8) return 'A single-digit hit. Your fixed-income ladder keeps paying through it; the engine flags this as a hold-and-harvest event, not a portfolio emergency.';
    if (r.hitPct > -18) return `Drawdown funded response: the ${m.weights.fi}% fixed-income sleeve becomes dry powder. LIQD triggers a rebalance alert to buy equity at the lows — the mechanism that turned 2020 into a generational entry.`;
    return 'Deep stress. The liquidity ladder means nothing must be fire-sold; gold and sovereign sleeves cushion, and staged re-entry rules deploy fixed income into equities in tranches on the way down.';
  }

  // all-scenarios chart
  barsH(main.querySelector('#scnBars'), SCENARIOS.map(scn => {
    const r = runScenario(scn, m.weights, S.corpus, m.mu);
    return { label: scn.name, value: r.hitPct, color: r.hitPct < 0 ? '#e66767' : '#199e70', note: fmtINR(r.impact, { sign: true }) };
  }), { max: 40 });

  paintDetail();
}
