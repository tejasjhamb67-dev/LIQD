// LIQD — shell & hash router (suite of 10 products, one engine)

import { S, save, reset } from './state.js';
import { el } from './util.js';
import { renderOnboarding } from './pages/onboarding.js';
import { renderOverview } from './pages/overview.js';
import { renderPortfolio } from './pages/portfolio.js';
import { renderGrowth } from './pages/growth.js';
import { renderRebalance } from './pages/rebalance.js';
import { renderRisk } from './pages/risk.js';
import { renderIPS } from './pages/ips.js';
import { renderTerminal, renderStock } from './pages/terminal.js';
import { renderScreen } from './pages/screen.js';
import { renderStrategies } from './pages/strategies.js';
import { renderLearn } from './pages/learn.js';
import { renderCredit } from './pages/credit.js';
import { renderCircles } from './pages/circles.js';
import { renderPulse } from './pages/pulse.js';
import { renderUniverse } from './pages/universe.js';
import { renderIntegrations } from './pages/integrations.js';
import { renderAdvantage } from './pages/advantage.js';

const I = (d) => `<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${d}</svg>`;
const ICONS = {
  overview: I('<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'),
  portfolio: I('<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6.2"/>'),
  growth: I('<path d="M3 20h18M4 16l5-5 4 3 7-8"/><path d="M16 6h4v4"/>'),
  rebalance: I('<path d="M4 7h13M13 3l4 4-4 4M20 17H7M11 13l-4 4 4 4"/>'),
  risk: I('<path d="M12 3 3 8v5c0 5 3.8 7.4 9 8 5.2-.6 9-3 9-8V8l-9-5z"/><path d="M12 8v5M12 16.5v.5"/>'),
  ips: I('<path d="M7 3h8l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v4h4M9 12h6M9 16h6"/>'),
  terminal: I('<rect x="3" y="4" width="18" height="14" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>'),
  screen: I('<path d="M4 5h16M7 12h10M10 19h4"/>'),
  strategies: I('<path d="M4 19V5M4 19h16"/><path d="m7 14 3-6 4 3 4-7"/>'),
  learn: I('<path d="m12 3 10 5-10 5L2 8l10-5z"/><path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5"/>'),
  credit: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'),
  circles: I('<circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="10" r="2.6"/><path d="M3.5 19c.6-3 2.9-4.7 5.5-4.7s4.9 1.7 5.5 4.7M14.5 19c.4-1.9 1.6-3.2 3.2-3.7"/>'),
  pulse: I('<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>'),
  universe: I('<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/>'),
  integrations: I('<path d="M9 7H6a3 3 0 0 0 0 6h3M15 7h3a3 3 0 0 1 0 6h-3M8 10h8"/>'),
  advantage: I('<path d="M12 2 3 7v6c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7l-9-5z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
  blueprint: I('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),
};

const ROUTES = [
  { hash: 'overview', label: 'Overview', render: renderOverview, section: '01 · Wealth', gated: true },
  { hash: 'portfolio', label: 'Portfolio', render: renderPortfolio, gated: true },
  { hash: 'growth', label: 'Growth', render: renderGrowth, gated: true },
  { hash: 'rebalance', label: 'Studio', render: renderRebalance, gated: true },
  { hash: 'risk', label: 'Risk Matrix', render: renderRisk, gated: true },
  { hash: 'ips', label: 'Policy (IPS)', render: renderIPS, gated: true },
  { hash: 'terminal', label: 'Terminal', render: renderTerminal, section: '02–03 · Intelligence' },
  { hash: 'screen', label: 'Screen', render: renderScreen },
  { hash: 'universe', label: 'Universe & Assets', render: renderUniverse },
  { hash: 'strategies', label: 'Strategies', render: renderStrategies, section: '04–05 · Craft' },
  { hash: 'learn', label: 'Learn', render: renderLearn },
  { hash: 'credit', label: 'Credit', render: renderCredit, section: '06–08 · Money & Members' },
  { hash: 'circles', label: 'Circles', render: renderCircles },
  { hash: 'pulse', label: 'Pulse', render: renderPulse },
  { hash: 'integrations', label: 'Integrations', render: renderIntegrations, section: 'Membership' },
  { hash: 'advantage', label: 'Why LIQD', render: renderAdvantage },
  { hash: 'blueprint', label: 'Blueprint', render: renderOnboarding },
  { hash: 'stock', render: renderStock, hidden: true },   // #/stock/SYM
];

const app = document.getElementById('app');

export function go(hash) { location.hash = '#/' + hash; }

function parseHash() {
  const raw = (location.hash || '').replace(/^#\//, '');
  const [head, ...rest] = raw.split('/');
  return { head: head || (S.onboarded ? 'overview' : 'blueprint'), param: rest.join('/') };
}

function shell(route) {
  app.innerHTML = '';
  const sb = el('aside', 'sidebar');
  sb.appendChild(el('div', 'wordmark', 'LIQD<small>ONE MEMBERSHIP · TEN PRODUCTS</small>'));
  for (const r of ROUTES) {
    if (r.hidden) continue;
    if (r.section) sb.appendChild(el('div', 'nav-section', r.section));
    const locked = r.gated && !S.onboarded;
    const b = el('button', 'nav-item' + (r === route ? ' active' : '') + (locked ? ' locked' : ''),
      (ICONS[r.hash] || '') + `<span>${r.label}</span>`);
    b.onclick = () => go(r.hash);
    sb.appendChild(b);
  }
  const foot = el('div', 'foot', `${S.client.name ? S.client.name + ' · ' : ''}${S.investorType.toUpperCase()}<br><button class="muted" id="resetBtn" style="text-decoration:underline;font-size:11px;margin-top:4px">Reset demo</button>`);
  sb.appendChild(foot);
  app.appendChild(sb);
  const main = el('main', 'main fade-in');
  app.appendChild(main);
  foot.querySelector('#resetBtn').onclick = () => { if (confirm('Reset all LIQD demo data?')) { reset(); location.hash = ''; render(); } };
  return main;
}

export function render() {
  const { head, param } = parseHash();
  let route = ROUTES.find(r => r.hash === head) || ROUTES[0];
  if (route.gated && !S.onboarded) route = ROUTES.find(r => r.hash === 'blueprint');
  const navRoute = route.hidden ? ROUTES.find(r => r.hash === 'terminal') : route;
  const main = shell(navRoute);
  route.render(main, param);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
