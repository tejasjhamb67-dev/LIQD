// LIQD — Credit: spend profile → optimal card stack + borrowing math.
// Advice-first: flat disclosed referrals only, never rewards-washing.

import { S } from '../state.js';
import { fmtINR } from '../util.js';
import { barsH } from '../charts.js';

// effective reward % by category, annual fee, waiver spend, lounge, notes
const CARDS = [
  { key: 'infinia', name: 'HDFC Infinia', fee: 12500, waiver: 1000000, base: 3.3, dining: 16.5, travel: 16.5, online: 3.3, fuel: 3.3, minIncome: '₹3L+/mo', tag: 'Invite-only apex' },
  { key: 'atlas', name: 'Axis Atlas', fee: 5000, waiver: 0, base: 2.0, dining: 2.0, travel: 10.0, online: 2.0, fuel: 0, minIncome: '₹1L+/mo', tag: 'Travel engine' },
  { key: 'magnus', name: 'Axis Magnus (Burgundy)', fee: 30000, waiver: 3000000, base: 4.8, dining: 4.8, travel: 12.0, online: 4.8, fuel: 0, minIncome: '₹2.5L+/mo', tag: 'Transfer-partner play' },
  { key: 'sbicp', name: 'SBI Cashback', fee: 999, waiver: 200000, base: 1.0, dining: 5.0, travel: 1.0, online: 5.0, fuel: 1.0, minIncome: '₹40k+/mo', tag: 'Online workhorse' },
  { key: 'amazonici', name: 'Amazon Pay ICICI', fee: 0, waiver: 0, base: 1.0, dining: 2.0, travel: 1.0, online: 5.0, fuel: 1.0, minIncome: '₹30k+/mo', tag: 'Zero-fee floor' },
  { key: 'hdfcbizblack', name: 'HDFC Biz Black', fee: 10000, waiver: 750000, base: 3.3, dining: 3.3, travel: 8.0, online: 5.0, fuel: 3.3, minIncome: 'Self-employed', tag: 'For founders/consultants' },
  { key: 'idfcmayura', name: 'IDFC Mayura', fee: 5999, waiver: 800000, base: 2.4, dining: 2.4, travel: 2.4, online: 2.4, fuel: 2.4, minIncome: '₹1L+/mo', tag: 'Flat-rate simplicity' },
];

const CATS = [
  ['online', 'Online & shopping'],
  ['dining', 'Dining & food delivery'],
  ['travel', 'Travel & hotels'],
  ['fuel', 'Fuel & commute'],
  ['base', 'Everything else'],
];

export function renderCredit(main) {
  const spend = S.spend || { online: 40000, dining: 20000, travel: 25000, fuel: 8000, base: 40000 };

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">06 · Credit</div>
      <h1 class="page-title">Card stack optimiser</h1>
      <p class="page-sub">Your spend → the 2-card combination that pays you most, net of fees. Flat disclosed referrals; the math never bends.</p>
    </div>

    <div class="grid g3">
      <div class="card">
        <h3 class="card-title">Monthly spend</h3>
        <div id="spendRows"></div>
        <div class="divider"></div>
        <div class="row between small"><span class="dim">Total</span><b class="tnum" id="spendTotal"></b></div>
      </div>
      <div class="card span2">
        <h3 class="card-title">Net annual reward — every card, your spend</h3>
        <div class="chart-box" id="cardBars"></div>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3 class="card-title">Recommended stack</h3>
      <div class="grid g2" id="stack"></div>
      <div class="divider"></div>
      <div class="kv" style="grid-template-columns:auto 1fr;gap:8px 18px">
        <span class="muted small">Utilisation</span><span class="small dim">Keep statement utilisation under 30% of limit — it is 30% of your credit score. Ask for limit increases yearly; never close your oldest card.</span>
        <span class="muted small">Fee logic</span><span class="small dim">A fee is a hurdle, not a status symbol — pay it only when the reward delta clears it (shown above, net of fee).</span>
        <span class="muted small">The trap</span><span class="small dim">Revolving at 42% APR erases years of rewards. If you ever carry a balance, the right product is a loan against your MF portfolio at ~10%, not the card.</span>
      </div>
    </div>

    <div class="card" style="margin-top:16px">
      <h3 class="card-title">Borrowing, ranked — ₹10L for 12 months</h3>
      <div class="chart-box" id="loanBars"></div>
    </div>`;

  // spend inputs
  const sr = main.querySelector('#spendRows');
  sr.innerHTML = CATS.map(([k, label]) => `
    <div style="padding:8px 0">
      <div class="row between small"><span class="dim">${label}</span><b class="tnum" id="sv-${k}">${fmtINR(spend[k])}</b></div>
      <input type="range" min="0" max="150000" step="2500" value="${spend[k]}" data-k="${k}" style="margin-top:6px">
    </div>`).join('');

  const paint = () => {
    const total = CATS.reduce((s, [k]) => s + spend[k], 0);
    main.querySelector('#spendTotal').textContent = fmtINR(total) + '/mo';

    const scored = CARDS.map(c => {
      const annual = CATS.reduce((s, [k]) => s + spend[k] * 12 * (c[k] / 100), 0);
      const feeWaived = c.waiver > 0 && total * 12 >= c.waiver;
      const net = annual - (feeWaived ? 0 : c.fee);
      return { ...c, annual, net, feeWaived };
    }).sort((a, b) => b.net - a.net);

    barsH(main.querySelector('#cardBars'), scored.map(c => ({
      label: c.name, value: Math.round(c.net / 100) / 10,
      color: c.net === scored[0].net ? '#0d6a5c' : c.net > 0 ? '#2a78d6' : '#e34948',
      note: `rewards ${fmtINR(c.annual)} − fee ${c.feeWaived ? '₹0 (waived)' : fmtINR(c.fee)}`,
    })), { fmt: v => '₹' + v.toFixed(1) + 'k/yr' });

    // stack: best overall + best complement (max marginal gain per category)
    const best = scored[0];
    const complement = scored.slice(1).map(c => {
      const gain = CATS.reduce((s, [k]) => s + Math.max(0, (c[k] - best[k])) * spend[k] * 12 / 100, 0);
      return { ...c, gain: gain - (c.feeWaived ? 0 : c.fee) };
    }).sort((a, b) => b.gain - a.gain)[0];

    main.querySelector('#stack').innerHTML = [
      [best, 'PRIMARY', `${fmtINR(best.net)}/yr net`, 'Default card for every category'],
      [complement, 'COMPLEMENT', `+${fmtINR(Math.max(0, complement.gain))}/yr marginal`, 'Use only where it beats the primary'],
    ].map(([c, role, val, use]) => `
      <div class="card" style="box-shadow:none;background:var(--surface-2)">
        <div class="row between"><span class="eyebrow" style="color:var(--ink-3)">${role}</span><span class="badge">${c.tag}</span></div>
        <div style="font-size:17px;font-weight:700;margin:6px 0 2px">${c.name}</div>
        <div class="small muted">${c.minIncome} · fee ${c.fee ? fmtINR(c.fee) + (c.feeWaived ? ' (waived at your spend)' : '') : 'nil'}</div>
        <div class="divider" style="margin:10px 0"></div>
        <div class="row between small"><span class="dim">${use}</span><b class="tnum" style="color:var(--up)">${val}</b></div>
      </div>`).join('');

    // borrowing ranked
    barsH(main.querySelector('#loanBars'), [
      { label: 'Loan against MF/shares', value: 10.2, color: '#0d6a5c', note: 'No exit from portfolio, no LTCG event' },
      { label: 'Home-loan top-up', value: 9.4, color: '#1baf7a', note: 'If you already have one — cheapest rupee' },
      { label: 'Breaking an FD', value: 7.0, color: '#2a78d6', note: 'Cost = lost interest + penalty; fine for small gaps' },
      { label: 'Personal loan', value: 13.5, color: '#b97f00', note: 'Fast, expensive; last planned resort' },
      { label: 'Credit-card revolve', value: 42.0, color: '#e34948', note: 'Never. This is the wealth destroyer' },
    ], { fmt: v => v.toFixed(1) + '% APR' });

    S.spend = spend;
  };

  sr.querySelectorAll('input[type=range]').forEach(r => r.oninput = e => {
    spend[e.target.dataset.k] = +e.target.value;
    main.querySelector('#sv-' + e.target.dataset.k).textContent = fmtINR(spend[e.target.dataset.k]);
    paint();
  });
  paint();
}
