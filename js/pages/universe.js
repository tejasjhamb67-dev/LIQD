// LIQD — Product Universe: the full filterable catalogue

import { S } from '../state.js';
import { UNIVERSE, UNIVERSE_CATS, INVESTOR_TYPES } from '../data.js';
import { el, esc, fmtINR, riskDots, CLASS_META } from '../util.js';

export function renderUniverse(main) {
  let cat = 'all', onlyMine = true, q = '';

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">Product Universe</div>
      <h1 class="page-title">${UNIVERSE.length} instruments. One filter: does it earn its place?</h1>
      <p class="page-sub">Everything the LIQD engine can allocate to — Indian and global, listed and private — each tagged with minimum ticket, liquidity, risk grade and who can buy it.</p>
    </div>

    <div class="row" style="gap:12px;flex-wrap:wrap">
      <input class="input" id="uq" placeholder="Search — 'REIT', 'S&P', 'AIF', 'gilt'…" style="max-width:320px">
      <label class="chip" id="mineChip">Eligible for my tier (${S.investorType.toUpperCase()})</label>
    </div>
    <div class="facets" id="cats"></div>
    <div class="row between small muted" style="margin-bottom:12px"><span id="count"></span>
      <span>Route badges: <b class="dim">LRS</b> = Liberalised Remittance · <b class="dim">GIFT</b> = GIFT City IFSC</span></div>
    <div class="prod-grid" id="grid"></div>`;

  const cats = main.querySelector('#cats');
  const catBtns = [{ key: 'all', label: 'All classes' }, ...UNIVERSE_CATS].map(c => {
    const b = el('button', 'chip' + (cat === c.key ? ' on' : ''), c.label);
    b.onclick = () => { cat = c.key; catBtns.forEach(x => x.classList.remove('on')); b.classList.add('on'); paint(); };
    cats.appendChild(b);
    return b;
  });

  const mineChip = main.querySelector('#mineChip');
  mineChip.classList.toggle('on', onlyMine);
  mineChip.onclick = () => { onlyMine = !onlyMine; mineChip.classList.toggle('on', onlyMine); paint(); };
  main.querySelector('#uq').oninput = e => { q = e.target.value.toLowerCase(); paint(); };

  function paint() {
    const items = UNIVERSE.filter(p =>
      (cat === 'all' || p.cat === cat) &&
      (!onlyMine || p.tiers.includes(S.investorType)) &&
      (!q || (p.name + ' ' + p.sub).toLowerCase().includes(q)));
    main.querySelector('#count').textContent = `${items.length} of ${UNIVERSE.length} instruments`;
    main.querySelector('#grid').innerHTML = items.map(p => {
      const locked = !p.tiers.includes(S.investorType);
      return `<div class="prod" style="${locked ? 'opacity:.55' : ''}">
        <div class="row between"><span class="nm">${esc(p.name)}</span>${riskDots(p.risk)}</div>
        <div class="meta">
          <span class="badge" style="color:${CLASS_META[p.cat].hex};border-color:${CLASS_META[p.cat].hex}33">${CLASS_META[p.cat].label}</span>
          <span class="badge">${p.sub}</span>
          ${p.route ? `<span class="badge brand">${p.route}</span>` : ''}
          ${locked ? `<span class="badge" style="color:var(--warn)">Unlocks at ${p.tiers.map(t => (INVESTOR_TYPES.find(x => x.key === t) || {}).label).filter(Boolean)[0]}</span>` : ''}
        </div>
        <div class="foot"><span>Min ${fmtINR(p.min)}</span><span>${p.liq}</span><span>${p.ret}</span></div>
        <div class="small muted">Tax: ${p.tax}</div>
      </div>`;
    }).join('') || '<p class="muted">Nothing matches — clear a filter.</p>';
  }
  paint();
}
