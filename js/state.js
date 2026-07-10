// LIQD — client state, persisted to localStorage

import { buildModels, statsForWeights } from './engine.js';
import { schedulePush, pullState } from './live.js';

const KEY = 'liqd.v1';

export const DEFAULTS = {
  onboarded: false,
  client: { name: '', age: 32 },
  investorType: 'henry',
  corpus: 5e6,
  monthly: 100000,
  stepUp: 8,                // annual SIP step-up %
  incomeEvents: [           // major salary/income hikes → SIP jumps
    { year: 3, pct: 30 },
    { year: 7, pct: 25 },
    { year: 12, pct: 25 },
    { year: 18, pct: 20 },
  ],
  tenure: 15,
  goalType: 'wealth',
  goalAmount: 0,
  appetite: 3,
  tolerance: 3,
  constraints: [],
  glide: false,             // de-risk toward the conservative landing mix in the final years
  chosenModel: null,        // 'conservative' | 'balanced' | 'aggressive'
  customWeights: null,      // set from Rebalancing Studio
  connections: [],          // integration keys
  watchlist: ['RELIANCE', 'HDFCBANK', 'NVDA'],
  spend: null,              // credit: monthly spend profile
  learn: null,              // learn: { done, xp }
  pulse: [],                // pulse: user posts
  circles: [],              // circles joined
  reviewRequested: null,    // advisory review queue date
};

export let S = load();

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}
export function save() {
  S._savedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(S));
  schedulePush(S);            // best-effort cloud sync; no-op without the API
}
export function reset() { S = { ...DEFAULTS, client: { name: '', age: 32 }, constraints: [], connections: [] }; save(); }

/** Pull cloud state once at boot; adopt it only if strictly newer. */
export async function initSync() {
  const doc = await pullState();
  if (doc && doc.state && (doc.updatedAt || 0) > (S._savedAt || 0)) {
    S = { ...DEFAULTS, ...doc.state };
    localStorage.setItem(KEY, JSON.stringify(S));
    return true;
  }
  return false;
}

let modelCache = null, cacheSig = '';
export function models() {
  const sig = JSON.stringify([S.corpus, S.tenure, S.appetite, S.tolerance, S.constraints, S.investorType, S.client.age]);
  if (sig !== cacheSig) { modelCache = buildModels(S); cacheSig = sig; }
  return modelCache;
}

/** the active portfolio: chosen model, with custom weights applied if the user rebalanced */
export function active() {
  if (!S.chosenModel) return null;
  const m = models()[S.chosenModel];
  if (!S.customWeights) return m;
  const st = statsForWeights(m, S.customWeights);
  return { ...m, weights: { ...S.customWeights }, sleeves: st.sleeves, mu: st.mu, sigma: st.sigma, maxDD: st.maxDD, sharpe: st.sharpe, customized: true };
}
