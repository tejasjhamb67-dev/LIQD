// LIQD — Growth & Projections: Monte Carlo bands, glide path, contribution path,
// goal odds, and the drawdown (decumulation) simulator.

import { S, save, active } from '../state.js';
import { simulate, simulateRetirement, goalProbabilityMC, contributionSchedule, glideSchedule } from '../engine.js';
import { fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { fanChart, meter } from '../charts.js';
import { go } from '../app.js';

export function renderGrowth(main) {
  const m = active();

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Growth & Projections</div>
      <h1 class="page-title">The honest range of outcomes</h1>
      <p class="page-sub">2,000 Monte Carlo paths · ${m.label} policy · step-up SIP and income events included.</p>
    </div>

    <div class="card">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <h3 class="card-title" style="margin:0">Projected wealth — accumulation</h3>
        <div class="row" style="gap:18px;flex-wrap:wrap">
          <label class="small dim">Base SIP <input type="range" id="gM" min="0" max="${Math.max(500000, S.monthly * 2)}" step="5000" value="${S.monthly}" style="width:110px;vertical-align:middle;margin-left:8px"> <b id="gMv" class="tnum">${fmtINR(S.monthly)}</b></label>
          <label class="small dim">Step-up <input type="range" id="gS" min="0" max="20" value="${S.stepUp}" style="width:80px;vertical-align:middle;margin-left:8px"> <b id="gSv" class="tnum">${S.stepUp}%</b></label>
          <label class="small dim">Tenure <input type="range" id="gT" min="2" max="30" value="${S.tenure}" style="width:90px;vertical-align:middle;margin-left:8px"> <b id="gTv" class="tnum">${S.tenure}y</b></label>
          <label class="chip" id="glideChip" title="De-risk toward the conservative landing mix in the final years">Glide path</label>
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
      <div id="glideNote"></div>
    </div>

    <div class="grid g3" style="margin-top:16px" id="tiles"></div>

    <div class="card" style="margin-top:16px">
      <div class="row between" style="flex-wrap:wrap;gap:14px">
        <div>
          <h3 class="card-title" style="margin:0">After the tenure — can this corpus pay you a salary?</h3>
          <p class="small muted" style="margin-top:6px;max-width:560px">The drawdown test: from year ${S.tenure}, stop contributing and withdraw a monthly amount that rises 5%/yr with prices, on a conservative post-tenure mix (9.1% / 6.5% vol). Success = the money outlives the plan on that path.</p>
        </div>
        <div class="row" style="gap:18px;flex-wrap:wrap">
          <label class="small dim">Withdraw <input type="range" id="dW" min="25000" max="2000000" step="25000" value="0" style="width:130px;vertical-align:middle;margin-left:8px"> <b id="dWv" class="tnum"></b>/mo</label>
          <label class="small dim">For <input type="range" id="dY" min="10" max="45" value="30" style="width:90px;vertical-align:middle;margin-left:8px"> <b id="dYv" class="tnum">30y</b></label>
        </div>
      </div>
      <div class="grid g3" style="margin-top:16px">
        <div class="stat"><div class="label">Plan survival rate</div><div class="value tnum" id="dSucc">—</div>
          <div class="delta dim">across 2,000 retirement paths</div><div class="dm" style="margin-top:8px"></div></div>
        <div class="stat"><div class="label">Median estate left</div><div class="value tnum" id="dEst">—</div>
          <div class="delta dim" id="dEstNote"></div></div>
        <div class="stat"><div class="label">Safe withdrawal reference</div><div class="value tnum" id="dSafe">—</div>
          <div class="delta dim">≈ 4% of median corpus, inflation-indexed</div></div>
      </div>
      <div class="chart-box" id="dFan" style="margin-top:16px"></div>
      <p class="small muted" style="margin-top:8px">Drawdown-phase percentiles, starting from each simulated accumulation outcome — sequence-of-returns risk included, which a simple “corpus ÷ expenses” estimate ignores.</p>
    </div>

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

  let mo = S.monthly, su = S.stepUp, yrs = S.tenure, glide = !!S.glide;
  let retW = 0, retY = 30;      // 0 → auto-suggest from median corpus
  const glideChip = main.querySelector('#glideChip');

  const paint = () => {
    const p = { ...S, monthly: mo, stepUp: su };
    const sched = contributionSchedule(p, yrs);
    const g = glide ? glideSchedule(m, m.weights, yrs) : null;
    const sim = simulate(S.corpus, sched,
      g ? g.rows.map(r => r.mu) : m.mu,
      g ? g.rows.map(r => r.sigma) : m.sigma, yrs);
    const rows = sim.rows;
    const end = rows[rows.length - 1];
    const gp = goalProbabilityMC(sim.terminal, S.goalAmount);

    glideChip.classList.toggle('on', glide);
    fanChart(main.querySelector('#fan'), rows, { goal: S.goalAmount || null });
    main.querySelector('#glideNote').innerHTML = glide
      ? `<div class="small dim" style="margin-top:10px;padding:10px 14px;background:var(--accent-wash);border-radius:9px">Glide path on: from year ${g.startYear} the engine walks equity from ${m.weights.eq}% down to 28% over ${g.window} years — final-year mix ${CLASS_ORDER.map(k => `${CLASS_META[k].label.split(' ')[0]} ${g.rows[g.rows.length - 1].weights[k]}%`).join(' · ')}. Expected return gives up ${(m.mu - g.rows[g.rows.length - 1].mu).toFixed(1)} pts in the final year in exchange for a much narrower landing zone — sequence-of-returns risk is highest exactly when the corpus is largest.</div>`
      : `<div class="small muted" style="margin-top:10px">Glide path off — the ${m.label} mix is held to the last day. Toggle it to see the de-risking landing.</div>`;

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

    // ----- drawdown phase -----
    const suggested = Math.max(25000, Math.round(end.p50 * 0.04 / 12 / 25000) * 25000);
    if (!retW) retW = suggested;
    const wSlider = main.querySelector('#dW');
    wSlider.max = Math.max(2000000, suggested * 3);
    wSlider.value = retW;
    main.querySelector('#dWv').textContent = fmtINR(retW);
    main.querySelector('#dYv').textContent = retY + 'y';
    main.querySelector('#dSafe').textContent = fmtINR(suggested) + '/mo';

    const ret = simulateRetirement(sim.paths, retW, retY);
    main.querySelector('#dSucc').textContent = ret.successPct + '%';
    main.querySelector('#dSucc').style.color = ret.successPct >= 85 ? 'var(--up)' : ret.successPct >= 60 ? 'var(--warn)' : 'var(--down)';
    meter(main.querySelector('.dm'), ret.successPct, { color: ret.successPct >= 85 ? '#0ca30c' : ret.successPct >= 60 ? '#b97f00' : '#d03b3b', track: 'rgba(26,36,32,0.07)' });
    main.querySelector('#dEst').textContent = fmtINR(ret.medianEstate);
    main.querySelector('#dEstNote').textContent = ret.p10Estate > 0
      ? `even the P10 path ends with ${fmtINR(ret.p10Estate)}`
      : 'the P10 path runs out — trim the withdrawal or extend the tenure';
    const dRows = [{ t: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 }, ...ret.rows];
    dRows[0] = { t: 0, p10: end.p10, p25: end.p25, p50: end.p50, p75: end.p75, p90: end.p90 };
    fanChart(main.querySelector('#dFan'), dRows, { h: 240 });

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
  glideChip.onclick = () => { glide = !glide; S.glide = glide; save(); paint(); };
  main.querySelector('#dW').oninput = e => { retW = +e.target.value; paint(); };
  main.querySelector('#dY').oninput = e => { retY = +e.target.value; paint(); };
  main.querySelector('#editEvt').onclick = () => go('blueprint');
}
