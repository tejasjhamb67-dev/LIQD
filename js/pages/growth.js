// LIQD — Growth & Projections: Monte Carlo bands, contribution path, goal odds

import { S, active } from '../state.js';
import { simulate, goalProbabilityMC, contributionSchedule } from '../engine.js';
import { fmtINR, fmtPct } from '../util.js';
import { fanChart, meter } from '../charts.js';
import { go } from '../app.js';

export function renderGrowth(main) {
  const m = active();

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Growth & Projections</div>
      <h1 class="page-title">The honest range of outcomes</h1>
      <p class="page-sub">2,000 simulated market paths through your ${m.label} policy (${fmtPct(m.mu, 1)} expected, ${fmtPct(m.sigma, 1)} volatility), including your step-up SIP and income events — a distribution, not a straight-line promise.</p>
    </div>

    <div class="card">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <h3 class="card-title" style="margin:0">Projected wealth</h3>
        <div class="row" style="gap:18px;flex-wrap:wrap">
          <label class="small dim">Base SIP <input type="range" id="gM" min="0" max="${Math.max(500000, S.monthly * 2)}" step="5000" value="${S.monthly}" style="width:120px;vertical-align:middle;margin-left:8px"> <b id="gMv" class="tnum">${fmtINR(S.monthly)}</b></label>
          <label class="small dim">Step-up <input type="range" id="gS" min="0" max="20" value="${S.stepUp}" style="width:90px;vertical-align:middle;margin-left:8px"> <b id="gSv" class="tnum">${S.stepUp}%</b></label>
          <label class="small dim">Tenure <input type="range" id="gT" min="1" max="30" value="${S.tenure}" style="width:100px;vertical-align:middle;margin-left:8px"> <b id="gTv" class="tnum">${S.tenure}y</b></label>
        </div>
      </div>
      <div class="chart-box" id="fan" style="margin-top:12px"></div>
      <div class="legend">
        <span class="key"><span class="swatch" style="background:#2a78d6"></span>Median path (P50)</span>
        <span class="key"><span class="swatch" style="background:rgba(42,120,214,0.35)"></span>Likely range (P25–P75)</span>
        <span class="key"><span class="swatch" style="background:rgba(42,120,214,0.16)"></span>Full range (P10–P90)</span>
        <span class="key"><span class="swatch" style="background:#8b948e"></span>Capital invested</span>
        ${S.goalAmount ? '<span class="key"><span class="swatch" style="background:#b97f00"></span>Goal line</span>' : ''}
      </div>
    </div>

    <div class="grid g3" style="margin-top:16px" id="tiles"></div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card">
        <h3 class="card-title">Your contribution path</h3>
        <p class="small muted" style="margin-bottom:10px">${S.stepUp}% annual step-up${S.incomeEvents.length ? ` with ${S.incomeEvents.length} income event${S.incomeEvents.length > 1 ? 's' : ''} (${S.incomeEvents.map(e => `Y${e.year} +${e.pct}%`).join(', ')})` : ''}. <button class="btn sm ghost" id="editEvt" style="vertical-align:baseline">Edit in Blueprint →</button></p>
        <div id="schedTbl" style="max-height:300px;overflow:auto"></div>
      </div>
      <div class="card">
        <h3 class="card-title">Milestones on the median path</h3>
        <div id="miles"></div>
        <div class="divider"></div>
        <div class="stack small dim" style="gap:9px" id="honest"></div>
      </div>
    </div>`;

  let mo = S.monthly, su = S.stepUp, yrs = S.tenure;
  const paint = () => {
    const p = { ...S, monthly: mo, stepUp: su };
    const sched = contributionSchedule(p, yrs);
    const sim = simulate(S.corpus, sched, m.mu, m.sigma, yrs);
    const rows = sim.rows;
    const end = rows[rows.length - 1];
    const gp = goalProbabilityMC(sim.terminal, S.goalAmount);
    fanChart(main.querySelector('#fan'), rows, { goal: S.goalAmount || null });

    const invested = end.invested;
    main.querySelector('#tiles').innerHTML = `
      <div class="card stat"><div class="label">Median outcome · year ${yrs}</div><div class="value tnum">${fmtINR(end.p50)}</div>
        <div class="delta pos">${(end.p50 / invested).toFixed(1)}× the ${fmtINR(invested)} invested</div></div>
      <div class="card stat"><div class="label">Stress case (P10)</div><div class="value tnum">${fmtINR(end.p10)}</div>
        <div class="delta ${end.p10 > invested ? 'pos' : 'neg'}">${end.p10 > invested ? 'still ahead of invested capital' : 'below invested capital — the risk is real'}</div></div>
      ${gp != null ? `<div class="card stat"><div class="label">Goal probability</div><div class="value tnum">${gp}%</div>
        <div class="delta dim">of ${fmtINR(S.goalAmount)} across 2,000 paths</div><div class="gm" style="margin-top:8px"></div></div>`
        : `<div class="card stat"><div class="label">Optimistic case (P90)</div><div class="value tnum">${fmtINR(end.p90)}</div>
        <div class="delta pos">top-decile market outcomes</div></div>`}`;
    if (gp != null) meter(main.querySelector('.gm'), gp, { color: gp >= 70 ? '#0ca30c' : '#b97f00', track: 'rgba(26,36,32,0.07)' });

    // contribution schedule table (sampled years)
    const marks = sched.filter((r, i) => i === 0 || i === sched.length - 1 || (r.year % Math.ceil(yrs / 8) === 0) || (S.incomeEvents || []).some(e => e.year === r.year));
    main.querySelector('#schedTbl').innerHTML = `<table class="tbl"><thead><tr><th>Year</th><th class="num">Monthly SIP</th><th class="num">Annual</th><th></th></tr></thead>
      <tbody>${marks.map(r => `<tr><td>Y${r.year}</td><td class="num">${fmtINR(r.monthly)}</td><td class="num">${fmtINR(r.annual)}</td>
      <td class="small muted">${(S.incomeEvents || []).some(e => e.year === r.year) ? 'income event +' + S.incomeEvents.find(e => e.year === r.year).pct + '%' : ''}</td></tr>`).join('')}</tbody></table>`;

    const mstones = [1e7, 5e7, 1e8, 5e8].filter(v => v > S.corpus).map(v => {
      const hit = rows.find(r => r.p50 >= v);
      return hit ? `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line-soft)">
        <span class="dim small">${v === 1e7 ? 'First crore' : fmtINR(v)}</span><b>Year ${hit.t} · age ${(S.client.age || 32) + hit.t}</b></div>` : '';
    }).join('') || '<p class="small muted">Extend tenure or contributions to see crore milestones.</p>';
    main.querySelector('#miles').innerHTML = mstones;

    main.querySelector('#honest').innerHTML = `
      <div>· Figures are <b style="color:var(--ink-1)">nominal INR</b>. At 5% inflation, ${fmtINR(end.p50)} in year ${yrs} buys what ${fmtINR(end.p50 / Math.pow(1.05, yrs))} buys today.</div>
      <div>· The simulation assumes lognormal annual returns with constant parameters; real markets have fatter tails. The Scenario Lab covers what the distribution can't.</div>
      <div>· Expected CAGR ${fmtPct(m.mu, 1)} is a long-run capital-market assumption, not a promise — the assumptions table is in your Blueprint's construction step.</div>`;
  };
  paint();

  main.querySelector('#gM').oninput = e => { mo = +e.target.value; main.querySelector('#gMv').textContent = fmtINR(mo); paint(); };
  main.querySelector('#gS').oninput = e => { su = +e.target.value; main.querySelector('#gSv').textContent = su + '%'; paint(); };
  main.querySelector('#gT').oninput = e => { yrs = +e.target.value; main.querySelector('#gTv').textContent = yrs + 'y'; paint(); };
  main.querySelector('#editEvt').onclick = () => go('blueprint');
}
