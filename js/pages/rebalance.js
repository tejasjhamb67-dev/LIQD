// LIQD — Rebalancing Studio: drag class weights, everything reprices live

import { S, save, models, active } from '../state.js';
import { statsForWeights, project, goalProbability } from '../engine.js';
import { fmtINR, fmtPct, clamp, CLASS_META, CLASS_ORDER } from '../util.js';
import { donut } from '../charts.js';
import { go } from '../app.js';

export function renderRebalance(main) {
  const base = models()[S.chosenModel];
  let w = { ...(S.customWeights || base.weights) };

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Rebalancing Studio</div>
      <h1 class="page-title">Move the levers. Watch it reprice.</h1>
      <p class="page-sub">Aladdin-style what-if: drag allocations between asset classes and the same engine recomputes return, volatility, drawdown and goal odds — before you commit a rupee.</p>
    </div>

    <div class="grid g3">
      <div class="card span2">
        <div class="row between"><h3 class="card-title">Class weights</h3>
          <span class="row">
            <button class="btn sm ghost" id="rbReset">Reset to ${base.label}</button>
            <button class="btn sm" id="rbPresetC">Conservative</button>
            <button class="btn sm" id="rbPresetB">Balanced</button>
            <button class="btn sm" id="rbPresetA">Aggressive</button>
          </span></div>
        <div id="rbRows"></div>
        <div class="row between small" style="margin-top:12px">
          <span class="muted">Weights auto-normalise to 100%. Sleeve mix inside each class scales proportionally.</span>
          <b id="rbTotal" class="tnum"></b></div>
        <div class="divider"></div>
        <div class="row between">
          <div class="small dim" id="driftNote"></div>
          <button class="btn primary" id="rbCommit">Commit rebalance</button>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">Live pricing</h3>
        <div class="chart-box" id="rbDonut" style="margin-bottom:10px"></div>
        <div id="rbStats"></div>
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <h3 class="card-title">Before → after</h3>
      <table class="tbl"><thead><tr><th>Metric</th><th class="num">Current blueprint</th><th class="num">Your draft</th><th class="num">Δ</th></tr></thead>
      <tbody id="cmpRows"></tbody></table>
      <p class="small muted" style="margin-top:12px">Tax note: LIQD executes rebalances with LTCG harvesting where possible — gains realised within the ₹1.25L annual exemption first, equity-taxed arbitrage funds used as the debt bridge for tax-sensitive profiles.</p>
    </div>`;

  const rows = main.querySelector('#rbRows');
  const sliders = {};
  for (const k of CLASS_ORDER) {
    const r = document.createElement('div');
    r.className = 'rb-row';
    r.innerHTML = `<span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label}</span>
      <input type="range" min="0" max="90" step="1" value="${w[k]}" data-k="${k}">
      <span class="pct" id="pct-${k}">${w[k]}%</span>`;
    rows.appendChild(r);
    sliders[k] = r.querySelector('input');
  }

  function normalize(changed) {
    const others = CLASS_ORDER.filter(k => k !== changed);
    const rem = 100 - w[changed];
    const sum = others.reduce((s, k) => s + w[k], 0) || 1;
    others.forEach(k => w[k] = Math.round(rem * w[k] / sum));
    // fix rounding on largest other
    const drift = 100 - CLASS_ORDER.reduce((s, k) => s + w[k], 0);
    const big = others.sort((a, b) => w[b] - w[a])[0];
    w[big] += drift;
  }

  const activeBase = active();
  function paint() {
    const st = statsForWeights(base, w);
    const cur = activeBase;
    const yrs = S.tenure;
    const pNew = project(S.corpus, S.monthly, st.mu, st.sigma, yrs).at(-1).p50;
    const pCur = project(S.corpus, S.monthly, cur.mu, cur.sigma, yrs).at(-1).p50;
    const gpNew = goalProbability(S.corpus, S.monthly, st.mu, st.sigma, yrs, S.goalAmount);
    const gpCur = goalProbability(S.corpus, S.monthly, cur.mu, cur.sigma, yrs, S.goalAmount);

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
      [`Median · year ${yrs}`, fmtINR(pNew)],
      ...(gpNew != null ? [['Goal probability', gpNew + '%']] : []),
    ].map(([l, v]) => `<div class="row between small" style="padding:7px 0;border-bottom:1px solid var(--line-soft)"><span class="dim">${l}</span><b class="tnum">${v}</b></div>`).join('');

    const drift = CLASS_ORDER.reduce((s, k) => s + Math.abs(w[k] - base.weights[k]), 0) / 2;
    main.querySelector('#driftNote').innerHTML = drift < 1
      ? 'No drift from your blueprint.'
      : `Draft drifts <b style="color:var(--warn)">${drift.toFixed(0)}pts</b> from the ${base.label} blueprint — turnover ≈ ${fmtINR(S.corpus * drift / 100)}.`;

    const dRow = (l, a, b, fmt = x => x, goodUp = true) => {
      const d = b - a;
      const cls = d === 0 ? 'dim' : (d > 0) === goodUp ? 'delta pos' : 'delta neg';
      return `<tr><td>${l}</td><td class="num">${fmt(a)}</td><td class="num">${fmt(b)}</td><td class="num"><span class="${cls}">${d > 0 ? '+' : ''}${fmt(+d.toFixed(2))}</span></td></tr>`;
    };
    main.querySelector('#cmpRows').innerHTML = [
      dRow('Expected CAGR %', cur.mu, st.mu),
      dRow('Volatility %', cur.sigma, st.sigma, x => x, false),
      dRow('Stress drawdown %', cur.maxDD, st.maxDD),
      dRow('Sharpe', cur.sharpe, st.sharpe),
      dRow(`Median wealth yr ${yrs}`, pCur, pNew, fmtINR),
      ...(gpNew != null && gpCur != null ? [dRow('Goal probability %', gpCur, gpNew)] : []),
    ].join('');
  }

  CLASS_ORDER.forEach(k => sliders[k].oninput = e => {
    w[k] = clamp(+e.target.value, 0, 90);
    normalize(k);
    paint();
  });
  main.querySelector('#rbReset').onclick = () => { w = { ...base.weights }; paint(); };
  const preset = mk => () => { w = { ...models()[mk].weights }; paint(); };
  main.querySelector('#rbPresetC').onclick = preset('conservative');
  main.querySelector('#rbPresetB').onclick = preset('balanced');
  main.querySelector('#rbPresetA').onclick = preset('aggressive');
  main.querySelector('#rbCommit').onclick = () => {
    const same = CLASS_ORDER.every(k => w[k] === base.weights[k]);
    S.customWeights = same ? null : { ...w };
    save();
    go('overview');
  };

  paint();
}
