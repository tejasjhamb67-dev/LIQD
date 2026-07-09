// LIQD — the engine. One deterministic model powers construction, projections,
// scenarios and rebalancing, so every screen agrees with every other screen.
// v2: contribution schedules (step-up SIP + income events), seeded Monte Carlo,
// class correlation matrix, risk contributions, efficient frontier.

import { SLEEVES } from './data.js';
import { clamp } from './util.js';

/* =============== 1. Risk score =============== */
// capacity: can they take risk (tenure, age, liquidity constraint)
// willingness: do they want to (appetite, drawdown tolerance)
export function riskScore(p) {
  const tenureScore = clamp((p.tenure - 1) / 24, 0, 1);            // 1yr → 0, 25yr → 1
  const ageScore = clamp((55 - (p.age || p.client?.age || 32)) / 30, 0, 1); // younger = more capacity
  let capacity = 100 * (0.65 * tenureScore + 0.35 * ageScore);
  const liquidityCut = p.constraints.includes('liquidity');
  if (liquidityCut) capacity *= 0.6;

  const willingness = 100 * (0.5 * (p.appetite - 1) / 4 + 0.5 * (p.tolerance - 1) / 4);
  const score = Math.round(0.45 * capacity + 0.55 * willingness);
  return {
    score: clamp(score, 5, 98),
    capacity: Math.round(capacity),
    willingness: Math.round(willingness),
    parts: { tenureScore, ageScore, liquidityCut },
  };
}

/* =============== 2. Correlations =============== */
// long-run cross-asset-class correlation assumptions (INR investor)
export const CLASS_CORR = {
  eq:  { eq: 1.00, fi: 0.12, alt: 0.35, tac: 0.72 },
  fi:  { eq: 0.12, fi: 1.00, alt: 0.15, tac: 0.10 },
  alt: { eq: 0.35, fi: 0.15, alt: 1.00, tac: 0.30 },
  tac: { eq: 0.72, fi: 0.10, alt: 0.30, tac: 1.00 },
};
const INTRA_CLASS = 0.85; // sleeves inside the same class move mostly together

function corr(a, b) {
  if (a.key === b.key) return 1;
  if (a.cls === b.cls) return INTRA_CLASS;
  return CLASS_CORR[a.cls][b.cls];
}

/* =============== 3. Model portfolios =============== */
const BASES = {
  conservative: { eq: 25, fi: 55, alt: 15, tac: 5 },
  balanced:     { eq: 50, fi: 28, alt: 16, tac: 6 },
  aggressive:   { eq: 70, fi: 8,  alt: 14, tac: 8 },
};
const META = {
  conservative: { label: 'Conservative', tag: 'Preserve', desc: 'Sovereign-heavy core with equity as a measured satellite. Built for shallow drawdowns and steady real returns.' },
  balanced:     { label: 'Balanced', tag: 'Compound', desc: 'The all-weather policy: enough equity to compound meaningfully, enough ballast to hold through full cycles.' },
  aggressive:   { label: 'Aggressive', tag: 'Accelerate', desc: 'Maximum long-run growth. Deep drawdowns are accepted as the explicit price of the highest expected terminal wealth.' },
};

function sleeveMix(mkey, p) {
  const big = p.corpus >= 1e7;            // SEBI AIF/PMS minimums
  const uhni = ['uhni', 'family'].includes(p.investorType);
  const c = p.constraints;
  const noIntl = c.includes('no_intl');
  const noDeriv = c.includes('no_deriv');
  const noSmall = c.includes('no_smallcap');
  const liquidity = c.includes('liquidity');
  const shariah = c.includes('shariah');

  const mix = { eq: [], fi: [], alt: [], tac: [] };

  const intl = noIntl ? 0 : (mkey === 'conservative' ? 0.18 : mkey === 'balanced' ? 0.24 : 0.26);
  let small = noSmall ? 0 : (mkey === 'aggressive' ? 0.16 : mkey === 'balanced' ? 0.08 : 0);
  const flexi = mkey === 'conservative' ? 0.22 : 0.32;
  mix.eq = [
    ['eq_large', 1 - intl - small - flexi],
    ['eq_flexi', flexi],
    ['eq_small', small],
    ['eq_intl', intl],
  ];

  const credit = big && !liquidity ? (mkey === 'aggressive' ? 0.25 : 0.15) : 0;
  mix.fi = mkey === 'conservative'
    ? [['fi_gilt', 0.42 - credit / 2], ['fi_corp', 0.33 - credit / 2], ['fi_credit', credit], ['fi_arb', 0.25]]
    : [['fi_gilt', 0.3 - credit / 2], ['fi_corp', 0.35 - credit / 2], ['fi_credit', credit], ['fi_arb', 0.35]];

  const aif = big && !liquidity ? (mkey === 'aggressive' ? 0.3 : 0.2) : 0;
  const unlisted = uhni && !liquidity && mkey === 'aggressive' ? 0.15 : 0;
  const gold = shariah ? 0.45 : (mkey === 'conservative' ? 0.45 : 0.3);
  mix.alt = [
    ['alt_reit', 1 - gold - aif - unlisted],
    ['alt_gold', gold],
    ['alt_aif', aif],
    ['alt_unlisted', unlisted],
  ];

  mix.tac = noDeriv
    ? [['tac_momo', 0.7], ['tac_special', 0.3]]
    : mkey === 'conservative'
      ? [['tac_cc', 0.7], ['tac_special', 0.3]]
      : [['tac_momo', 0.5], ['tac_cc', 0.25], ['tac_special', 0.25]];

  return mix;
}

export function buildModels(p) {
  const rs = riskScore(p);
  const tilt = (rs.score - 50) / 50;
  const shariah = p.constraints.includes('shariah');

  return Object.fromEntries(['conservative', 'balanced', 'aggressive'].map(mkey => {
    const b = { ...BASES[mkey] };
    let shift = Math.round(8 * tilt);
    shift = clamp(shift, -b.eq + 10, b.fi - 5);
    b.eq += shift; b.fi -= shift;
    if (shariah) { b.alt += b.fi - 4; b.fi = 4; }

    const mixes = sleeveMix(mkey, p);
    const sleeves = [];
    for (const cls of ['eq', 'fi', 'alt', 'tac']) {
      let parts = mixes[cls].filter(([, f]) => f > 0.001);
      const tot = parts.reduce((s, [, f]) => s + f, 0);
      for (const [sk, f] of parts) {
        sleeves.push({ ...SLEEVES[sk], key: sk, pct: +(b[cls] * f / tot).toFixed(1) });
      }
    }
    const model = { key: mkey, ...META[mkey], weights: b, sleeves, riskScore: rs, tiltPts: shift, base: { ...BASES[mkey] } };
    Object.assign(model, portfolioStats(sleeves));
    return [mkey, model];
  }));
}

export function recommendedModel(p) {
  const s = riskScore(p).score;
  return s < 38 ? 'conservative' : s < 66 ? 'balanced' : 'aggressive';
}

/* ---- construction explainability: everything the wizard changed, as data ---- */
export function explainConstruction(p, M) {
  const rs = riskScore(p);
  const adj = [];
  const tilt = M.balanced.tiltPts;
  if (tilt !== 0) adj.push({
    what: `Equity ${tilt > 0 ? '+' : ''}${tilt} pts across all three proposals, funded from fixed income`,
    why: `Risk score ${rs.score} is ${tilt > 0 ? 'above' : 'below'} the neutral 50 — the tilt is (score − 50) / 50 × 8 pts`,
  });
  const has = k => p.constraints.includes(k);
  if (has('no_intl')) adj.push({ what: 'Global sleeve removed; weight folded into domestic large cap', why: 'Your constraint: no international exposure' });
  else adj.push({ what: `Global equity sleeve at ${(M.balanced.sleeves.find(s => s.key === 'eq_intl') || { pct: 0 }).pct}% of the Balanced proposal (LRS/GIFT routes)`, why: 'Your income, property and career are already concentrated in India — the USD sleeve diversifies country and currency risk' });
  if (has('liquidity')) adj.push({ what: 'AIF, private credit and unlisted sleeves excluded; capacity score cut 40%', why: 'Your constraint: possible exit within 12 months — nothing with a lock-in is eligible' });
  else if (p.corpus >= 1e7) adj.push({ what: 'AIF / private credit sleeves included', why: `Corpus ${p.corpus >= 1e7 ? 'clears' : 'is below'} the SEBI ₹1 Cr AIF minimum` });
  else adj.push({ what: 'AIF, PMS and unlisted sleeves excluded', why: 'SEBI minimums (₹50L PMS / ₹1Cr AIF) — the engine re-admits them as your corpus grows' });
  if (has('no_smallcap')) adj.push({ what: 'Small cap sleeve removed', why: 'Your constraint: no small caps' });
  if (has('no_deriv')) adj.push({ what: 'Covered-call overlay removed; tactical sleeve is momentum + special situations only', why: 'Your constraint: no derivatives' });
  if (has('shariah')) adj.push({ what: 'Interest-bearing debt replaced with gold, REITs and screened equity', why: 'Your constraint: Shariah alignment' });
  if (has('esg')) adj.push({ what: 'Equity sleeves apply an ESG exclusion screen (tobacco, thermal coal, gambling)', why: 'Your constraint: ESG screen' });
  if (has('concentrated')) adj.push({ what: 'Blueprint reserves a staggered diversification plan for your ESOP/RSU position', why: 'Single-stock risk is the largest uncompensated risk most professionals carry' });
  if (has('tax_sensitive')) adj.push({ what: 'Debt exposure routed via arbitrage funds; harvesting always on', why: 'Your constraint: optimise for tax — arbitrage funds get equity tax treatment' });
  return { rs, adjustments: adj };
}

/* =============== 4. Portfolio math =============== */
export function portfolioStats(sleeves) {
  const w = sleeves.map(s => s.pct / 100);
  const mu = sleeves.reduce((s, x, i) => s + w[i] * x.ret, 0);
  let v = 0;
  for (let i = 0; i < sleeves.length; i++)
    for (let j = 0; j < sleeves.length; j++)
      v += w[i] * w[j] * sleeves[i].vol * sleeves[j].vol * corr(sleeves[i], sleeves[j]);
  const sigma = Math.sqrt(v);
  const maxDD = -(2.0 * sigma + 3);
  const sharpe = (mu - 6.5) / sigma;
  return { mu: +mu.toFixed(1), sigma: +sigma.toFixed(1), maxDD: +maxDD.toFixed(0), sharpe: +sharpe.toFixed(2) };
}

export function statsForWeights(model, weights) {
  const sleeves = model.sleeves.map(s => {
    const cw = model.weights[s.cls];
    return { ...s, pct: cw > 0 ? s.pct / cw * weights[s.cls] : 0 };
  });
  return { sleeves, ...portfolioStats(sleeves) };
}

/** share of total portfolio variance contributed by each asset class (sums to 100) */
export function riskContributions(sleeves) {
  const w = sleeves.map(s => s.pct / 100);
  let total = 0;
  const bySleeve = sleeves.map((si, i) => {
    let c = 0;
    for (let j = 0; j < sleeves.length; j++)
      c += w[i] * w[j] * si.vol * sleeves[j].vol * corr(si, sleeves[j]);
    total += c;
    return c;
  });
  const out = { eq: 0, fi: 0, alt: 0, tac: 0 };
  sleeves.forEach((s, i) => out[s.cls] += bySleeve[i]);
  for (const k in out) out[k] = total > 0 ? +(100 * out[k] / total).toFixed(1) : 0;
  return out;
}

/* =============== 5. Contribution schedule =============== */
/** Annual contribution amounts for each year, from base SIP, annual step-up %
    and discrete income events [{year, pct}] (SIP jumps at salary hikes). */
export function contributionSchedule(p, years) {
  const events = (p.incomeEvents || []).filter(e => e.year >= 1 && e.pct > 0);
  const out = [];
  let monthly = p.monthly;
  for (let y = 0; y < years; y++) {
    if (y > 0) monthly *= 1 + (p.stepUp || 0) / 100;
    for (const e of events) if (e.year === y + 1) monthly *= 1 + e.pct / 100;
    out.push({ year: y + 1, monthly: Math.round(monthly), annual: Math.round(monthly * 12) });
  }
  return out;
}

/* =============== 6. Monte Carlo projections =============== */
// mulberry32 PRNG — deterministic across screens for the same inputs
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const PCTS = [['p10', 0.10], ['p25', 0.25], ['p50', 0.50], ['p75', 0.75], ['p90', 0.90]];

/** Simulate wealth paths. contribs = output of contributionSchedule.
    Returns { rows: [{t, invested, p10..p90}], terminal: sorted final values } */
export function simulate(corpus, contribs, mu, sigma, years, { sims = 2000, seed = 20260709 } = {}) {
  const m = mu / 100, s = sigma / 100;
  const drift = m - s * s / 2;
  const rand = rng(seed);
  // pre-draw normals: sims × years via Box–Muller
  const paths = new Array(sims).fill(0).map(() => corpus);
  const rows = [{ t: 0, invested: corpus, p10: corpus, p25: corpus, p50: corpus, p75: corpus, p90: corpus }];
  let invested = corpus;
  const yearVals = new Float64Array(sims);
  for (let t = 1; t <= years; t++) {
    const c = contribs[t - 1] ? contribs[t - 1].annual : 0;
    invested += c;
    for (let i = 0; i < sims; i++) {
      const u1 = Math.max(rand(), 1e-12), u2 = rand();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const G = Math.exp(drift + s * z);
      // contributions arrive through the year → they see ~half the year's growth
      paths[i] = paths[i] * G + c * Math.sqrt(G);
      yearVals[i] = paths[i];
    }
    const sorted = Float64Array.from(yearVals).sort();
    const row = { t, invested };
    for (const [k, q] of PCTS) row[k] = sorted[Math.min(sims - 1, Math.floor(q * sims))];
    rows.push(row);
  }
  return { rows, terminal: Float64Array.from(paths).sort() };
}

/** goal probability straight from the simulated terminal distribution */
export function goalProbabilityMC(terminal, goal) {
  if (!goal || goal <= 0) return null;
  let hit = 0;
  for (let i = 0; i < terminal.length; i++) if (terminal[i] >= goal) hit++;
  return Math.min(99, Math.max(1, Math.round(100 * hit / terminal.length)));
}

/* =============== 7. Efficient frontier =============== */
/** Sample feasible class-weight combinations, return {sigma, mu} points.
    Guardrails mirror policy: alternatives ≤ 30, tactical ≤ 15. */
export function frontier(model) {
  const pts = [];
  for (let eq = 0; eq <= 90; eq += 5)
    for (let alt = 0; alt <= 30; alt += 5)
      for (let tac = 0; tac <= 15; tac += 5) {
        const fi = 100 - eq - alt - tac;
        if (fi < 0) continue;
        const st = statsForWeights(model, { eq, fi, alt, tac });
        pts.push({ eq, fi, alt, tac, mu: st.mu, sigma: st.sigma });
      }
  return pts;
}

/* =============== 8. Scenario engine =============== */
export function runScenario(scn, weights, corpus, mu) {
  const hit = ['eq', 'fi', 'alt', 'tac'].reduce((s, c) => s + (weights[c] / 100) * scn.shocks[c], 0);
  const impact = corpus * hit / 100;
  const recoveryMonths = hit >= 0 ? 0 : Math.ceil(12 * Math.log(1 / (1 + hit / 100)) / Math.log(1 + mu / 100));
  return { hitPct: +hit.toFixed(1), impact, recoveryMonths };
}

/* =============== 9. Fee / advantage math =============== */
export function feeDrag(corpus, contribs, grossPct, years, tiers) {
  return tiers.map(t => {
    let v = corpus;
    const path = [v];
    for (let y = 1; y <= years; y++) {
      const net = grossPct / 100 - (t.pctFee || 0) / 100;
      const c = contribs[y - 1] ? contribs[y - 1].annual : 0;
      v = v * (1 + net) + c * (1 + net / 2) - (t.flatFee || 0);
      if (t.perfShare) {
        const gain = v * (grossPct / 100);
        v -= Math.max(0, gain - v * (t.hurdle || 0) / 100) * t.perfShare / 100;
      }
      path.push(v);
    }
    return { ...t, final: v, path };
  });
}
