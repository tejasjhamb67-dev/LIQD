// LIQD — Rebalancing Studio: policy bands, whole-portfolio drift, live what-if,
// efficient frontier, risk contributions, and an executable trade list with tax math.

import { S, save, models, active } from '../state.js';
import { statsForWeights, simulate, goalProbabilityMC, contributionSchedule, riskContributions, frontier } from '../engine.js';
import { DEMO_IMPORT } from '../data.js';
import { fmtINR, fmtPct, clamp, CLASS_META, CLASS_ORDER } from '../util.js';
import { donut, scatter, barsH } from '../charts.js';
import { go } from '../app.js';

const BAND = 5; // policy band: ± percentage points per asset class

export function renderRebalance(main) {
  const base = models()[S.chosenModel];
  const target = S.customWeights || base.weights;   // current policy
  let w = { ...target };                            // draft being edited

  // whole-portfolio view: LIQD corpus + imported external holdings
  const external = S.connections.flatMap(k => DEMO_IMPORT[k] || []);
  const extTotal = external.reduce((s, h) => s + h.value, 0);
  const combined = { eq: 0, fi: 0, alt: 0, tac: 0 };
  for (const c of CLASS_ORDER) combined[c] = S.corpus * target[c] / 100;
  for (const h of external) combined[h.cls] += h.value;
  const wholeTotal = S.corpus + extTotal;
  const wholePct = Object.fromEntries(CLASS_ORDER.map(c => [c, +(100 * combined[c] / wholeTotal).toFixed(1)]));

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Rebalancing Studio</div>
      <h1 class="page-title">Test the change before you make it</h1>
      <p class="page-sub">Institutional practice: define a policy, allow drift inside bands, rebalance with a trade list and a tax estimate — never on impulse. Move the levers; the engine reprices risk, return and goal odds live.</p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="row between" style="flex-wrap:wrap">
        <h3 class="card-title" style="margin:0">Policy compliance — whole portfolio${extTotal ? ' (incl. linked accounts)' : ''}</h3>
        <span class="small muted">Band: target ± ${BAND} pts · quarterly review or band breach, whichever first</span>
      </div>
      <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Asset class</th><th class="num">Policy target</th><th class="num">Actual${extTotal ? ' (incl. external)' : ''}</th><th class="num">Drift</th><th>Status</th></tr></thead>
      <tbody>${CLASS_ORDER.map(c => {
        const actual = extTotal ? wholePct[c] : target[c];
        const drift = +(actual - target[c]).toFixed(1);
        const st = Math.abs(drift) > BAND ? 'breach' : Math.abs(drift) > BAND * 0.6 ? 'watch' : 'ok';
        const lbl = { ok: 'In band', watch: 'Approaching band', breach: 'Band breached — rebalance' }[st];
        return `<tr><td><span class="key"><span class="swatch" style="background:${CLASS_META[c].hex}"></span>${CLASS_META[c].label}</span></td>
          <td class="num">${target[c]}%</td><td class="num">${actual}%</td>
          <td class="num">${drift > 0 ? '+' : ''}${drift} pts</td>
          <td><span class="band-pill ${st}">${lbl}</span></td></tr>`;
      }).join('')}</tbody></table></div>
      ${extTotal ? `<p class="small muted" style="margin-top:10px">${fmtINR(extTotal)} of linked external holdings are counted here. The trade list below rebalances the LIQD-managed corpus; external positions are flagged for staged migration instead of forced sales.</p>`
        : `<p class="small muted" style="margin-top:10px">Link your broker and MF accounts in Integrations to monitor drift across everything you own, not just the LIQD-managed corpus.</p>`}
    </div>

    <div class="grid g3">
      <div class="card span2">
        <div class="row between"><h3 class="card-title">Draft allocation</h3>
          <span class="row">
            <button class="btn sm ghost" id="rbReset">Reset to policy</button>
            <button class="btn sm" data-preset="conservative">Conservative</button>
            <button class="btn sm" data-preset="balanced">Balanced</button>
            <button class="btn sm" data-preset="aggressive">Aggressive</button>
          </span></div>
        <div id="rbRows"></div>
        <div class="row between small" style="margin-top:12px">
          <span class="muted">Weights auto-normalise to 100%; sleeves scale proportionally inside each class.</span>
          <b id="rbTotal" class="tnum"></b></div>
      </div>
      <div class="card">
        <h3 class="card-title">Draft pricing</h3>
        <div class="chart-box" id="rbDonut" style="margin-bottom:10px"></div>
        <div id="rbStats"></div>
      </div>
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <h3 class="card-title">Risk–return plane — where your draft sits</h3>
        <div class="chart-box" id="rbFrontier"></div>
        <p class="small muted" style="margin-top:10px">Grey dots are every feasible class mix under policy guardrails (alternatives ≤ 30%, tactical ≤ 15%). The upper-left edge is the efficient frontier: more return per unit of risk. If your draft sits inside the cloud, a better mix exists at the same risk.</p>
      </div>
      <div class="card">
        <h3 class="card-title">Where the risk actually comes from</h3>
        <div class="chart-box" id="rbRisk"></div>
        <p class="small muted" style="margin-top:10px">Share of portfolio variance by asset class. Equity typically contributes far more risk than its weight — this is what an allocation choice really decides.</p>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="row between"><h3 class="card-title">Execution — before → after</h3>
        <button class="btn primary" id="rbCommit">Commit rebalance</button></div>
      <table class="tbl"><thead><tr><th>Metric</th><th class="num">Current policy</th><th class="num">Draft</th><th class="num">Δ</th></tr></thead>
      <tbody id="cmpRows"></tbody></table>
      <div class="divider"></div>
      <h3 class="card-title">Trade list (LIQD-managed corpus ${fmtINR(S.corpus)})</h3>
      <div id="tradeList"></div>
      <div class="small dim" id="taxNote" style="margin-top:12px"></div>
    </div>`;

  /* ----- sliders ----- */
  const rows = main.querySelector('#rbRows');
  const sliders = {};
  for (const k of CLASS_ORDER) {
    const r = document.createElement('div');
    r.className = 'rb-row';
    r.innerHTML = `<span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label}</span>
      <input type="range" min="0" max="90" step="1" value="${w[k]}" data-k="${k}" aria-label="${CLASS_META[k].label} weight">
      <span class="pct" id="pct-${k}">${w[k]}%</span>`;
    rows.appendChild(r);
    sliders[k] = r.querySelector('input');
  }

  function normalize(changed) {
    const others = CLASS_ORDER.filter(k => k !== changed);
    const rem = 100 - w[changed];
    const sum = others.reduce((s, k) => s + w[k], 0) || 1;
    others.forEach(k => w[k] = Math.round(rem * w[k] / sum));
    const drift = 100 - CLASS_ORDER.reduce((s, k) => s + w[k], 0);
    const big = others.sort((a, b) => w[b] - w[a])[0];
    w[big] += drift;
  }

  /* ----- static frontier cloud (computed once) ----- */
  const cloud = frontier(base);
  const M = models();

  const cur = active();
  const sched = contributionSchedule(S, S.tenure);
  const simCur = simulate(S.corpus, sched, cur.mu, cur.sigma, S.tenure, { sims: 1500 });

  function paint() {
    const st = statsForWeights(base, w);
    const simNew = simulate(S.corpus, sched, st.mu, st.sigma, S.tenure, { sims: 1500 });
    const endNew = simNew.rows[simNew.rows.length - 1].p50;
    const endCur = simCur.rows[simCur.rows.length - 1].p50;
    const gpNew = goalProbabilityMC(simNew.terminal, S.goalAmount);
    const gpCur = goalProbabilityMC(simCur.terminal, S.goalAmount);

    for (const k of CLASS_ORDER) {
      sliders[k].value = w[k];
      main.querySelector(`#pct-${k}`).textContent = w[k] + '%';
    }
    main.querySelector('#rbTotal').textContent = CLASS_ORDER.reduce((s, k) => s + w[k], 0) + '% total';

    donut(main.querySelector('#rbDonut'), CLASS_ORDER.map(k => ({ label: CLASS_META[k].label, value: w[k], color: CLASS_META[k].hex })),
      { size: 170, thick: 20, centerValue: fmtPct(st.mu, 1), centerLabel: 'EXP. CAGR' });

    main.querySelector('#rbStats').innerHTML = [
      ['Expected CAGR', fmtPct(st.mu, 1)],
      ['Volatility', fmtPct(st.sigma, 1)],
      ['Stress drawdown', st.maxDD + '%'],
      ['Sharpe', st.sharpe],
      [`Median · year ${S.tenure}`, fmtINR(endNew)],
      ...(gpNew != null ? [['Goal probability', gpNew + '%']] : []),
    ].map(([l, v]) => `<div class="row between small" style="padding:7px 0;border-bottom:1px solid var(--line-soft)"><span class="dim">${l}</span><b class="tnum">${v}</b></div>`).join('');

    // frontier with model + draft markers
    // hide a model's label when the draft sits on top of it — the draft label wins
    const near = m2 => Math.abs(m2.sigma - st.sigma) < 1.2 && Math.abs(m2.mu - st.mu) < 0.5;
    scatter(main.querySelector('#rbFrontier'), cloud, [
      ...[['conservative', 'Conservative', '#1baf7a'], ['balanced', 'Balanced', '#2a78d6'], ['aggressive', 'Aggressive', '#4a3aa7']]
        .map(([k, label, color]) => ({ sigma: M[k].sigma, mu: M[k].mu, label: near(M[k]) ? '' : label, color, dx: -11 })),
      { sigma: st.sigma, mu: st.mu, label: 'Your draft', color: '#0d6a5c', dy: -12 },
    ]);

    // risk contribution: current vs draft
    const rcCur = riskContributions(cur.sleeves);
    const rcNew = riskContributions(st.sleeves);
    barsH(main.querySelector('#rbRisk'), CLASS_ORDER.flatMap(c => [
      { label: `${CLASS_META[c].label} — now`, value: rcCur[c], color: CLASS_META[c].hex, note: `weight ${cur.weights?.[c] ?? target[c]}%` },
      { label: `draft`, value: rcNew[c], color: CLASS_META[c].hex + '66', note: `weight ${w[c]}%` },
    ]), { max: 100, fmt: v => v.toFixed(0) + '%' });

    // before → after metrics
    const dRow = (l, a, b, fmt = x => x, goodUp = true) => {
      const d = b - a;
      const cls = Math.abs(d) < 1e-9 ? 'dim' : (d > 0) === goodUp ? 'delta pos' : 'delta neg';
      return `<tr><td>${l}</td><td class="num">${fmt(a)}</td><td class="num">${fmt(b)}</td><td class="num"><span class="${cls}">${d > 0 ? '+' : ''}${fmt(+d.toFixed(2))}</span></td></tr>`;
    };
    main.querySelector('#cmpRows').innerHTML = [
      dRow('Expected CAGR %', cur.mu, st.mu),
      dRow('Volatility %', cur.sigma, st.sigma, x => x, false),
      dRow('Stress drawdown %', cur.maxDD, st.maxDD),
      dRow('Sharpe', cur.sharpe, st.sharpe),
      dRow(`Median wealth yr ${S.tenure}`, endCur, endNew, fmtINR),
      ...(gpNew != null && gpCur != null ? [dRow('Goal probability %', gpCur, gpNew)] : []),
    ].join('');

    // trade list at sleeve level
    const trades = [];
    for (const sNew of st.sleeves) {
      const sCur = cur.sleeves.find(x => x.key === sNew.key);
      const delta = S.corpus * ((sNew.pct - (sCur ? sCur.pct : 0)) / 100);
      if (Math.abs(delta) >= S.corpus * 0.002) trades.push({ name: sNew.name, cls: sNew.cls, delta });
    }
    trades.sort((a, b) => a.delta - b.delta);
    const sells = trades.filter(t => t.delta < 0), buys = trades.filter(t => t.delta > 0);
    const turnover = sells.reduce((s, t) => s - t.delta, 0);
    main.querySelector('#tradeList').innerHTML = trades.length
      ? `<table class="tbl"><thead><tr><th>Action</th><th>Sleeve</th><th class="num">Amount</th></tr></thead><tbody>
        ${trades.map(t => `<tr><td><span class="band-pill ${t.delta < 0 ? 'breach' : 'ok'}">${t.delta < 0 ? 'SELL' : 'BUY'}</span></td>
          <td><span class="key"><span class="swatch" style="background:${CLASS_META[t.cls].hex}"></span>${t.name}</span></td>
          <td class="num">${fmtINR(Math.abs(t.delta))}</td></tr>`).join('')}</tbody></table>`
      : '<p class="small muted">Draft matches current policy — nothing to trade.</p>';

    if (trades.length) {
      // tax estimate: assume ~12% embedded gains on equity-taxed sells, LTCG 12.5% above ₹1.25L exemption
      const gainRealised = sells.reduce((s, t) => s - t.delta, 0) * 0.12;
      const taxable = Math.max(0, gainRealised - 125000);
      const ltcg = taxable * 0.125;
      main.querySelector('#taxNote').innerHTML =
        `Turnover ${fmtINR(turnover)} (${(100 * turnover / S.corpus).toFixed(1)}% of corpus). Estimated realised gains ~${fmtINR(gainRealised)} assuming 12% embedded appreciation — ` +
        (ltcg > 0
          ? `≈ <b style="color:var(--ink-1)">${fmtINR(ltcg)} LTCG tax</b> after the ₹1.25L annual exemption. The engine sequences sells across financial years and uses arbitrage funds as the bridge where it cuts the bill.`
          : `fits inside the <b style="color:var(--ink-1)">₹1.25L annual LTCG exemption</b> — this rebalance is effectively tax-free if executed this financial year.`);
    } else main.querySelector('#taxNote').textContent = '';
  }

  CLASS_ORDER.forEach(k => sliders[k].oninput = e => {
    w[k] = clamp(+e.target.value, 0, 90);
    normalize(k);
    paint();
  });
  main.querySelector('#rbReset').onclick = () => { w = { ...target }; paint(); };
  main.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { w = { ...models()[b.dataset.preset].weights }; paint(); });
  main.querySelector('#rbCommit').onclick = () => {
    const same = CLASS_ORDER.every(k => w[k] === base.weights[k]);
    S.customWeights = same ? null : { ...w };
    save();
    go('overview');
  };

  paint();
}
