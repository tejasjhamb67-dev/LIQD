// LIQD — Blueprint: the mandate wizard → transparent construction → 3 proposals

import { S, save, models } from '../state.js';
import { riskScore, recommendedModel, explainConstruction, contributionSchedule, simulate, CLASS_CORR } from '../engine.js';
import { INVESTOR_TYPES, GOALS, APPETITE, TOLERANCE, CONSTRAINTS, SLEEVES } from '../data.js';
import { el, esc, fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { allocStrip } from '../charts.js';
import { buffer } from '../buffer.js';
import { go } from '../app.js';

const STEPS = ['who', 'money', 'goal', 'appetite', 'tolerance', 'constraints', 'construction', 'models'];
let step = 0;
let W; // working copy — cancelling an edit never corrupts saved state

export function renderOnboarding(main) {
  W = {
    name: S.client.name, age: S.client.age, investorType: S.investorType,
    corpus: S.corpus, monthly: S.monthly, stepUp: S.stepUp,
    incomeEvents: (S.incomeEvents || []).map(e => ({ ...e })),
    tenure: S.tenure, goalType: S.goalType, goalAmount: S.goalAmount,
    appetite: S.appetite, tolerance: S.tolerance,
    constraints: [...S.constraints],
  };
  step = 0;
  drawStep(main);
}

function commit() {
  S.client.name = W.name; S.client.age = W.age; S.investorType = W.investorType;
  S.corpus = W.corpus; S.monthly = W.monthly; S.stepUp = W.stepUp;
  S.incomeEvents = W.incomeEvents.filter(e => e.year >= 1 && e.year <= W.tenure && e.pct > 0);
  S.tenure = W.tenure; S.goalType = W.goalType; S.goalAmount = W.goalAmount;
  S.appetite = W.appetite; S.tolerance = W.tolerance; S.constraints = [...W.constraints];
  save();
}

const progress = () =>
  `<div class="ob-progress">${STEPS.map((s, i) => `<i class="${i <= step ? 'done' : ''}"></i>`).join('')}</div>`;

// interlude per forward transition — every label names a computation that runs
const INTERLUDES = {
  who:         ['tape', 'Reading your mandate', ['PROFILING TIER', 'SETTING ELIGIBILITY GATES'], 850],
  money:       ['stack', 'Modelling your contribution path', ['COMPOUNDING STEP-UPS', 'PLACING INCOME EVENTS'], 1000],
  goal:        ['tape', 'Anchoring the objective', ['MAPPING THE LIABILITY', 'SETTING THE HORIZON'], 850],
  appetite:    ['tape', 'Calibrating willingness', ['SCORING APPETITE'], 750],
  tolerance:   ['tape', 'Calibrating capacity', ['STRESSING YOUR FLINCH POINT'], 750],
  constraints: ['ring', 'Running the construction', ['SCREENING 40+ INSTRUMENTS', 'APPLYING YOUR CONSTRAINTS', 'SCORING CAPACITY × WILLINGNESS'], 1700],
  construction:['ring', 'Optimising three postures', ['SIMULATING 2,000 MARKET PATHS', 'PRICING DRAWDOWNS', 'RANKING PROPOSALS'], 1800],
};

function nav(wrap, main, { nextLabel = 'Continue' } = {}) {
  const n = el('div', 'ob-nav');
  const back = el('button', 'btn ghost', '← Back');
  back.style.visibility = step === 0 ? 'hidden' : 'visible';
  back.onclick = () => { step--; drawStep(main); };   // backwards is instant, always
  const next = el('button', 'btn primary', nextLabel + ' →');
  next.onclick = async () => {
    next.disabled = true;
    if (STEPS[step] === 'constraints') commit(); // lock inputs before the construction
    const [kind, title, subs, ms] = INTERLUDES[STEPS[step]] || [];
    if (kind) await buffer(kind, { title, subs, ms });
    step++; drawStep(main);
  };
  n.append(back, next);
  wrap.appendChild(n);
}

function drawStep(main) {
  main.innerHTML = '';
  const wrap = el('div', 'ob-wrap fade-in');
  main.appendChild(wrap);
  const fns = { who: stepWho, money: stepMoney, goal: stepGoal, appetite: stepAppetite, tolerance: stepTolerance, constraints: stepConstraints, construction: stepConstruction, models: stepModels };
  fns[STEPS[step]](wrap, main);
}

/* ---------- 01 · who ---------- */
function stepWho(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 01</div>
    <div class="ob-hero">Your investment mandate<br>starts <em>with you.</em></div>
    <p class="page-sub">Six inputs define the mandate. The engine shows you every step of what it does with them.</p>
    <div class="grid g2" style="margin-top:26px">
      <div class="field"><label>Your name</label><input class="input" id="obName" placeholder="Aarav Mehta" value="${esc(W.name)}"></div>
      <div class="field"><label>Age</label><input class="input" id="obAge" type="number" min="18" max="90" value="${W.age}"></div>
    </div>
    <div class="field" style="margin-top:18px"><label>Which best describes you?</label></div>
    <div class="opt-cards" id="obTypes"></div>`;
  const types = wrap.querySelector('#obTypes');
  for (const t of INVESTOR_TYPES) {
    const c = el('button', 'opt-card' + (W.investorType === t.key ? ' on' : ''),
      `<span class="glyph">${t.glyph}</span><span><span class="t">${t.label}</span><div class="d">${t.desc}</div></span>`);
    c.onclick = () => { W.investorType = t.key; types.querySelectorAll('.opt-card').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    types.appendChild(c);
  }
  wrap.querySelector('#obName').oninput = e => W.name = e.target.value;
  wrap.querySelector('#obAge').oninput = e => W.age = +e.target.value || 32;
  nav(wrap, main);
}

/* ---------- 02 · corpus, tenure & contribution path ---------- */
function stepMoney(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 02</div>
    <div class="ob-hero">Capital, and how<br>it <em>keeps arriving.</em></div>
    <p class="page-sub">Careers compound too. Model your SIP the way your income actually behaves — a steady annual step-up plus the big jumps: promotions, job switches, liquidity events.</p>
    <div class="grid g2" style="margin-top:26px">
      <div class="field"><label>Investable corpus today</label>
        <div class="input-wrap"><span class="prefix">₹</span><input class="input has-prefix" id="obCorpus" type="number" step="100000" min="100000" value="${W.corpus}"></div>
        <div class="small muted" style="margin-top:6px" id="corpusEcho"></div></div>
      <div class="field"><label>Monthly investment (SIP) today</label>
        <div class="input-wrap"><span class="prefix">₹</span><input class="input has-prefix" id="obMonthly" type="number" step="5000" min="0" value="${W.monthly}"></div>
        <div class="small muted" style="margin-top:6px" id="monthlyEcho"></div></div>
    </div>
    <div class="field" style="margin-top:22px"><label>Tenure — years invested: <b id="tenureVal" style="color:var(--accent)">${W.tenure} years</b></label>
      <input type="range" id="obTenure" min="1" max="30" value="${W.tenure}">
    </div>
    <div class="field" style="margin-top:20px"><label>Annual SIP step-up: <b id="stepVal" style="color:var(--accent)">${W.stepUp}% / year</b></label>
      <input type="range" id="obStep" min="0" max="20" value="${W.stepUp}">
      <div class="small muted" style="margin-top:6px">Most salaried professionals sustain 5–10%. This alone changes terminal wealth more than fund selection.</div>
    </div>
    <div class="card" style="margin-top:22px">
      <div class="row between"><h3 class="card-title" style="margin:0">Major income events</h3>
        <button class="btn sm" id="addEvt">+ Add event</button></div>
      <p class="small muted" style="margin:8px 0 4px">Promotions, switches, partnership, vesting — each one steps your SIP up by the given percentage in that year. Up to five.</p>
      <div id="evtRows"></div>
      <div class="divider" style="margin:12px 0"></div>
      <div class="small dim" id="evtEcho"></div>
    </div>`;

  const echo = () => {
    wrap.querySelector('#corpusEcho').textContent = fmtINR(W.corpus);
    wrap.querySelector('#monthlyEcho').textContent = W.monthly ? fmtINR(W.monthly) + ' / month' : 'No ongoing investment';
    const sched = contributionSchedule(W, W.tenure);
    const last = sched[sched.length - 1];
    const totalIn = sched.reduce((s, r) => s + r.annual, 0);
    wrap.querySelector('#evtEcho').innerHTML = last
      ? `By year ${W.tenure} your SIP grows to <b class="tnum" style="color:var(--ink-1)">${fmtINR(last.monthly)}/mo</b> — total fresh capital over the tenure: <b class="tnum" style="color:var(--ink-1)">${fmtINR(totalIn)}</b> on top of your ${fmtINR(W.corpus)} corpus.`
      : 'No contributions scheduled.';
  };

  const paintEvents = () => {
    const box = wrap.querySelector('#evtRows');
    box.innerHTML = '';
    W.incomeEvents.forEach((e, i) => {
      const r = el('div', 'evt-row');
      r.innerHTML = `
        <div class="input-wrap"><input class="input" type="number" min="1" max="${W.tenure}" value="${e.year}" data-f="year" aria-label="Event year"></div>
        <div class="input-wrap"><input class="input" type="number" min="5" max="200" step="5" value="${e.pct}" data-f="pct" aria-label="SIP increase %"></div>
        <span class="small muted">Year ${e.year}: SIP steps up +${e.pct}%</span>
        <button class="evt-del" title="Remove">×</button>`;
      r.querySelectorAll('input').forEach(inp => inp.oninput = () => {
        e[inp.dataset.f] = +inp.value || 0;
        r.querySelector('.small').textContent = `Year ${e.year}: SIP steps up +${e.pct}%`;
        echo();
      });
      r.querySelector('.evt-del').onclick = () => { W.incomeEvents.splice(i, 1); paintEvents(); echo(); };
      box.appendChild(r);
    });
    wrap.querySelector('#addEvt').disabled = W.incomeEvents.length >= 5;
  };

  paintEvents(); echo();
  wrap.querySelector('#addEvt').onclick = () => {
    if (W.incomeEvents.length >= 5) return;
    const usedYears = W.incomeEvents.map(e => e.year);
    let y = 3; while (usedYears.includes(y) && y < W.tenure) y += 2;
    W.incomeEvents.push({ year: Math.min(y, W.tenure), pct: 25 });
    paintEvents(); echo();
  };
  wrap.querySelector('#obCorpus').oninput = e => { W.corpus = +e.target.value || 0; echo(); };
  wrap.querySelector('#obMonthly').oninput = e => { W.monthly = +e.target.value || 0; echo(); };
  wrap.querySelector('#obTenure').oninput = e => { W.tenure = +e.target.value; wrap.querySelector('#tenureVal').textContent = W.tenure + ' years'; echo(); };
  wrap.querySelector('#obStep').oninput = e => { W.stepUp = +e.target.value; wrap.querySelector('#stepVal').textContent = W.stepUp + '% / year'; echo(); };
  nav(wrap, main);
}

/* ---------- 03 · goal ---------- */
function stepGoal(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 03</div>
    <div class="ob-hero">What is this capital <em>for?</em></div>
    <p class="page-sub">The objective shapes the construction — a USD liability, a fixed date, or open-ended compounding each build differently.</p>
    <div class="opt-cards" id="obGoals" style="grid-template-columns:1fr 1fr"></div>
    <div class="field" style="margin-top:20px"><label>Target amount (optional — enables goal probability)</label>
      <div class="input-wrap"><span class="prefix">₹</span><input class="input has-prefix" id="obGoalAmt" type="number" step="1000000" min="0" value="${W.goalAmount || ''}" placeholder="e.g. 50000000 for ₹5 Cr"></div>
      <div class="small muted" style="margin-top:6px" id="goalEcho"></div></div>`;
  const gwrap = wrap.querySelector('#obGoals');
  for (const g of GOALS) {
    const c = el('button', 'opt-card' + (W.goalType === g.key ? ' on' : ''),
      `<span><span class="t">${g.label}</span><div class="d">${g.desc}</div></span>`);
    c.onclick = () => { W.goalType = g.key; gwrap.querySelectorAll('.opt-card').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    gwrap.appendChild(c);
  }
  const echo = () => wrap.querySelector('#goalEcho').textContent = W.goalAmount ? fmtINR(W.goalAmount) + ` in ${W.tenure} years` : 'No fixed target — open-ended compounding';
  echo();
  wrap.querySelector('#obGoalAmt').oninput = e => { W.goalAmount = +e.target.value || 0; echo(); };
  nav(wrap, main);
}

/* ---------- 04 · appetite ---------- */
function stepAppetite(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 04</div>
    <div class="ob-hero">Risk <em>appetite.</em></div>
    <p class="page-sub">How much risk do you <b>want</b> to take? Capacity — what you can afford — is computed separately from your tenure and age.</p>
    <div class="opt-cards" id="obApp"></div>`;
  const w2 = wrap.querySelector('#obApp');
  for (const a of APPETITE) {
    const c = el('button', 'opt-card' + (W.appetite === a.v ? ' on' : ''),
      `<span class="glyph">${'●'.repeat(a.v)}${'○'.repeat(5 - a.v)}</span><span><span class="t">${a.label}</span><div class="d">${a.desc}</div></span>`);
    c.onclick = () => { W.appetite = a.v; w2.querySelectorAll('.opt-card').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    w2.appendChild(c);
  }
  nav(wrap, main);
}

/* ---------- 05 · tolerance ---------- */
function stepTolerance(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 05</div>
    <div class="ob-hero">Risk <em>tolerance.</em></div>
    <p class="page-sub">Forget theory — your portfolio is down. At what point do you flinch? Honesty here is worth lakhs later: the most expensive mistake in investing is selling a good plan at the bottom.</p>
    <div class="opt-cards" id="obTol"></div>`;
  const w2 = wrap.querySelector('#obTol');
  for (const t of TOLERANCE) {
    const c = el('button', 'opt-card' + (W.tolerance === t.v ? ' on' : ''),
      `<span class="glyph" style="color:var(--neg)">−${t.dd}%</span><span><span class="t">${t.label}</span><div class="d">${t.desc}</div></span>`);
    c.onclick = () => { W.tolerance = t.v; w2.querySelectorAll('.opt-card').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    w2.appendChild(c);
  }
  nav(wrap, main);
}

/* ---------- 06 · constraints ---------- */
function stepConstraints(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 06</div>
    <div class="ob-hero">Ground <em>rules.</em></div>
    <p class="page-sub">Constraints reshape the eligible universe before construction begins — select all that apply, or none.</p>
    <div class="chip-cloud" id="obCon"></div>
    <div class="card" style="margin-top:22px; display:none" id="conEffects"><h3 class="card-title">How this changes the construction</h3><div id="conList" class="stack small dim"></div></div>`;
  const cloud = wrap.querySelector('#obCon');
  const paint = () => {
    const fx = wrap.querySelector('#conEffects'), list = wrap.querySelector('#conList');
    const on = CONSTRAINTS.filter(c => W.constraints.includes(c.key));
    fx.style.display = on.length ? 'block' : 'none';
    list.innerHTML = on.map(c => `<div>· <b style="color:var(--ink-1)">${c.label}</b> — ${c.effect}</div>`).join('');
  };
  for (const c of CONSTRAINTS) {
    const chip = el('button', 'chip' + (W.constraints.includes(c.key) ? ' on' : ''), c.label);
    chip.onclick = () => {
      const i = W.constraints.indexOf(c.key);
      i >= 0 ? W.constraints.splice(i, 1) : W.constraints.push(c.key);
      chip.classList.toggle('on'); paint();
    };
    cloud.appendChild(chip);
  }
  paint();
  nav(wrap, main, { nextLabel: 'Run the construction' });
}

/* ---------- 07 · construction — the engine, shown working ---------- */
function stepConstruction(wrap, main) {
  const M = models();
  const { rs, adjustments } = explainConstruction(S, M);
  const sched = contributionSchedule(S, S.tenure);
  const classes = ['eq', 'fi', 'alt', 'tac'];
  const sleeveRows = Object.values(SLEEVES)
    .filter(s => M.balanced.sleeves.some(x => x.name === s.name && x.pct > 0) || M.aggressive.sleeves.some(x => x.name === s.name && x.pct > 0) || M.conservative.sleeves.some(x => x.name === s.name && x.pct > 0));

  wrap.style.maxWidth = '880px';
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · Construction</div>
    <div class="ob-hero" style="font-size:32px">Here is exactly how<br>your proposals are <em>built.</em></div>
    <p class="page-sub">No black box. These are the actual numbers the engine computed from your inputs — challenge any of them, or adjust the result before you deploy.</p>

    <div class="card" style="margin-top:26px">
      <h3 class="card-title">Step 1 · Risk scoring</h3>
      <div class="grid g2" style="gap:12px">
        <div class="calc"><b>Capacity ${rs.capacity}/100</b> — can you afford risk?<br>
          0.65 × tenure factor (${rs.parts.tenureScore.toFixed(2)}, from ${S.tenure}y) + 0.35 × age factor (${rs.parts.ageScore.toFixed(2)}, from age ${S.client.age})${rs.parts.liquidityCut ? '<br>× 0.60 liquidity haircut (12-month exit constraint)' : ''}</div>
        <div class="calc"><b>Willingness ${rs.willingness}/100</b> — do you want risk?<br>
          0.5 × appetite (${S.appetite}/5) + 0.5 × drawdown tolerance (${S.tolerance}/5)</div>
      </div>
      <div class="calc" style="margin-top:12px"><b>LIQD risk score = 0.45 × ${rs.capacity} + 0.55 × ${rs.willingness} = ${rs.score}/100.</b>
        The lower of what you can afford and what you can sleep through governs — a portfolio you abandon in a drawdown has no expected return.</div>
    </div>

    <div class="card" style="margin-top:14px">
      <h3 class="card-title">Step 2 · Capital market assumptions (challenge these)</h3>
      <p class="small muted" style="margin-bottom:10px">Long-run nominal INR assumptions per sleeve. Every projection and stress test downstream uses exactly these numbers — change your allocation if you disagree with them.</p>
      <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Sleeve</th><th class="num">E[return]</th><th class="num">Volatility</th><th>Basis</th></tr></thead>
      <tbody>${sleeveRows.map(s => `<tr><td><span class="key"><span class="swatch" style="background:${CLASS_META[s.cls].hex}"></span>${s.name}</span></td>
        <td class="num">${s.ret.toFixed(1)}%</td><td class="num">${s.vol.toFixed(0)}%</td><td class="small">${s.note}</td></tr>`).join('')}</tbody></table></div>
      <div class="row" style="margin-top:16px;gap:26px;flex-wrap:wrap">
        <div>
          <div class="small dim" style="font-weight:640;margin-bottom:8px">Cross-class correlations</div>
          <table class="corr-grid"><tr><th></th>${classes.map(c => `<th>${CLASS_META[c].label.slice(0, 3)}</th>`).join('')}</tr>
          ${classes.map(a => `<tr><th>${CLASS_META[a].label.slice(0, 3)}</th>${classes.map(b => `<td>${CLASS_CORR[a][b].toFixed(2)}</td>`).join('')}</tr>`).join('')}</table>
        </div>
        <p class="small muted" style="flex:1;min-width:220px">Low correlation is the entire point of multi-asset construction: portfolio volatility comes out <b style="color:var(--ink-1)">below the weighted average</b> of the sleeves, because they don't fall together.</p>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <h3 class="card-title">Step 3 · Adjustments the engine applied to your case</h3>
      <div class="stack" style="gap:10px">${adjustments.map(a => `
        <div style="padding:10px 0;border-bottom:1px solid var(--line-soft)">
          <div style="font-weight:600;font-size:13.5px">${a.what}</div>
          <div class="small muted" style="margin-top:2px">${a.why}</div>
        </div>`).join('')}</div>
    </div>

    <div class="card" style="margin-top:14px">
      <h3 class="card-title">Step 4 · Your contribution path (feeds every projection)</h3>
      <div class="calc">SIP today <b>${fmtINR(S.monthly)}/mo</b> → step-up ${S.stepUp}%/yr${S.incomeEvents.length ? ' → income events: ' + S.incomeEvents.map(e => `<b>Y${e.year} +${e.pct}%</b>`).join(', ') : ''} → by year ${S.tenure}: <b>${fmtINR(sched.length ? sched[sched.length - 1].monthly : 0)}/mo</b>. Total fresh capital: <b>${fmtINR(sched.reduce((s, r) => s + r.annual, 0))}</b>.</div>
    </div>`;
  nav(wrap, main, { nextLabel: 'See the three proposals' });
}

/* ---------- 08 · the three proposals ---------- */
function stepModels(wrap, main) {
  const rs = riskScore(S);
  const reco = recommendedModel(S);
  const M = models();
  const sched = contributionSchedule(S, S.tenure);
  wrap.style.maxWidth = '1080px';
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · Proposals</div>
    <div class="ob-hero" style="font-size:32px">Three proposals.<br>One <em>investment policy.</em></div>
    <p class="page-sub">Same engine, three risk postures. Deploy one as-is, or deploy and fine-tune the allocation yourself — the engine reprices it live either way. You can switch or rebalance at any time.</p>
    <div class="model-cards" id="mcards"></div>
    <div class="legend" style="margin-top:18px">${CLASS_ORDER.map(k => `<span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label}</span>`).join('')}</div>
    <p class="small muted" style="margin-top:14px">Median outcomes from 2,000 Monte Carlo paths including your step-up SIP and income events. Engine recommendation is based on risk score ${rs.score}/100 — it is a recommendation, not a default you must accept.</p>`;
  const cards = wrap.querySelector('#mcards');
  for (const key of ['conservative', 'balanced', 'aggressive']) {
    const m = M[key];
    const sim = simulate(S.corpus, sched, m.mu, m.sigma, S.tenure, { sims: 1200 });
    const median = sim.rows[sim.rows.length - 1].p50;
    const card = el('div', 'model-card' + (key === reco ? ' reco' : ''), `
      ${key === reco ? '<span class="reco-tag">ENGINE RECOMMENDATION</span>' : ''}
      <div><div class="eyebrow" style="color:var(--ink-3)">${m.tag}</div><h4>${m.label}</h4></div>
      <div><span class="cagr">${fmtPct(m.mu, 1)}</span> <span class="muted small">expected CAGR</span></div>
      <div class="strip"></div>
      <div class="mini-rows">
        <div class="r"><span>Median at year ${S.tenure}</span><b>${fmtINR(median)}</b></div>
        <div class="r"><span>Volatility</span><b>${fmtPct(m.sigma, 1)}</b></div>
        <div class="r"><span>Stress drawdown</span><b style="color:var(--neg)">${m.maxDD}%</b></div>
        <div class="r"><span>Sharpe (vs 6.5% rf)</span><b>${m.sharpe}</b></div>
      </div>
      <p class="small muted" style="min-height:56px">${m.desc}</p>
      <button class="btn ${key === reco ? 'primary' : ''}" data-act="deploy" style="width:100%">Deploy ${m.label}</button>
      <button class="btn ghost sm" data-act="tune" style="width:100%">Deploy & adjust allocation →</button>`);
    allocStrip(card.querySelector('.strip'), CLASS_ORDER.map(k => ({ label: CLASS_META[k].label, value: m.weights[k], color: CLASS_META[k].hex })));
    const deploy = async (dest) => {
      S.chosenModel = key; S.customWeights = null; S.onboarded = true; save();
      await buffer('stack', { title: `Deploying ${m.label}`, subs: ['ALLOCATING SLEEVES', 'SETTING ±5PT POLICY BANDS', 'PREPARING YOUR WORKSPACE'], ms: 1500 });
      go(dest);
    };
    card.querySelector('[data-act=deploy]').onclick = () => deploy('overview');
    card.querySelector('[data-act=tune]').onclick = () => deploy('rebalance');
    cards.appendChild(card);
  }
}
