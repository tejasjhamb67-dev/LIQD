// LIQD — the engine. One deterministic model powers construction, projections,
// scenarios and rebalancing, so every screen agrees with every other screen.

import { SLEEVES } from './data.js';
import { clamp } from './util.js';

/* =============== 1. Risk score =============== */
// capacity: can they take risk (tenure, age, liquidity constraint)
// willingness: do they want to (appetite, drawdown tolerance)
export function riskScore(p) {
  const tenureScore = clamp((p.tenure - 1) / 24, 0, 1);            // 1yr → 0, 25yr → 1
  const ageScore = clamp((55 - (p.age || 32)) / 30, 0, 1);          // younger = more capacity
  let capacity = 100 * (0.65 * tenureScore + 0.35 * ageScore);
  if (p.constraints.includes('liquidity')) capacity *= 0.6;

  const willingness = 100 * (0.5 * (p.appetite - 1) / 4 + 0.5 * (p.tolerance - 1) / 4);
  const score = Math.round(0.45 * capacity + 0.55 * willingness);
  return { score: clamp(score, 5, 98), capacity: Math.round(capacity), willingness: Math.round(willingness) };
}

/* =============== 2. Model portfolios =============== */
// base class weights [eq, fi, alt, tac]
const BASES = {
  conservative: { eq: 25, fi: 55, alt: 15, tac: 5 },
  balanced:     { eq: 50, fi: 28, alt: 16, tac: 6 },
  aggressive:   { eq: 70, fi: 8,  alt: 14, tac: 8 },
};
const META = {
  conservative: { label: 'Conservative', tag: 'Preserve', desc: 'Sleep-at-night compounding. Sovereign-heavy core, equity as a measured satellite.' },
  balanced:     { label: 'Balanced', tag: 'Compound', desc: 'The all-weather engine. Enough equity to grow, enough ballast to hold through cycles.' },
  aggressive:   { label: 'Aggressive', tag: 'Accelerate', desc: 'Maximum long-run growth. Deep drawdowns accepted as the cost of compounding.' },
};

// sleeve split inside each class as fraction of the class weight
function sleeveMix(mkey, p) {
  const big = p.corpus >= 1e7;            // AIF/PMS gates
  const uhni = ['uhni', 'family'].includes(p.investorType);
  const c = p.constraints;
  const noIntl = c.includes('no_intl');
  const noDeriv = c.includes('no_deriv');
  const noSmall = c.includes('no_smallcap');
  const liquidity = c.includes('liquidity');
  const shariah = c.includes('shariah');

  const mix = { eq: [], fi: [], alt: [], tac: [] };

  // --- equities
  const intl = noIntl ? 0 : (mkey === 'conservative' ? 0.18 : mkey === 'balanced' ? 0.24 : 0.26);
  let small = noSmall ? 0 : (mkey === 'aggressive' ? 0.16 : mkey === 'balanced' ? 0.08 : 0);
  const flexi = mkey === 'conservative' ? 0.22 : 0.32;
  mix.eq = [
    ['eq_large', 1 - intl - small - flexi],
    ['eq_flexi', flexi],
    ['eq_small', small],
    ['eq_intl', intl],
  ];

  // --- fixed income (shariah: replaced at class level below)
  const credit = big && !liquidity ? (mkey === 'aggressive' ? 0.25 : 0.15) : 0;
  mix.fi = mkey === 'conservative'
    ? [['fi_gilt', 0.42 - credit / 2], ['fi_corp', 0.33 - credit / 2], ['fi_credit', credit], ['fi_arb', 0.25]]
    : [['fi_gilt', 0.3 - credit / 2], ['fi_corp', 0.35 - credit / 2], ['fi_credit', credit], ['fi_arb', 0.35]];

  // --- alternatives
  const aif = big && !liquidity ? (mkey === 'aggressive' ? 0.3 : 0.2) : 0;
  const unlisted = uhni && !liquidity && mkey === 'aggressive' ? 0.15 : 0;
  const gold = shariah ? 0.45 : (mkey === 'conservative' ? 0.45 : 0.3);
  mix.alt = [
    ['alt_reit', 1 - gold - aif - unlisted],
    ['alt_gold', gold],
    ['alt_aif', aif],
    ['alt_unlisted', unlisted],
  ];

  // --- tactical
  mix.tac = noDeriv
    ? [['tac_momo', 0.7], ['tac_special', 0.3]]
    : mkey === 'conservative'
      ? [['tac_cc', 0.7], ['tac_special', 0.3]]
      : [['tac_momo', 0.5], ['tac_cc', 0.25], ['tac_special', 0.25]];

  return mix;
}

export function buildModels(p) {
  const rs = riskScore(p);
  const tilt = (rs.score - 50) / 50; // -0.9..0.96
  const shariah = p.constraints.includes('shariah');

  return Object.fromEntries(['conservative', 'balanced', 'aggressive'].map(mkey => {
    // tilt equity ±8pts by risk score, funded from FI
    const b = { ...BASES[mkey] };
    let shift = Math.round(8 * tilt);
    shift = clamp(shift, -b.eq + 10, b.fi - 5);
    b.eq += shift; b.fi -= shift;
    if (shariah) { b.alt += b.fi - 4; b.fi = 4; } // debt → gold/REIT-heavy alts, arb-only residue

    const mixes = sleeveMix(mkey, p);
    const sleeves = [];
    for (const cls of ['eq', 'fi', 'alt', 'tac']) {
      let parts = mixes[cls].filter(([, f]) => f > 0.001);
      const tot = parts.reduce((s, [, f]) => s + f, 0);
      for (const [sk, f] of parts) {
        sleeves.push({ ...SLEEVES[sk], key: sk, pct: +(b[cls] * f / tot).toFixed(1) });
      }
    }
    const model = { key: mkey, ...META[mkey], weights: b, sleeves, riskScore: rs };
    Object.assign(model, portfolioStats(sleeves));
    return [mkey, model];
  }));
}

/** which of the three the engine recommends */
export function recommendedModel(p) {
  const s = riskScore(p).score;
  return s < 38 ? 'conservative' : s < 66 ? 'balanced' : 'aggressive';
}

/* =============== 3. Portfolio math =============== */
export function portfolioStats(sleeves) {
  const w = sleeves.map(s => s.pct / 100);
  const mu = sleeves.reduce((s, x, i) => s + w[i] * x.ret, 0);
  // vol with a flat 0.55 avg cross-correlation (diversification credit)
  const rho = 0.55;
  let v = 0;
  for (let i = 0; i < sleeves.length; i++)
    for (let j = 0; j < sleeves.length; j++)
      v += w[i] * w[j] * sleeves[i].vol * sleeves[j].vol * (i === j ? 1 : rho);
  const sigma = Math.sqrt(v);
  const maxDD = -(2.0 * sigma + 3);            // heuristic stress drawdown
  const sharpe = (mu - 6.5) / sigma;           // vs ~repo-ish riskfree
  return { mu: +mu.toFixed(1), sigma: +sigma.toFixed(1), maxDD: +maxDD.toFixed(0), sharpe: +sharpe.toFixed(2) };
}

/** stats when the user drags class weights in the Rebalancing Studio */
export function statsForWeights(model, weights) {
  const sleeves = model.sleeves.map(s => {
    const cw = model.weights[s.cls];
    return { ...s, pct: cw > 0 ? s.pct / cw * weights[s.cls] : 0 };
  });
  return { sleeves, ...portfolioStats(sleeves) };
}

/* =============== 4. Projections (lognormal bands) =============== */
const Z = { p10: -1.2816, p25: -0.6745, p50: 0, p75: 0.6745, p90: 1.2816 };

/** percentile paths with monthly contributions. Returns [{t, p10..p90}] */
export function project(corpus, monthly, mu, sigma, years) {
  const m = mu / 100, s = sigma / 100;
  const out = [];
  for (let t = 0; t <= years; t++) {
    const row = { t };
    for (const [k, z] of Object.entries(Z)) {
      // corpus part
      let v = corpus * Math.exp((m - s * s / 2) * t + z * s * Math.sqrt(t));
      // contributions: each year's flow compounds for remaining time at the same percentile drift
      if (monthly > 0) {
        for (let y = 0; y < t; y++) {
          const rem = t - y - 0.5;
          v += monthly * 12 * Math.exp((m - s * s / 2) * rem + z * s * Math.sqrt(rem) * 0.6);
        }
      }
      row[k] = v;
    }
    out.push(row);
  }
  return out;
}

/** probability that terminal wealth ≥ goal (lognormal CDF, corpus-only approx + flows at median) */
export function goalProbability(corpus, monthly, mu, sigma, years, goal) {
  if (!goal || goal <= 0) return null;
  const m = mu / 100, s = sigma / 100;
  const flows = monthly > 0
    ? Array.from({ length: years }, (_, y) => monthly * 12 * Math.exp(m * (years - y - 0.5))).reduce((a, b) => a + b, 0)
    : 0;
  const effGoal = Math.max(goal - flows, 1);
  const mean = Math.log(corpus) + (m - s * s / 2) * years;
  const sd = s * Math.sqrt(years);
  const zScore = (Math.log(effGoal) - mean) / sd;
  // never print certainty — the tails are always live
  return Math.min(99, Math.max(1, Math.round(100 * (1 - normCdf(zScore)))));
}
function normCdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

/* =============== 5. Scenario engine =============== */
export function runScenario(scn, weights, corpus, mu) {
  const hit = ['eq', 'fi', 'alt', 'tac'].reduce((s, c) => s + (weights[c] / 100) * scn.shocks[c], 0);
  const impact = corpus * hit / 100;
  const recoveryMonths = hit >= 0 ? 0 : Math.ceil(12 * Math.log(1 / (1 + hit / 100)) / Math.log(1 + mu / 100));
  return { hitPct: +hit.toFixed(1), impact, recoveryMonths };
}

/* =============== 6. Fee / advantage math =============== */
// grow corpus at gross return minus annual cost drag; LIQD = flat subscription
export function feeDrag(corpus, monthly, grossPct, years, tiers) {
  return tiers.map(t => {
    let v = corpus;
    const path = [v];
    for (let y = 1; y <= years; y++) {
      const net = grossPct / 100 - (t.pctFee || 0) / 100;
      v = v * (1 + net) + monthly * 12 * (1 + net / 2) - (t.flatFee || 0);
      if (t.perfShare) { // profit share on gains above hurdle
        const gain = v * (grossPct / 100);
        v -= Math.max(0, gain - v * (t.hurdle || 0) / 100) * t.perfShare / 100;
      }
      path.push(v);
    }
    return { ...t, final: v, path };
  });
}
