// LIQD — Learn: mentoring ladder. Tracks → lessons → quiz gates. XP, streaks.

import { S, save } from '../state.js';
import { el } from '../util.js';
import { meter } from '../charts.js';

const TRACKS = [
  { key: 'found', name: 'Foundations', desc: 'Money mechanics before market mechanics', lessons: [
    { t: 'Compounding is violent, late', q: 'At 12%, money doubles roughly every…', opts: ['6 years', '12 years', '3 years'], a: 0, x: 'Rule of 72: 72 ÷ 12 = 6. The second double earns more than the first ten years.' },
    { t: 'Inflation is the silent short', q: '₹1 Cr at 5% inflation buys, in 20 years, about…', opts: ['₹75L worth', '₹38L worth', '₹90L worth'], a: 1, x: '1.05²⁰ ≈ 2.65× prices. Cash is a slowly losing position.' },
    { t: 'Emergency floor first', q: 'The right size for an emergency fund is…', opts: ['1 month of spend', '6 months of spend', 'As big as possible'], a: 1, x: '6 months in liquid instruments. More is a drag; less forces fire-sales.' },
    { t: 'Insurance is not investment', q: 'A ULIP mixing insurance + investment usually…', opts: ['Optimises both', 'Underperforms both', 'Is tax-free, so wins'], a: 1, x: 'Buy term insurance + invest the difference. Bundles hide fees.' },
  ]},
  { key: 'markets', name: 'Markets', desc: 'What moves prices and what only seems to', lessons: [
    { t: 'Volatility ≠ risk', q: 'For a 20-year horizon, the bigger risk is…', opts: ['A 30% crash next year', 'Earning 4% for 20 years', 'Daily price swings'], a: 1, x: 'Shortfall is the real risk. Volatility is the fee for equity returns.' },
    { t: 'The P/E tells you the mood', q: 'A stock at 90x earnings mostly prices in…', opts: ['Its past', 'Flawless future execution', 'Its dividend'], a: 1, x: 'High multiples are prepaid expectations. You earn only what exceeds them.' },
    { t: 'Drawdowns are scheduled', q: 'Historically, Indian equity falls 10%+ …', opts: ['Once a decade', 'Most years', 'Only in crises'], a: 1, x: 'Intra-year drawdowns are normal service, not a malfunction.' },
    { t: 'Currency is a position', q: 'Holding only INR assets means you are…', opts: ['Neutral', 'Short the dollar', 'Hedged'], a: 1, x: 'Income, home and portfolio all long India = concentrated. A USD sleeve diversifies it.' },
  ]},
  { key: 'craft', name: 'Portfolio Craft', desc: 'Construction, rebalancing, and the discipline layer', lessons: [
    { t: 'Allocation is 90% of the game', q: 'The main driver of long-run portfolio variance is…', opts: ['Stock selection', 'Asset allocation', 'Market timing'], a: 1, x: 'Brinson et al: policy mix dominates. Pick the mix before the names.' },
    { t: 'Rebalancing is a transfer', q: 'Band rebalancing systematically…', opts: ['Buys low, sells high', 'Increases risk', 'Times the market'], a: 0, x: 'It moves money from what ran up to what lagged — mechanically contrarian.' },
    { t: 'Correlation is the free lunch', q: 'Adding a 0.1-correlated asset to equity mostly…', opts: ['Lowers return', 'Lowers portfolio volatility', 'Adds tax'], a: 1, x: 'Portfolio vol < weighted average vol when assets don\'t move together.' },
    { t: 'Sequence risk peaks late', q: 'A 40% crash hurts most when it happens…', opts: ['In year 1 of investing', 'The year before withdrawals', 'It\'s always equal'], a: 1, x: 'Late crashes hit the largest corpus — the case for a glide path.' },
  ]},
  { key: 'tax', name: 'Tax & Structure', desc: 'Keep what you earn', lessons: [
    { t: 'LTCG has a free lane', q: 'Equity LTCG is exempt each year up to…', opts: ['₹1.25L', '₹10L', 'Nothing is exempt'], a: 0, x: 'Harvest gains up to the exemption annually — reset cost basis for free.' },
    { t: 'Direct vs regular', q: 'A regular MF plan differs from direct by…', opts: ['Better managers', '~1%/yr trail commission', 'Lock-in'], a: 1, x: 'Same fund, ~1% skimmed yearly. On ₹50L over 15 years that is ~₹12L.' },
    { t: 'LRS basics', q: 'The LRS limit per person per financial year is…', opts: ['$250,000', '$25,000', 'Unlimited with TCS'], a: 0, x: '$250k/FY. TCS 20% above ₹10L — adjustable against your tax liability.' },
    { t: 'Arbitrage funds hack', q: 'Arbitrage funds are useful because they are…', opts: ['High return', 'Equity-taxed cash parking', 'Risk-free'], a: 1, x: 'Cash-like risk, equity taxation — the tax-efficient bridge for rebalances.' },
  ]},
];

function prog() {
  S.learn = S.learn || { done: {}, xp: 0 };
  if (S.learn.streak == null) { S.learn.streak = 0; S.learn.lastDay = null; }
  return S.learn;
}

// one lesson a day keeps the streak alive; a missed day resets it
function bumpStreak(L) {
  const today = new Date().toISOString().slice(0, 10);
  if (L.lastDay === today) return;
  const yday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  L.streak = L.lastDay === yday ? (L.streak || 0) + 1 : 1;
  L.lastDay = today;
}

export function renderLearn(main) {
  const L = prog();
  const totalLessons = TRACKS.reduce((s, t) => s + t.lessons.length, 0);
  const doneCount = Object.keys(L.done).length;
  const level = 1 + Math.floor(L.xp / 100);

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">05 · Learn</div>
      <h1 class="page-title">The mentoring ladder</h1>
      <p class="page-sub">3-minute lessons, quiz gates, no fluff. Finish a track, unlock the tools it teaches.</p>
    </div>
    <div class="grid g3" style="margin-bottom:16px">
      <div class="card stat"><div class="label">Level</div><div class="value tnum">${level}</div><div class="delta dim">${L.xp} XP · ${L.streak || 0}-day streak</div><div class="xpm" style="margin-top:8px"></div></div>
      <div class="card stat"><div class="label">Lessons complete</div><div class="value tnum">${doneCount} / ${totalLessons}</div><div class="delta dim">${TRACKS.filter(t => t.lessons.every((_, i) => L.done[t.key + i])).length} tracks mastered</div></div>
      <div class="card stat"><div class="label">Why it matters</div><div class="value" style="font-size:15px;font-weight:550;line-height:1.4">Investors who understand drawdowns hold through them. Behaviour is the last alpha.</div></div>
    </div>
    <div class="grid g2" id="tracks"></div>
    <div id="quizHost"></div>`;

  meter(main.querySelector('.xpm'), L.xp % 100);

  const tracksEl = main.querySelector('#tracks');
  for (const tr of TRACKS) {
    const doneIn = tr.lessons.filter((_, i) => L.done[tr.key + i]).length;
    const card = el('div', 'card');
    card.innerHTML = `
      <div class="row between"><h3 class="card-title" style="margin:0">${tr.name}</h3>
        <span class="badge ${doneIn === tr.lessons.length ? 'brand' : ''}">${doneIn}/${tr.lessons.length}</span></div>
      <p class="small muted" style="margin:6px 0 4px">${tr.desc}</p>
      ${tr.lessons.map((ls, i) => {
        const done = !!L.done[tr.key + i];
        const next = !done && tr.lessons.findIndex((_, j) => !L.done[tr.key + j]) === i;
        return `<div class="lesson ${done ? 'done' : next ? 'next' : ''}">
          <span class="dot">${done ? '✓' : i + 1}</span>
          <span style="flex:1"><b style="font-size:13.5px;font-weight:${done ? 500 : 640}">${ls.t}</b></span>
          <button class="btn sm ${next ? '' : 'ghost'}" data-t="${tr.key}" data-i="${i}" ${!done && !next ? 'disabled' : ''}>${done ? 'Review' : next ? 'Start' : 'Locked'}</button>
        </div>`;
      }).join('')}`;
    tracksEl.appendChild(card);
  }

  main.querySelectorAll('[data-t]').forEach(b => b.onclick = () => quiz(main, b.dataset.t, +b.dataset.i));
}

function quiz(main, tkey, i) {
  const tr = TRACKS.find(t => t.key === tkey);
  const ls = tr.lessons[i];
  const host = main.querySelector('#quizHost');
  host.innerHTML = `<div class="sheet-bg"><div class="sheet">
    <div class="row between"><span class="eyebrow">${tr.name} · Lesson ${i + 1}</span><button class="btn sm ghost" id="qClose">✕</button></div>
    <h2 style="font-size:20px;font-weight:700;margin:14px 0 10px">${ls.t}</h2>
    <p class="dim" style="font-size:14px">${ls.x}</p>
    <div class="divider"></div>
    <p style="font-weight:640;font-size:14.5px">${ls.q}</p>
    <div id="qOpts">${ls.opts.map((o, j) => `<button class="quiz-opt" data-j="${j}">${o}</button>`).join('')}</div>
    <div id="qResult" style="margin-top:14px"></div>
  </div></div>`;
  host.querySelector('#qClose').onclick = () => host.innerHTML = '';
  host.querySelector('.sheet-bg').onclick = e => { if (e.target.classList.contains('sheet-bg')) host.innerHTML = ''; };
  host.querySelectorAll('.quiz-opt').forEach(btn => btn.onclick = () => {
    const j = +btn.dataset.j;
    host.querySelectorAll('.quiz-opt').forEach(x => x.disabled = true);
    if (j === ls.a) {
      btn.classList.add('right');
      const L = prog();
      if (!L.done[tkey + i]) { L.done[tkey + i] = 1; L.xp += 25; bumpStreak(L); save(); }
      host.querySelector('#qResult').innerHTML = `<span class="badge brand">+25 XP</span> <button class="btn sm primary" id="qNext" style="margin-left:10px">Continue</button>`;
      host.querySelector('#qNext').onclick = () => { host.innerHTML = ''; renderLearn(main); };
    } else {
      btn.classList.add('wrong');
      host.querySelector(`[data-j="${ls.a}"]`).classList.add('right');
      host.querySelector('#qResult').innerHTML = `<button class="btn sm" id="qRetry">Got it — retry</button>`;
      host.querySelector('#qRetry').onclick = () => quiz(main, tkey, i);
    }
  });
}
