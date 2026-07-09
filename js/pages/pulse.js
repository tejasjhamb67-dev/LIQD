// LIQD — Pulse: trade setups as structured objects, not noise.
// House rule: no thesis + no invalidation = no publish. R:R computed, never typed.

import { S, save } from '../state.js';
import { STOCKS } from '../stocks.js';
import { esc } from '../util.js';

const SEED_POSTS = [
  { user: 'quietcompounder', sym: 'HDFCBANK', dir: 'long', entry: 1685, target: 1950, stop: 1590,
    thesis: 'Merger NIM drag bottoming; deposit growth re-accelerating two quarters straight. Cheapest large private bank on P/B in a decade.',
    invalid: 'Two more quarters of sub-14% deposit growth.', likes: 214, ago: '2h' },
  { user: 'lrs_maxi', sym: 'NVDA', dir: 'long', entry: 138, target: 175, stop: 120,
    thesis: 'Blackwell ramp + inference demand compounding. Hyperscaler capex guides still rising.',
    invalid: 'Any top-3 customer announcing meaningful custom-silicon migration.', likes: 178, ago: '5h' },
  { user: 'meanreversion', sym: 'TITAN', dir: 'short', entry: 3380, target: 2950, stop: 3560,
    thesis: '88x earnings with lab-grown diamond share doubling yearly in the US. Multiple compresses before earnings miss.',
    invalid: 'Festive-quarter jewellery growth above 20% YoY.', likes: 96, ago: '1d' },
  { user: 'bondlady', sym: 'GOLDBEES', dir: 'long', entry: 62, target: 74, stop: 57,
    thesis: 'Central-bank buying + real-rate peak. Gold is the only sleeve that worked in every stagflation.',
    invalid: 'US 10y real yield sustained above 2.5%.', likes: 143, ago: '1d' },
];

export function renderPulse(main) {
  S.pulse = S.pulse || [];
  const posts = [...S.pulse, ...SEED_POSTS];

  const rr = p => {
    const risk = Math.abs(p.entry - p.stop), reward = Math.abs(p.target - p.entry);
    return risk > 0 ? (reward / risk).toFixed(1) : '—';
  };

  main.innerHTML = `
    <div class="page-head">
      <div class="eyebrow">08 · Pulse</div>
      <h1 class="page-title">Setups, not shouting</h1>
      <p class="page-sub">Every post carries entry, stop, thesis and invalidation — or it doesn't publish. R:R is computed, never claimed.</p>
    </div>

    <div class="grid g3">
      <div class="card span2">
        <div class="stack" style="gap:12px" id="feed">
          ${posts.map(p => `
            <div class="post">
              <div class="row between">
                <span class="row" style="gap:8px">
                  <span class="avatar" style="width:28px;height:28px;font-size:11px">${esc(p.user[0].toUpperCase())}</span>
                  <b class="small">${esc(p.user)}</b><span class="muted small">· ${p.ago}</span>
                </span>
                <span class="row" style="gap:8px">
                  <span class="dir ${p.dir}">${p.dir.toUpperCase()}</span>
                  <b>${esc(p.sym)}</b>
                </span>
              </div>
              <div class="row" style="gap:22px;margin:10px 0;flex-wrap:wrap">
                <span class="small"><span class="muted">Entry</span> <b class="tnum">${p.entry}</b></span>
                <span class="small"><span class="muted">Target</span> <b class="tnum" style="color:var(--up)">${p.target}</b></span>
                <span class="small"><span class="muted">Stop</span> <b class="tnum" style="color:var(--down)">${p.stop}</b></span>
                <span class="small"><span class="muted">R:R</span> <span class="rr">${rr(p)}</span></span>
              </div>
              <div class="small dim">${esc(p.thesis)}</div>
              <div class="small" style="margin-top:6px"><span class="muted">Invalidation:</span> <span class="dim">${esc(p.invalid)}</span></div>
              <div class="row" style="gap:16px;margin-top:10px">
                <button class="btn sm ghost">▲ ${p.likes || 0}</button>
                <button class="btn sm ghost">Save</button>
                <span class="muted small" style="margin-left:auto">Not advice · educational setup</span>
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div class="card" style="align-self:start">
        <h3 class="card-title">Post a setup</h3>
        <div class="stack" style="gap:10px">
          <select class="input" id="pSym">${STOCKS.map(s => `<option value="${s.sym}">${s.sym} — ${s.name}</option>`).join('')}</select>
          <div class="row"><button class="chip on" id="pLong">Long</button><button class="chip" id="pShort">Short</button></div>
          <div class="grid g3" style="gap:8px">
            <input class="input" id="pEntry" type="number" placeholder="Entry">
            <input class="input" id="pTarget" type="number" placeholder="Target">
            <input class="input" id="pStop" type="number" placeholder="Stop">
          </div>
          <textarea class="input" id="pThesis" rows="3" placeholder="Thesis — why does this work? (required)"></textarea>
          <textarea class="input" id="pInvalid" rows="2" placeholder="Invalidation — what proves you wrong? (required)"></textarea>
          <div class="row between small"><span class="muted">R:R</span><b class="tnum" id="pRR">—</b></div>
          <button class="btn primary" id="pPost" disabled>Publish</button>
          <span class="small muted">Publishing requires all fields. Your name shows; your record follows you.</span>
        </div>
      </div>
    </div>`;

  let dir = 'long';
  const $ = id => main.querySelector(id);
  const check = () => {
    const e = +$('#pEntry').value, t = +$('#pTarget').value, st = +$('#pStop').value;
    const ok = e > 0 && t > 0 && st > 0 && $('#pThesis').value.trim().length > 20 && $('#pInvalid').value.trim().length > 10
      && (dir === 'long' ? t > e && st < e : t < e && st > e);
    $('#pRR').textContent = e && t && st && Math.abs(e - st) > 0 ? (Math.abs(t - e) / Math.abs(e - st)).toFixed(1) : '—';
    $('#pPost').disabled = !ok;
  };
  ['#pEntry', '#pTarget', '#pStop', '#pThesis', '#pInvalid'].forEach(id => $(id).oninput = check);
  $('#pLong').onclick = () => { dir = 'long'; $('#pLong').classList.add('on'); $('#pShort').classList.remove('on'); check(); };
  $('#pShort').onclick = () => { dir = 'short'; $('#pShort').classList.add('on'); $('#pLong').classList.remove('on'); check(); };
  $('#pPost').onclick = () => {
    S.pulse.unshift({
      user: (S.client.name || 'member').toLowerCase().replace(/\s+/g, '_'), sym: $('#pSym').value, dir,
      entry: +$('#pEntry').value, target: +$('#pTarget').value, stop: +$('#pStop').value,
      thesis: $('#pThesis').value.trim(), invalid: $('#pInvalid').value.trim(), likes: 0, ago: 'now',
    });
    save();
    renderPulse(main);
  };
}
