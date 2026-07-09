// LIQD — Growth & Projections: fan chart, goal probability, milestones

import { S, save, active } from '../state.js';
import { project, goalProbability } from '../engine.js';
import { fmtINR, fmtPct } from '../util.js';
import { fanChart, meter } from '../charts.js';

export function renderGrowth(main) {
  const m = active();

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Growth & Projections</div>
      <h1 class="page-title">Where this is going</h1>
      <p class="page-sub">Lognormal percentile bands from your ${m.label} blueprint (${fmtPct(m.mu, 1)} expected, ${fmtPct(m.sigma, 1)} vol) — not a straight-line fantasy. The shaded fan is the honest range of outcomes.</p>
    </div>

    <div class="card">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <h3 class="card-title" style="margin:0">Projected wealth · ${fmtINR(S.corpus)} + ${fmtINR(S.monthly)}/mo</h3>
        <div class="row" style="gap:18px;flex-wrap:wrap">
          <label class="small dim">Monthly top-up <input type="range" id="gM" min="0" max="${Math.max(500000, S.monthly * 2)}" step="5000" value="${S.monthly}" style="width:130px;vertical-align:middle;margin-left:8px"> <b id="gMv" class="tnum">${fmtINR(S.monthly)}</b></label>
          <label class="small dim">Tenure <input type="range" id="gT" min="1" max="30" value="${S.tenure}" style="width:110px;vertical-align:middle;margin-left:8px"> <b id="gTv" class="tnum">${S.tenure}y</b></label>
        </div>
      </div>
      <div class="chart-box" id="fan" style="margin-top:12px"></div>
      <div class="legend">
        <span class="key"><span class="swatch" style="background:#3987e5"></span>Median path (P50)</span>
        <span class="key"><span class="swatch" style="background:rgba(57,135,229,0.35)"></span>Likely range (P25–P75)</span>
        <span class="key"><span class="swatch" style="background:rgba(57,135,229,0.18)"></span>Full range (P10–P90)</span>
        ${S.goalAmount ? '<span class="key"><span class="swatch" style="background:#c98500"></span>Goal line</span>' : ''}
      </div>
    </div>

    <div class="grid g3" style="margin-top:18px" id="tiles"></div>

    <div class="grid g2" style="margin-top:18px">
      <div class="card">
        <h3 class="card-title">Milestones on the median path</h3>
        <div id="miles"></div>
      </div>
      <div class="card">
        <h3 class="card-title">The honest print</h3>
        <div class="stack small dim" style="gap:10px" id="honest"></div>
      </div>
    </div>`;

  let mo = S.monthly, yrs = S.tenure;
  const paint = () => {
    const rows = project(S.corpus, mo, m.mu, m.sigma, yrs);
    const end = rows[rows.length - 1];
    const gp = goalProbability(S.corpus, mo, m.mu, m.sigma, yrs, S.goalAmount);
    fanChart(main.querySelector('#fan'), rows, { goal: S.goalAmount || null });

    const invested = S.corpus + mo * 12 * yrs;
    main.querySelector('#tiles').innerHTML = `
      <div class="card stat"><div class="label">Median outcome · year ${yrs}</div><div class="value tnum">${fmtINR(end.p50)}</div>
        <div class="delta pos">${(end.p50 / invested).toFixed(1)}× total invested (${fmtINR(invested)})</div></div>
      <div class="card stat"><div class="label">Stress case (P10)</div><div class="value tnum">${fmtINR(end.p10)}</div>
        <div class="delta ${end.p10 > invested ? 'pos' : 'neg'}">${end.p10 > invested ? 'still ahead of invested capital' : 'below invested — risk is real'}</div></div>
      ${gp != null ? `<div class="card stat"><div class="label">Goal probability</div><div class="value tnum">${gp}%</div>
        <div class="delta dim">of reaching ${fmtINR(S.goalAmount)}</div><div class="gm" style="margin-top:8px"></div></div>`
        : `<div class="card stat"><div class="label">Optimistic case (P90)</div><div class="value tnum">${fmtINR(end.p90)}</div>
        <div class="delta pos">top-decile markets</div></div>`}`;
    if (gp != null) meter(main.querySelector('.gm'), gp, { color: gp >= 70 ? '#0ca30c' : '#fab219', track: 'rgba(255,255,255,0.07)' });

    // milestones
    const marks = [1e7, 5e7, 1e8, 5e8].filter(v => v > S.corpus);
    const miles = marks.map(v => {
      const hit = rows.find(r => r.p50 >= v);
      return hit ? `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line-soft)">
        <span class="dim small">${v === 1e7 ? 'First crore' : fmtINR(v)}</span><b>Year ${hit.t} · age ${(S.client.age || 32) + hit.t}</b></div>` : '';
    }).join('') || '<p class="small muted">Extend tenure or top-ups to see crore milestones.</p>';
    main.querySelector('#miles').innerHTML = miles;

    main.querySelector('#honest').innerHTML = `
      <div>· These are <b style="color:var(--ink-1)">nominal INR</b> figures. At 5% inflation, ${fmtINR(end.p50)} in year ${yrs} buys what ${fmtINR(end.p50 / Math.pow(1.05, yrs))} buys today.</div>
      <div>· The fan assumes returns are lognormal with constant parameters — real markets have fatter tails. The Scenario Lab covers what the fan can't.</div>
      <div>· Expected CAGR ${fmtPct(m.mu, 1)} is a long-run assumption, not a promise. LIQD shows the machine — most platforms show only the median line.</div>
      <div>· Taxes and the LIQD subscription are not netted here; see LIQD Advantage for the full cost picture.</div>`;
  };
  paint();

  main.querySelector('#gM').oninput = e => { mo = +e.target.value; main.querySelector('#gMv').textContent = fmtINR(mo); paint(); };
  main.querySelector('#gT').oninput = e => { yrs = +e.target.value; main.querySelector('#gTv').textContent = yrs + 'y'; paint(); };
}
