// LIQD — buffer interludes: short cinematic pauses between steps while the
// engine works. Honest theater — every label names a computation that really
// runs. Respects prefers-reduced-motion and collapses under test automation.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.webdriver;

const INK = '#1a2420', ACCENT = '#0d6a5c', BLUE = '#2a78d6', GRID = '#e8eae4';
const CLASS_HEX = ['#2a78d6', '#1baf7a', '#4a3aa7', '#eda100'];

/** play('tape'|'ring'|'stack', { title, subs[], ms }) → resolves when done */
export function buffer(kind, { title, subs = [], ms = 1400 } = {}) {
  if (reduced()) return new Promise(r => setTimeout(r, 30));
  return new Promise(resolve => {
    const ov = document.createElement('div');
    ov.className = 'buffer-overlay';
    ov.innerHTML = `
      <canvas width="340" height="170"></canvas>
      <div style="text-align:center">
        <div class="buffer-label">${title}</div>
        <div class="buffer-sub"></div>
      </div>
      <div class="buffer-track"><i></i></div>`;
    document.body.appendChild(ov);
    const cv = ov.querySelector('canvas'), ctx = cv.getContext('2d');
    const subEl = ov.querySelector('.buffer-sub'), bar = ov.querySelector('.buffer-track i');
    const t0 = performance.now();
    let raf;
    const DRAW = { tape, ring, stack }[kind] || tape;
    const seed = { v: 12345 };

    function frame(now) {
      const p = Math.min(1, (now - t0) / ms);
      ctx.clearRect(0, 0, cv.width, cv.height);
      DRAW(ctx, cv, p, seed);
      bar.style.width = (p * 100).toFixed(0) + '%';
      if (subs.length) subEl.textContent = subs[Math.min(subs.length - 1, Math.floor(p * subs.length))];
      if (p < 1) raf = requestAnimationFrame(frame);
      else {
        ov.style.transition = 'opacity .22s'; ov.style.opacity = 0;
        setTimeout(() => { ov.remove(); resolve(); }, 220);
      }
    }
    raf = requestAnimationFrame(frame);
    ov.onclick = () => { cancelAnimationFrame(raf); ov.remove(); resolve(); }; // tap to skip
  });
}

/* deterministic-ish jitter */
function rnd(seed) { seed.v = (seed.v * 1103515245 + 12345) & 0x7fffffff; return seed.v / 0x7fffffff; }

/* ---- a price tape drawing itself upward, glowing end dot ---- */
function tape(ctx, cv, p, seed) {
  const W = cv.width, H = cv.height, pad = 14;
  ctx.strokeStyle = GRID; ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(pad, H / 4 * i); ctx.lineTo(W - pad, H / 4 * i); ctx.stroke(); }
  const n = 90, upto = Math.max(2, Math.floor(n * p));
  seed.v = 424242;
  let y = H * 0.78;
  ctx.beginPath(); ctx.moveTo(pad, y);
  let lx = pad, ly = y;
  for (let i = 1; i < upto; i++) {
    const x = pad + (W - 2 * pad) * i / n;
    y += (rnd(seed) - 0.62) * 9;                      // drift up, wobble real
    y = Math.max(H * 0.12, Math.min(H * 0.88, y));
    ctx.lineTo(x, y); lx = x; ly = y;
  }
  ctx.strokeStyle = BLUE; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  // wash under the line
  ctx.lineTo(lx, H - pad); ctx.lineTo(pad, H - pad); ctx.closePath();
  ctx.fillStyle = 'rgba(42,120,214,0.08)'; ctx.fill();
  ctx.beginPath(); ctx.arc(lx, ly, 5, 0, 7); ctx.fillStyle = BLUE; ctx.fill();
  ctx.beginPath(); ctx.arc(lx, ly, 9, 0, 7); ctx.strokeStyle = 'rgba(42,120,214,0.35)'; ctx.stroke();
}

/* ---- allocation ring assembling segment by segment ---- */
function ring(ctx, cv, p) {
  const cx = cv.width / 2, cy = cv.height / 2, r = 58;
  const segs = [0.5, 0.26, 0.16, 0.08];               // eq/fi/alt/tac sweep
  let a0 = -Math.PI / 2;
  const total = p * Math.PI * 2;
  let drawn = 0;
  ctx.lineWidth = 16; ctx.lineCap = 'butt';
  for (let i = 0; i < segs.length; i++) {
    const span = segs[i] * Math.PI * 2;
    const take = Math.max(0, Math.min(span, total - drawn));
    if (take > 0.01) {
      ctx.beginPath(); ctx.strokeStyle = CLASS_HEX[i];
      ctx.arc(cx, cy, r, a0 + 0.02, a0 + take - 0.02); ctx.stroke();
    }
    a0 += span; drawn += span;
  }
  ctx.fillStyle = INK; ctx.font = '700 20px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(Math.round(p * 100) + '%', cx, cy + 2);
  ctx.fillStyle = '#8b948e'; ctx.font = '600 9px system-ui';
  ctx.fillText('CONSTRUCTED', cx, cy + 17);
}

/* ---- wealth counter with rising bars ---- */
function stack(ctx, cv, p, seed) {
  const W = cv.width, H = cv.height, n = 12, pad = 18;
  seed.v = 777;
  const bw = (W - 2 * pad) / n - 6;
  for (let i = 0; i < n; i++) {
    const target = 0.25 + 0.65 * (i / n) + rnd(seed) * 0.1;
    const h = Math.min(1, p * 1.4 - i * 0.03) * target;
    if (h <= 0) continue;
    const x = pad + i * ((W - 2 * pad) / n), bh = h * (H - 50);
    ctx.fillStyle = i === n - 1 && p > 0.9 ? ACCENT : 'rgba(13,106,92,' + (0.25 + 0.5 * i / n) + ')';
    ctx.beginPath();
    ctx.roundRect(x, H - 24 - bh, bw, bh, [3, 3, 0, 0]);
    ctx.fill();
  }
  const amt = Math.round(p * p * 100) / 10;
  ctx.fillStyle = INK; ctx.font = '700 22px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('₹' + amt.toFixed(1) + ' Cr', W / 2, 26);
}
