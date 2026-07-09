// LIQD — shell & hash router

import { S, save, reset } from './state.js';
import { el } from './util.js';
import { renderOnboarding } from './pages/onboarding.js';
import { renderOverview } from './pages/overview.js';
import { renderPortfolio } from './pages/portfolio.js';
import { renderGrowth } from './pages/growth.js';
import { renderRebalance } from './pages/rebalance.js';
import { renderScenario } from './pages/scenario.js';
import { renderAdvantage } from './pages/advantage.js';
import { renderUniverse } from './pages/universe.js';
import { renderIntegrations } from './pages/integrations.js';

const ICONS = {
  overview: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>',
  portfolio: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6.2"/></svg>',
  growth: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 20h18M4 16l5-5 4 3 7-8"/><path d="M16 6h4v4"/></svg>',
  rebalance: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h13M13 3l4 4-4 4M20 17H7M11 13l-4 4 4 4"/></svg>',
  scenario: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>',
  universe: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>',
  integrations: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 7H6a3 3 0 0 0 0 6h3M15 7h3a3 3 0 0 1 0 6h-3M8 10h8"/><path d="M12 13v5a3 3 0 0 0 3 3"/></svg>',
  advantage: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2 3 7v6c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7l-9-5z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
  blueprint: '<svg class="ni" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
};

const ROUTES = [
  { hash: 'overview', label: 'Overview', render: renderOverview, section: 'Workspace', gated: true },
  { hash: 'portfolio', label: 'Portfolio', render: renderPortfolio, gated: true },
  { hash: 'growth', label: 'Growth & Projections', render: renderGrowth, gated: true },
  { hash: 'rebalance', label: 'Rebalancing Studio', render: renderRebalance, gated: true },
  { hash: 'scenario', label: 'Scenario Lab', render: renderScenario, gated: true },
  { hash: 'universe', label: 'Product Universe', render: renderUniverse, section: 'Explore' },
  { hash: 'integrations', label: 'Integrations', render: renderIntegrations },
  { hash: 'advantage', label: 'LIQD Advantage', render: renderAdvantage },
  { hash: 'blueprint', label: 'Edit Blueprint', render: renderOnboarding, section: 'Profile' },
];

const app = document.getElementById('app');

export function go(hash) { location.hash = '#/' + hash; }

function currentRoute() {
  const h = (location.hash || '').replace(/^#\//, '') || (S.onboarded ? 'overview' : 'blueprint');
  return ROUTES.find(r => r.hash === h) || ROUTES[0];
}

function shell(route) {
  app.innerHTML = '';
  const sb = el('aside', 'sidebar');
  sb.appendChild(el('div', 'wordmark', 'LIQD<small>PORTFOLIO INTELLIGENCE</small>'));
  for (const r of ROUTES) {
    if (r.section) sb.appendChild(el('div', 'nav-section', r.section));
    const locked = r.gated && !S.onboarded;
    const b = el('button', 'nav-item' + (r === route ? ' active' : '') + (locked ? ' locked' : ''),
      (ICONS[r.hash] || '') + `<span>${r.label}</span>`);
    b.onclick = () => go(r.hash);
    sb.appendChild(b);
  }
  const foot = el('div', 'foot', `${S.client.name ? S.client.name + ' · ' : ''}${S.investorType.toUpperCase()} tier<br><button class="muted" id="resetBtn" style="text-decoration:underline;font-size:11px;margin-top:4px">Reset demo</button>`);
  sb.appendChild(foot);
  app.appendChild(sb);
  const main = el('main', 'main fade-in');
  app.appendChild(main);
  foot.querySelector('#resetBtn').onclick = () => { if (confirm('Reset all LIQD demo data?')) { reset(); location.hash = ''; render(); } };
  return main;
}

export function render() {
  let route = currentRoute();
  if (route.gated && !S.onboarded) route = ROUTES.find(r => r.hash === 'blueprint');
  const main = shell(route);
  route.render(main);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();
