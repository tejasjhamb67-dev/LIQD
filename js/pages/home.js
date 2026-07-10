// LIQD — Home: the front door. Sell in one screen, capture intent, hand off to the Blueprint.

import { S, save } from '../state.js';
import { STOCKS, priceSeries } from '../stocks.js';
import { sparkline } from '../charts.js';
import { go } from '../app.js';

const PRODUCTS = [
  ['01', 'Wealth', 'Institution-grade portfolio engine'],
  ['02', 'Terminal', 'Every security, one screen'],
  ['03', 'Screen', 'Factor discovery machines'],
  ['04', 'Strategies', 'Rules-based playbooks'],
  ['05', 'Learn', 'The mentoring ladder'],
  ['06', 'Credit', 'Card stack + borrowing math'],
  ['07', 'Circles', 'Ten wallets, one asset'],
  ['08', 'Pulse', 'Setups, not shouting'],
  ['09', 'Assets', 'REITs to pre-IPO, tagged honestly'],
  ['10', 'Advisory', 'Humans for what engines can\'t'],
];

export function renderHome(main) {
  main.innerHTML = `
    <div style="max-width:860px;margin:0 auto;padding-top:4vh">
      <div class="eyebrow">LIQD · FOR HENRYs → FAMILY OFFICES</div>
      <div class="ob-hero" style="font-size:42px;margin-top:10px">The operating system<br>for your <em>net worth.</em></div>
      <p class="page-sub" style="font-size:15px;max-width:520px;margin-top:10px">Ten products. One flat fee. Zero commissions. The engine BlackRock sells to institutions, priced like a subscription.</p>
      <div class="row" style="gap:12px;margin-top:26px">
        <button class="btn primary" id="ctaStart" style="padding:13px 26px;font-size:15px">Build my blueprint · 90 seconds</button>
        <button class="btn ghost" id="ctaDemo">Explore the Terminal →</button>
      </div>

      <div class="row" style="gap:10px;margin:34px 0 0;flex-wrap:wrap" id="tape"></div>

      <div class="grid g2" style="margin-top:40px;gap:10px">
        ${PRODUCTS.map(([n, t, d]) => `
          <div class="row" style="padding:11px 14px;border:1px solid var(--line);border-radius:9px;background:var(--surface-1)">
            <span class="eyebrow" style="color:var(--ink-3);min-width:26px">${n}</span>
            <b style="font-size:13.5px;min-width:88px">${t}</b>
            <span class="small muted">${d}</span>
          </div>`).join('')}
      </div>

      <div class="grid g3" style="margin-top:36px">
        ${[['HENRY', '₹9,000', '₹10L–₹1Cr investable'], ['HNI', '₹36,000', '₹1Cr–₹25Cr · human reviews'], ['UHNI / FO', '₹1,00,000+', '₹25Cr+ · mandate desk']]
          .map(([t, p, d]) => `<div class="card" style="text-align:center">
            <div class="eyebrow" style="color:var(--ink-3)">${t}</div>
            <div style="font-size:26px;font-weight:720;margin:4px 0">${p}<span class="small muted" style="font-weight:500">/yr</span></div>
            <div class="small muted">${d}</div></div>`).join('')}
      </div>
      <p class="small muted" style="text-align:center;margin-top:10px">Flat fee. Not a percentage of you. Direct plans only — no product ever pays LIQD.</p>

      <div class="card pad-lg" style="margin-top:36px;text-align:center">
        <h3 class="card-title" style="margin-bottom:6px">Founding membership</h3>
        <p class="small muted" style="margin-bottom:16px">First 500 members lock the HENRY price for life.</p>
        <div class="row" style="gap:10px;max-width:480px;margin:0 auto;flex-wrap:wrap" id="wlForm">
          <input class="input" id="wlEmail" type="email" placeholder="you@work.com" style="flex:1;min-width:220px">
          <select class="input" id="wlTier" style="width:120px"><option value="henry">HENRY</option><option value="hni">HNI</option><option value="uhni">UHNI/FO</option></select>
          <button class="btn primary" id="wlJoin">Join</button>
        </div>
        <div class="small" id="wlMsg" style="margin-top:10px"></div>
      </div>

      <p class="small muted" style="margin:30px 0 10px;text-align:center">
        LIQD is a research and portfolio-tooling platform. Not SEBI-registered investment advice; all figures are model assumptions.
        <button class="muted" id="toLegal" style="text-decoration:underline">Terms, privacy & disclosures</button>
      </p>
    </div>`;

  // live-ish market tape (deterministic sparklines; real quotes when API is up)
  const tape = main.querySelector('#tape');
  for (const s of STOCKS.filter(x => ['RELIANCE', 'HDFCBANK', 'NVDA', 'GOLDBEES', 'VOO'].includes(x.sym))) {
    const t = document.createElement('span');
    t.className = 'live-tile';
    t.innerHTML = `<b>${s.sym}</b><span class="spark" style="width:70px"></span>
      <span class="tnum small" style="color:${s.ret1y >= 0 ? 'var(--up)' : 'var(--down)'}">${s.ret1y >= 0 ? '+' : ''}${s.ret1y}%</span>`;
    t.onclick = () => go('stock/' + s.sym);
    tape.appendChild(t);
    sparkline(t.querySelector('.spark'), priceSeries(s).filter((_, i) => i % 10 === 0), { w: 70, h: 22, color: s.ret1y >= 0 ? '#0e7a3d' : '#c43a39' });
  }

  main.querySelector('#ctaStart').onclick = () => go('blueprint');
  main.querySelector('#ctaDemo').onclick = () => go('terminal');
  main.querySelector('#toLegal').onclick = () => go('legal');
  main.querySelector('#wlJoin').onclick = async () => {
    const email = main.querySelector('#wlEmail').value.trim();
    const msg = main.querySelector('#wlMsg');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Enter a valid email.'; msg.style.color = 'var(--critical)'; return; }
    msg.textContent = 'Joining…'; msg.style.color = 'var(--ink-3)';
    let ok = false;
    try {
      const r = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, tier: main.querySelector('#wlTier').value }) });
      ok = r.ok;
    } catch { /* fall through to local */ }
    if (!ok) { S.waitlist = email; save(); }   // queued locally until KV is connected
    msg.textContent = ok ? 'You\'re in. We\'ll write when doors open.' : 'Queued on this device — connects when live.';
    msg.style.color = 'var(--up)';
    main.querySelector('#wlForm').style.opacity = 0.5;
    main.querySelector('#wlJoin').disabled = true;
  };
}

export function renderLegal(main) {
  main.innerHTML = `
    <div style="max-width:720px;margin:0 auto">
      <div class="eyebrow">Legal</div>
      <h1 class="page-title">Terms, privacy & disclosures</h1>
      <div class="card" style="margin-top:16px">
        <div class="stack small dim" style="gap:12px">
          <div><b style="color:var(--ink-1)">What LIQD is.</b> A research, education and portfolio-tooling platform. Every number on this platform is a model output from stated assumptions — visible in Blueprint · Construction — not a prediction or a promise.</div>
          <div><b style="color:var(--ink-1)">What LIQD is not (yet).</b> LIQD is not a SEBI-registered Investment Adviser, Research Analyst, broker, or portfolio manager. Nothing here is personalised investment advice. Regulated advice, execution and pooled investment structures launch only after the corresponding registrations and escrow/trustee arrangements are in place.</div>
          <div><b style="color:var(--ink-1)">Risk.</b> Markets fall. Modelled stress cases understate real tails. Past and simulated performance do not predict future results. You alone are responsible for your decisions.</div>
          <div><b style="color:var(--ink-1)">Conflicts.</b> LIQD charges a flat subscription and accepts no commissions, trails or distribution fees from any product shown. Card recommendations may carry flat, disclosed referral fees that never alter rankings.</div>
          <div><b style="color:var(--ink-1)">Privacy.</b> Your blueprint lives in your browser and, if sync is enabled, in encrypted key-value storage keyed to your device. We collect the waitlist email you give us and nothing else. No trackers, no ad pixels, no data sales.</div>
          <div><b style="color:var(--ink-1)">Market data.</b> Quotes and history are delayed and provided for information only, via third-party sources; accuracy is not guaranteed.</div>
          <div><b style="color:var(--ink-1)">Contact.</b> hello@liqd.club (placeholder — set before launch).</div>
        </div>
      </div>
      <button class="btn sm ghost" id="back" style="margin-top:14px">← Back</button>
    </div>`;
  main.querySelector('#back').onclick = () => history.back();
}
