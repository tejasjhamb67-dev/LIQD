// LIQD — Overview: client info, corpus, risk profile, portfolio snapshot

import { S, active, models } from '../state.js';
import { riskScore, project, goalProbability, runScenario } from '../engine.js';
import { SCENARIOS, INVESTOR_TYPES, GOALS } from '../data.js';
import { el, esc, fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { donut, sparkline, meter } from '../charts.js';
import { go } from '../app.js';

export function renderOverview(main) {
  const m = active();
  const rs = riskScore(S);
  const proj = project(S.corpus, S.monthly, m.mu, m.sigma, S.tenure);
  const median = proj[proj.length - 1].p50;
  const gp = goalProbability(S.corpus, S.monthly, m.mu, m.sigma, S.tenure, S.goalAmount);
  const worst = SCENARIOS.filter(s => s.key !== 'melt')
    .map(s => runScenario(s, m.weights, S.corpus, m.mu))
    .sort((a, b) => a.impact - b.impact)[0];
  const tier = INVESTOR_TYPES.find(t => t.key === S.investorType);
  const goal = GOALS.find(g => g.key === S.goalType);
  const name = S.client.name || 'Investor';

  main.innerHTML = `
    <div class="topbar">
      <div>
        <div class="eyebrow">Overview</div>
        <h1 class="page-title">${esc(name.split(' ')[0])}'s money machine</h1>
        <p class="page-sub">${tier.label} · ${goal.label} · ${S.tenure}-year tenure · <b style="color:var(--ink-1)">${m.label}${m.customized ? ' (customised)' : ''}</b> blueprint</p>
      </div>
      <div class="row">
        <button class="btn sm ghost" id="editBp">Edit blueprint</button>
        <div class="avatar">${esc((name[0] || 'L').toUpperCase())}</div>
      </div>
    </div>

    <div class="grid g4">
      <div class="card stat"><div class="label">Deployed corpus</div><div class="value tnum">${fmtINR(S.corpus)}</div>
        <div class="delta pos">+ ${fmtINR(S.monthly)}/mo top-up</div><div class="spark" style="margin-top:8px"></div></div>
      <div class="card stat"><div class="label">Expected CAGR</div><div class="value tnum">${fmtPct(m.mu, 1)}</div>
        <div class="delta dim">σ ${fmtPct(m.sigma, 1)} · Sharpe ${m.sharpe}</div></div>
      <div class="card stat"><div class="label">Median wealth · year ${S.tenure}</div><div class="value tnum">${fmtINR(median)}</div>
        <div class="delta pos">${(median / S.corpus).toFixed(1)}× your corpus</div></div>
      <div class="card stat"><div class="label">${gp != null ? 'Goal probability' : 'Stress drawdown'}</div>
        <div class="value tnum">${gp != null ? gp + '%' : m.maxDD + '%'}</div>
        <div class="delta ${gp != null ? (gp >= 70 ? 'pos' : 'neg') : 'neg'}">${gp != null ? 'of hitting ' + fmtINR(S.goalAmount) : 'worst-case estimate'}</div>
        <div class="gmeter" style="margin-top:8px"></div></div>
    </div>

    <div class="grid g3" style="margin-top:18px">
      <div class="card span2">
        <div class="row between"><h3 class="card-title">Asset allocation</h3>
          <button class="btn sm" id="toRb">Rebalance →</button></div>
        <div class="row" style="gap:34px;flex-wrap:wrap">
          <div class="chart-box" id="ovDonut" style="flex:0 0 200px"></div>
          <div style="flex:1;min-width:260px" id="ovClasses"></div>
        </div>
      </div>
      <div class="card">
        <h3 class="card-title">Risk profile</h3>
        <div class="stack" style="gap:16px">
          <div><div class="row between small"><span class="dim">LIQD risk score</span><b>${rs.score}/100</b></div><div class="m1" style="margin-top:6px"></div></div>
          <div><div class="row between small"><span class="dim">Capacity (tenure, age)</span><b>${rs.capacity}</b></div><div class="m2" style="margin-top:6px"></div></div>
          <div><div class="row between small"><span class="dim">Willingness (appetite, tolerance)</span><b>${rs.willingness}</b></div><div class="m3" style="margin-top:6px"></div></div>
          <div class="divider" style="margin:4px 0"></div>
          <div class="small dim">Worst stress scenario: <b style="color:var(--neg)">${fmtINR(worst.impact)}</b> (${fmtPct(worst.hitPct, 1)}) — est. recovery ${worst.recoveryMonths} months.
            <button class="btn sm ghost" id="toScn" style="margin-top:10px;width:100%">Open Scenario Lab →</button></div>
        </div>
      </div>
    </div>

    <div class="grid g3" style="margin-top:18px">
      <div class="card span2">
        <h3 class="card-title">Top sleeves in your blueprint</h3>
        <table class="tbl"><thead><tr><th>Sleeve</th><th>Class</th><th class="num">Weight</th><th class="num">Value</th><th class="num">Exp. return</th></tr></thead>
        <tbody>${m.sleeves.filter(s => s.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 6).map(s => `
          <tr><td>${s.name}</td><td><span class="key"><span class="swatch" style="background:${CLASS_META[s.cls].hex}"></span>${CLASS_META[s.cls].label}</span></td>
          <td class="num">${s.pct.toFixed(1)}%</td><td class="num">${fmtINR(S.corpus * s.pct / 100)}</td><td class="num">${s.ret.toFixed(1)}%</td></tr>`).join('')}
        </tbody></table>
        <button class="btn sm ghost" id="toPf" style="margin-top:14px">Full portfolio →</button>
      </div>
      <div class="card">
        <h3 class="card-title">Next best actions</h3>
        <div class="stack" style="gap:12px" id="actions"></div>
      </div>
    </div>`;

  // charts
  donut(main.querySelector('#ovDonut'), CLASS_ORDER.map(k => ({ label: CLASS_META[k].label, value: m.weights[k], color: CLASS_META[k].hex })),
    { centerValue: fmtINR(S.corpus), centerLabel: 'DEPLOYED' });
  main.querySelector('#ovClasses').innerHTML = CLASS_ORDER.map(k => {
    const v = m.weights[k];
    return `<div class="row between" style="padding:9px 0;border-bottom:1px solid var(--line-soft)">
      <span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label}</span>
      <span class="row" style="gap:14px"><b class="tnum">${v}%</b><span class="muted small tnum" style="width:74px;text-align:right">${fmtINR(S.corpus * v / 100)}</span></span></div>`;
  }).join('');
  sparkline(main.querySelector('.spark'), proj.map(r => r.p50).slice(0, Math.min(13, proj.length)));
  meter(main.querySelector('.m1'), rs.score);
  meter(main.querySelector('.m2'), rs.capacity, { color: '#3987e5', track: 'rgba(57,135,229,0.15)' });
  meter(main.querySelector('.m3'), rs.willingness, { color: '#9085e9', track: 'rgba(144,133,233,0.15)' });
  if (main.querySelector('.gmeter') && gp != null) meter(main.querySelector('.gmeter'), gp, { color: gp >= 70 ? '#0ca30c' : '#fab219', track: 'rgba(255,255,255,0.07)' });

  // actions
  const acts = [];
  if (!S.connections.length) acts.push(['Link your existing portfolio', 'Zerodha, Groww, MF Central — see everything in one place', 'integrations']);
  if (m.weights.eq > 0 && !S.constraints.includes('no_intl')) acts.push(['Review your global sleeve', 'LRS window resets — plan USD deployment early in the FY', 'portfolio']);
  acts.push(['Stress-test before the next crash', 'Run 2008 and stagflation against your blueprint', 'scenario']);
  acts.push(['See what fees would cost you elsewhere', `A 2% PMS fee costs you ${fmtINR(S.corpus * 0.35)}+ over ${S.tenure} yrs`, 'advantage']);
  main.querySelector('#actions').innerHTML = acts.slice(0, 4).map(([t, d, h]) =>
    `<button class="opt-card" data-go="${h}" style="padding:13px 15px"><span><span class="t" style="font-size:13.5px">${t}</span><div class="d">${d}</div></span></button>`).join('');

  // wires
  main.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  main.querySelector('#editBp').onclick = () => go('blueprint');
  main.querySelector('#toRb').onclick = () => go('rebalance');
  main.querySelector('#toScn').onclick = () => go('scenario');
  main.querySelector('#toPf').onclick = () => go('portfolio');
}
