// LIQD — Blueprint: the inputs wizard → 3 generated model portfolios → choose one

import { S, save, models } from '../state.js';
import { riskScore, recommendedModel, project } from '../engine.js';
import { INVESTOR_TYPES, GOALS, APPETITE, TOLERANCE, CONSTRAINTS } from '../data.js';
import { el, esc, fmtINR, fmtPct, CLASS_META, CLASS_ORDER } from '../util.js';
import { allocStrip } from '../charts.js';
import { go } from '../app.js';

const STEPS = ['who', 'money', 'goal', 'appetite', 'tolerance', 'constraints', 'models'];
let step = 0;
// working copy so cancelling an edit doesn't corrupt saved state
let W;

export function renderOnboarding(main) {
  W = {
    name: S.client.name, age: S.client.age, investorType: S.investorType,
    corpus: S.corpus, monthly: S.monthly, tenure: S.tenure,
    goalType: S.goalType, goalAmount: S.goalAmount,
    appetite: S.appetite, tolerance: S.tolerance,
    constraints: [...S.constraints],
  };
  step = 0;
  drawStep(main);
}

function commit() {
  S.client.name = W.name; S.client.age = W.age; S.investorType = W.investorType;
  S.corpus = W.corpus; S.monthly = W.monthly; S.tenure = W.tenure;
  S.goalType = W.goalType; S.goalAmount = W.goalAmount;
  S.appetite = W.appetite; S.tolerance = W.tolerance; S.constraints = [...W.constraints];
  save();
}

function progress() {
  return `<div class="ob-progress">${STEPS.map((s, i) => `<i class="${i <= step ? 'done' : ''}"></i>`).join('')}</div>`;
}

function nav(wrap, main, { nextLabel = 'Continue', canNext = true } = {}) {
  const n = el('div', 'ob-nav');
  const back = el('button', 'btn ghost', '← Back');
  back.style.visibility = step === 0 ? 'hidden' : 'visible';
  back.onclick = () => { step--; drawStep(main); };
  const next = el('button', 'btn primary', nextLabel + ' →');
  next.disabled = !canNext;
  next.onclick = () => {
    if (step === STEPS.length - 2) { commit(); buildAnimation(main); }
    else { step++; drawStep(main); }
  };
  n.append(back, next);
  wrap.appendChild(n);
  return next;
}

function drawStep(main) {
  main.innerHTML = '';
  const wrap = el('div', 'ob-wrap fade-in');
  main.appendChild(wrap);
  const fns ={ who: stepWho, money: stepMoney, goal: stepGoal, appetite: stepAppetite, tolerance: stepTolerance, constraints: stepConstraints, models: stepModels };
  fns[STEPS[step]](wrap, main);
}

/* ---------- step 1: who ---------- */
function stepWho(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 01</div>
    <div class="ob-hero">Let's build your<br><em>money machine.</em></div>
    <p class="page-sub">Six inputs. Ninety seconds. The engine does the rest.</p>
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

/* ---------- step 2: corpus & tenure ---------- */
function stepMoney(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 02</div>
    <div class="ob-hero">The <em>raw material.</em></div>
    <p class="page-sub">What are we deploying, what keeps flowing in, and for how long does it get to compound?</p>
    <div class="grid g2" style="margin-top:26px">
      <div class="field"><label>Investable corpus today</label>
        <div class="input-wrap"><span class="prefix">₹</span><input class="input has-prefix" id="obCorpus" type="number" step="100000" min="100000" value="${W.corpus}"></div>
        <div class="small muted" style="margin-top:6px" id="corpusEcho"></div></div>
      <div class="field"><label>Monthly top-up (SIP)</label>
        <div class="input-wrap"><span class="prefix">₹</span><input class="input has-prefix" id="obMonthly" type="number" step="10000" min="0" value="${W.monthly}"></div>
        <div class="small muted" style="margin-top:6px" id="monthlyEcho"></div></div>
    </div>
    <div class="field" style="margin-top:24px"><label>Tenure — years this money stays invested: <b id="tenureVal" style="color:var(--liqd-a)">${W.tenure} years</b></label>
      <input type="range" id="obTenure" min="1" max="30" value="${W.tenure}">
      <div class="row between small muted" style="margin-top:6px"><span>1 yr</span><span>15 yrs</span><span>30 yrs</span></div>
    </div>`;
  const echo = () => {
    wrap.querySelector('#corpusEcho').textContent = fmtINR(W.corpus);
    wrap.querySelector('#monthlyEcho').textContent = W.monthly ? fmtINR(W.monthly) + ' / month' : 'No top-ups';
  };
  echo();
  wrap.querySelector('#obCorpus').oninput = e => { W.corpus = +e.target.value || 0; echo(); };
  wrap.querySelector('#obMonthly').oninput = e => { W.monthly = +e.target.value || 0; echo(); };
  wrap.querySelector('#obTenure').oninput = e => { W.tenure = +e.target.value; wrap.querySelector('#tenureVal').textContent = W.tenure + ' years'; };
  nav(wrap, main, { canNext: true });
}

/* ---------- step 3: goal ---------- */
function stepGoal(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 03</div>
    <div class="ob-hero">What's the <em>mission?</em></div>
    <p class="page-sub">The goal shapes the glide path — a USD liability, a fixed date, or open-ended compounding all build differently.</p>
    <div class="opt-cards" id="obGoals" style="grid-template-columns:1fr 1fr"></div>
    <div class="field" style="margin-top:20px"><label>Target amount (optional — powers goal probability)</label>
      <div class="input-wrap"><span class="prefix">₹</span><input class="input has-prefix" id="obGoalAmt" type="number" step="1000000" min="0" value="${W.goalAmount || ''}" placeholder="e.g. 50000000 for ₹5 Cr"></div>
      <div class="small muted" style="margin-top:6px" id="goalEcho"></div></div>`;
  const gwrap = wrap.querySelector('#obGoals');
  for (const g of GOALS) {
    const c = el('button', 'opt-card' + (W.goalType === g.key ? ' on' : ''),
      `<span class="glyph">${g.glyph}</span><span><span class="t">${g.label}</span><div class="d">${g.desc}</div></span>`);
    c.onclick = () => { W.goalType = g.key; gwrap.querySelectorAll('.opt-card').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    gwrap.appendChild(c);
  }
  const echo = () => wrap.querySelector('#goalEcho').textContent = W.goalAmount ? fmtINR(W.goalAmount) + ` in ${W.tenure} years` : 'No fixed target — pure compounding';
  echo();
  wrap.querySelector('#obGoalAmt').oninput = e => { W.goalAmount = +e.target.value || 0; echo(); };
  nav(wrap, main);
}

/* ---------- step 4: appetite ---------- */
function stepAppetite(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 04</div>
    <div class="ob-hero">Risk <em>appetite.</em></div>
    <p class="page-sub">How much risk do you <b>want</b> to take? (Capacity is computed separately from your tenure and age.)</p>
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

/* ---------- step 5: tolerance ---------- */
function stepTolerance(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 05</div>
    <div class="ob-hero">Risk <em>tolerance.</em></div>
    <p class="page-sub">Forget theory — your portfolio is down. At what point do you flinch? Honesty here is worth lakhs later.</p>
    <div class="opt-cards" id="obTol"></div>`;
  const w2 = wrap.querySelector('#obTol');
  for (const t of TOLERANCE) {
    const c = el('button', 'opt-card' + (W.tolerance === t.v ? ' on' : ''),
      `<span class="glyph" style="color:var(--neg);font-weight:700;font-size:15px;min-width:52px">−${t.dd}%</span><span><span class="t">${t.label}</span><div class="d">${t.desc}</div></span>`);
    c.onclick = () => { W.tolerance = t.v; w2.querySelectorAll('.opt-card').forEach(x => x.classList.remove('on')); c.classList.add('on'); };
    w2.appendChild(c);
  }
  nav(wrap, main);
}

/* ---------- step 6: constraints ---------- */
function stepConstraints(wrap, main) {
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · 06</div>
    <div class="ob-hero">Ground <em>rules.</em></div>
    <p class="page-sub">Constraints reshape the engine's universe — select all that apply, or none.</p>
    <div class="chip-cloud" id="obCon"></div>
    <div class="card" style="margin-top:22px; display:none" id="conEffects"><h3 class="card-title">How this changes your blueprint</h3><div id="conList" class="stack small dim"></div></div>`;
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
  nav(wrap, main, { nextLabel: 'Build my portfolios' });
}

/* ---------- building animation → models ---------- */
function buildAnimation(main) {
  main.innerHTML = `<div class="building fade-in">
    <div class="orb"></div>
    <div class="eyebrow">LIQD ENGINE</div>
    <h2 style="font-size:26px;margin-top:8px" id="buildMsg">Scoring risk capacity…</h2>
    <p class="muted small" style="margin-top:8px">Same engine. Construction → projection → stress → rebalancing.</p></div>`;
  const msgs = ['Scoring risk capacity…', 'Screening 70+ instrument universe…', 'Applying your constraints…', 'Optimising three glide paths…', 'Stress-testing against 2008 & 2020…'];
  let i = 0;
  const iv = setInterval(() => {
    i++;
    if (i < msgs.length) main.querySelector('#buildMsg').textContent = msgs[i];
    else { clearInterval(iv); step = STEPS.length - 1; drawStep(main); }
  }, 520);
}

/* ---------- step 7: the three models ---------- */
function stepModels(wrap, main) {
  const rs = riskScore(S);
  const reco = recommendedModel(S);
  const M = models();
  wrap.style.maxWidth = '1080px';
  wrap.innerHTML = `${progress()}
    <div class="eyebrow">The Blueprint · Result</div>
    <div class="ob-hero" style="font-size:34px">Three machines. <em>Pick one.</em></div>
    <p class="page-sub">LIQD risk score <b style="color:var(--liqd-a)">${rs.score}/100</b> — capacity ${rs.capacity}, willingness ${rs.willingness}.
      Every model is built from your ${fmtINR(S.corpus)} corpus, ${S.tenure}-year tenure and ${S.constraints.length || 'no'} constraint${S.constraints.length === 1 ? '' : 's'}. You can rebalance or switch any time.</p>
    <div class="model-cards" id="mcards"></div>
    <div class="legend" style="margin-top:18px">${CLASS_ORDER.map(k => `<span class="key"><span class="swatch" style="background:${CLASS_META[k].hex}"></span>${CLASS_META[k].label}</span>`).join('')}</div>`;
  const cards = wrap.querySelector('#mcards');
  for (const key of ['conservative', 'balanced', 'aggressive']) {
    const m = M[key];
    const proj = project(S.corpus, S.monthly, m.mu, m.sigma, S.tenure);
    const median = proj[proj.length - 1].p50;
    const card = el('button', 'model-card' + (key === reco ? ' reco' : ''), `
      ${key === reco ? '<span class="reco-tag">ENGINE PICK</span>' : ''}
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
      <span class="btn ${key === reco ? 'primary' : ''}" style="width:100%">Deploy ${m.label} →</span>`);
    allocStrip(card.querySelector('.strip'), CLASS_ORDER.map(k => ({ label: CLASS_META[k].label, value: m.weights[k], color: CLASS_META[k].hex })));
    card.onclick = () => {
      S.chosenModel = key; S.customWeights = null; S.onboarded = true; save();
      go('overview');
    };
    cards.appendChild(card);
  }
}
