// LIQD — Integrations: broker/registrar/AA connections with mock import flow

import { S, save } from '../state.js';
import { INTEGRATIONS, DEMO_IMPORT } from '../data.js';
import { el, esc, fmtINR } from '../util.js';

export function renderIntegrations(main) {
  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Integrations</div>
      <h1 class="page-title">Bring your whole financial life in</h1>
      <p class="page-sub">Link everything. LIQD nets, de-duplicates and monitors it against your policy.</p>
    </div>
    <div class="int-grid" id="grid"></div>
    <div id="imported" style="margin-top:22px"></div>
    <div class="card" style="margin-top:18px">
      <h3 class="card-title">How LIQD connects (v1 API map)</h3>
      <div class="grid g2 small dim" style="gap:10px">
        <div>· <b style="color:var(--ink-1)">Brokers</b> — Kite Connect, SmartAPI, Upstox v2, DhanHQ: OAuth token → holdings & positions endpoint → normalised to LIQD asset classes.</div>
        <div>· <b style="color:var(--ink-1)">Mutual funds</b> — MF Central API + CAMS/KFin eCAS parse: every folio across all AMCs, direct-vs-regular flagged with TER drag.</div>
        <div>· <b style="color:var(--ink-1)">Account Aggregator</b> — Sahamati AA rails (consent-driven): bank balances, deposits, NPS, insurance for a whole-net-worth view.</div>
        <div>· <b style="color:var(--ink-1)">Global</b> — Vested/INDmoney partner APIs & IBKR Web API: USD holdings mapped into the global sleeve with LRS usage tracking.</div>
      </div>
    </div>`;

  const grid = main.querySelector('#grid');
  for (const it of INTEGRATIONS) {
    const connected = S.connections.includes(it.key);
    const card = el('div', 'int-card' + (connected ? ' connected' : ''), `
      <div class="row between">
        <div class="logo" style="background:${it.color}">${esc(it.name.slice(0, 2).toUpperCase())}</div>
        ${connected ? '<span class="row small" style="gap:7px;color:var(--good)"><span class="pulse"></span>Live</span>' : ''}
      </div>
      <div><b>${esc(it.name)}</b><div class="small muted">${it.kind} · ${it.api}</div></div>
      <div class="small dim">${it.imports}</div>
      <button class="btn sm ${connected ? 'ghost' : ''}" data-k="${it.key}">${connected ? 'Disconnect' : 'Connect'}</button>`);
    card.querySelector('button').onclick = e => toggle(it, e.target, main);
    grid.appendChild(card);
  }
  paintImports(main);
}

function toggle(it, btn, main) {
  const i = S.connections.indexOf(it.key);
  if (i >= 0) { S.connections.splice(i, 1); save(); rerender(main); return; }
  btn.textContent = 'Authorising…'; btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Syncing holdings…';
    setTimeout(() => { S.connections.push(it.key); save(); rerender(main); }, 700);
  }, 700);
}

function rerender(main) { renderIntegrations(main); }

function paintImports(main) {
  const box = main.querySelector('#imported');
  const held = S.connections.filter(k => DEMO_IMPORT[k]);
  if (!held.length) {
    box.innerHTML = S.connections.length
      ? `<div class="card small dim">Connected. Demo holdings are available for Zerodha, Groww and Vested — connect one of those to see the import analysis.</div>` : '';
    return;
  }
  const rows = held.flatMap(k => DEMO_IMPORT[k].map(h => ({ ...h, src: k })));
  const total = rows.reduce((s, r) => s + r.value, 0);
  const regular = rows.filter(r => r.name.includes('Regular'));
  box.innerHTML = `<div class="card">
    <div class="row between"><h3 class="card-title">Imported external holdings</h3>
      <span class="badge brand">${fmtINR(total)} discovered outside LIQD</span></div>
    <table class="tbl"><thead><tr><th>Holding</th><th>Source</th><th class="num">Qty</th><th class="num">Value</th></tr></thead>
    <tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td class="small" style="text-transform:capitalize">${r.src}</td>
      <td class="num">${r.qty}</td><td class="num">${fmtINR(r.value)}</td></tr>`).join('')}</tbody></table>
    <div class="divider"></div>
    <div class="stack small dim" style="gap:8px">
      <div>· <b style="color:var(--ink-1)">Blueprint drift:</b> these holdings are ~${Math.round(rows.filter(r => r.cls === 'eq').reduce((s, r) => s + r.value, 0) / total * 100)}% equity — the engine counts them toward your equity sleeve and adjusts fresh deployments accordingly.</div>
      ${regular.length ? `<div>· <b style="color:var(--warn)">Fee leak found:</b> ${regular.map(r => esc(r.name.split(' (')[0])).join(', ')} is a regular plan — switching to direct saves ~${fmtINR(regular.reduce((s, r) => s + r.value, 0) * 0.011)}/yr in trail commission.</div>` : ''}
      <div>· <b style="color:var(--ink-1)">Overlap check:</b> index ETFs and large-cap funds overlap your India Core sleeve — LIQD nets exposure instead of double-counting.</div>
    </div></div>`;
}
