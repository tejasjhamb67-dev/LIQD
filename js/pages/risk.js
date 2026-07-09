// LIQD — Risk Matrix: scenario × asset-class shock grid on the live policy.

import { S, active } from '../state.js';
import { runScenario } from '../engine.js';
import { SCENARIOS } from '../data.js';
import { fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { barsH } from '../charts.js';

// diverging heat cell: red wash for losses, green for gains, neutral near zero
function heat(v, max = 55) {
  const a = Math.min(Math.abs(v) / max, 1) * 0.55;
  const bg = Math.abs(v) < 1 ? 'transparent' : v < 0 ? `rgba(227,73,72,${a})` : `rgba(27,175,122,${a})`;
  const ink = Math.abs(v) / max > 0.65 ? '#fff' : 'var(--ink-1)';
  return `<span class="heat" style="background:${bg};color:${ink}">${v > 0 ? '+' : ''}${v}%</span>`;
}

export function renderRisk(main) {
  const m = active();
  const results = SCENARIOS.map(s => ({ s, r: runScenario(s, m.weights, S.corpus, m.mu) }));
  const downside = results.filter(x => x.r.hitPct < 0);
  const worst = downside.sort((a, b) => a.r.impact - b.r.impact)[0];
  const eqOnlyWorst = runScenario(worst.s, { eq: 100, fi: 0, alt: 0, tac: 0 }, S.corpus, 12.5);
  const avgCushion = downside.reduce((acc, x) => {
    const eqR = runScenario(x.s, { eq: 100, fi: 0, alt: 0, tac: 0 }, S.corpus, 12.5);
    return acc + (x.r.hitPct - eqR.hitPct);   // how much shallower than all-equity
  }, 0) / downside.length;
  let sel = worst.s;

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Risk Matrix</div>
      <h1 class="page-title">Every scenario, priced</h1>
      <p class="page-sub">Shock vectors × your live weights (${CLASS_ORDER.map(k => m.weights[k] + '%').join(' / ')}).</p>
    </div>

    <div class="grid g4">
      <div class="card stat"><div class="label">Worst scenario</div><div class="value tnum" style="color:var(--down)">${fmtINR(worst.r.impact)}</div>
        <div class="delta dim">${worst.s.name}</div></div>
      <div class="card stat"><div class="label">Worst-case drawdown</div><div class="value tnum">${fmtPct(worst.r.hitPct, 1)}</div>
        <div class="delta dim">vs ${fmtPct(eqOnlyWorst.hitPct, 1)} all-equity</div></div>
      <div class="card stat"><div class="label">Diversification cushion</div><div class="value tnum" style="color:var(--up)">+${avgCushion.toFixed(1)} pts</div>
        <div class="delta dim">avg. vs 100% equity, downside scenarios</div></div>
      <div class="card stat"><div class="label">Longest recovery</div><div class="value tnum">${Math.max(...downside.map(x => x.r.recoveryMonths))} mo</div>
        <div class="delta dim">at ${fmtPct(m.mu, 1)} expected CAGR</div></div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3 class="card-title">Shock matrix</h3>
      <div style="overflow-x:auto"><table class="tbl mx"><thead><tr>
        <th>Scenario</th>
        ${CLASS_ORDER.map(k => `<th class="num"><span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label.split(' ')[0]} ${m.weights[k]}%</span></th>`).join('')}
        <th class="num">Portfolio</th><th class="num">₹ impact</th><th class="num">Recovery</th>
      </tr></thead><tbody id="mxRows">
        ${results.map(({ s, r }, i) => `<tr data-i="${i}">
          <td>${s.name}<div class="small muted" style="font-weight:400">${s.desc}</div></td>
          ${CLASS_ORDER.map(k => `<td class="num">${heat(s.shocks[k])}</td>`).join('')}
          <td class="num"><b class="tnum" style="color:${r.hitPct < 0 ? 'var(--down)' : 'var(--up)'}">${fmtPct(r.hitPct, 1, true)}</b></td>
          <td class="num tnum">${fmtINR(r.impact, { sign: true })}</td>
          <td class="num tnum">${r.recoveryMonths ? r.recoveryMonths + ' mo' : '—'}</td>
        </tr>`).join('')}
      </tbody></table></div>
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card"><h3 class="card-title" id="selTitle"></h3><div class="chart-box" id="selBars"></div></div>
      <div class="card"><h3 class="card-title">Protocol on breach</h3>
        <div class="kv" style="gap:10px 16px">
          <span>Single-digit hit</span><b>Hold · harvest losses inside ₹1.25L LTCG budget</b>
          <span>−8% to −18%</span><b>Band rebalance — FI sleeve buys equity at target weights</b>
          <span>Deeper than −18%</span><b>Staged re-entry: deploy FI into equity in 3 tranches</b>
          <span>Melt-up</span><b>Bands trim into strength — no chasing</b>
        </div>
      </div>
    </div>`;

  const paint = () => {
    const r = runScenario(sel, m.weights, S.corpus, m.mu);
    main.querySelector('#selTitle').textContent = `${sel.name} — weighted contribution`;
    barsH(main.querySelector('#selBars'), CLASS_ORDER.map(k => ({
      label: `${CLASS_META[k].label} (${m.weights[k]}%)`,
      value: +(m.weights[k] * sel.shocks[k] / 100).toFixed(1),
      color: sel.shocks[k] < 0 ? '#e34948' : '#1baf7a',
      note: `class shock ${sel.shocks[k]}%`,
    })), { max: 40, fmt: v => (v > 0 ? '+' : '') + v.toFixed(1) + ' pts' });
    main.querySelectorAll('#mxRows tr').forEach(tr =>
      tr.classList.toggle('sel', SCENARIOS[+tr.dataset.i] === sel));
  };
  main.querySelectorAll('#mxRows tr').forEach(tr =>
    tr.onclick = () => { sel = SCENARIOS[+tr.dataset.i]; paint(); });
  paint();
}
