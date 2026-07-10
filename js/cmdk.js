// LIQD — ⌘K command palette: one surface to reach any product, security or action.

import { STOCKS } from './stocks.js';
import { S } from './state.js';

const PAGES = [
  ['Overview', 'overview', 'Wealth'], ['Portfolio', 'portfolio', 'Wealth'], ['Growth & Projections', 'growth', 'Wealth'],
  ['Rebalancing Studio', 'rebalance', 'Wealth'], ['Risk Matrix', 'risk', 'Wealth'], ['Policy Statement (IPS)', 'ips', 'Wealth'],
  ['Terminal', 'terminal', 'Markets'], ['Screener', 'screen', 'Markets'], ['Universe & Assets', 'universe', 'Markets'],
  ['Strategies', 'strategies', 'Craft'], ['Learn', 'learn', 'Craft'],
  ['Credit', 'credit', 'Money'], ['Circles', 'circles', 'Money'], ['Pulse', 'pulse', 'Members'],
  ['Integrations', 'integrations', 'Membership'], ['Why LIQD', 'advantage', 'Membership'], ['Edit Blueprint', 'blueprint', 'Membership'],
];

function index() {
  const items = [
    ...PAGES.map(([label, hash, k]) => ({ label, k, go: hash, keys: label.toLowerCase() })),
    ...STOCKS.map(s => ({ label: `${s.sym} — ${s.name}`, k: s.mkt === 'US' ? 'US · LRS' : 'NSE', go: 'stock/' + s.sym, keys: (s.sym + ' ' + s.name + ' ' + s.sector).toLowerCase() })),
    { label: 'Print Policy Statement', k: 'Action', go: 'ips', keys: 'print ips pdf policy statement' },
    { label: 'Run 2008 stress test', k: 'Action', go: 'risk', keys: 'stress test crash 2008 scenario' },
    { label: 'Check goal probability', k: 'Action', go: 'growth', keys: 'goal probability monte carlo projection' },
  ];
  // only the Wealth workspace is gated pre-onboarding; everything else is open
  const GATED = new Set(['overview', 'portfolio', 'growth', 'rebalance', 'risk', 'ips']);
  if (!S.onboarded) return items.filter(i => !GATED.has(i.go));
  return items;
}

let open = false;

export function initCmdk(go) {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle(go); }
    else if (e.key === 'Escape' && open) close();
  });
}

function close() { document.querySelector('.cmdk-bg')?.remove(); open = false; }

function toggle(go) {
  if (open) return close();
  open = true;
  const bg = document.createElement('div');
  bg.className = 'cmdk-bg';
  bg.innerHTML = `<div class="cmdk">
    <input placeholder="Jump to a product, security or action…" autofocus>
    <div class="hits"></div>
    <div class="foot"><span><kbd class="kk">↑↓</kbd> navigate</span><span><kbd class="kk">↵</kbd> open</span><span><kbd class="kk">esc</kbd> close</span></div>
  </div>`;
  document.body.appendChild(bg);
  bg.onclick = e => { if (e.target === bg) close(); };
  const input = bg.querySelector('input'), hits = bg.querySelector('.hits');
  const all = index();
  let sel = 0, current = [];

  const paint = () => {
    const q = input.value.trim().toLowerCase();
    current = (q ? all.filter(i => i.keys.includes(q)) : all).slice(0, 9);
    sel = Math.min(sel, Math.max(0, current.length - 1));
    hits.innerHTML = current.map((i, n) =>
      `<div class="hit ${n === sel ? 'sel' : ''}" data-n="${n}"><span>${i.label}</span><span class="k">${i.k}</span></div>`).join('')
      || '<div class="hit"><span class="muted">No matches</span></div>';
    hits.querySelectorAll('[data-n]').forEach(h => {
      h.onmouseenter = () => { sel = +h.dataset.n; paint(); };
      h.onclick = () => { const it = current[+h.dataset.n]; if (it) { close(); go(it.go); } };
    });
  };
  input.oninput = () => { sel = 0; paint(); };
  input.onkeydown = e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, current.length - 1); paint(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); paint(); e.preventDefault(); }
    if (e.key === 'Enter' && current[sel]) { close(); go(current[sel].go); }
  };
  paint();
  input.focus();
}
