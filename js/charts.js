// LIQD — hand-rolled SVG chart kit.
// Specs: 2px lines, hairline grid, 4px rounded data-ends, 2px surface gaps,
// text in ink tokens (never series color), hover tooltips on every plot.

import { el, showTip, hideTip, tipRow, fmtINR } from './util.js';

const INK2 = '#b9b8ae', INK3 = '#83827c', GRID = '#26262a', BASE = '#35353b', SURF = '#16161a';
const FONT = 'font-family:inherit';

/* ================= donut ================= */
export function donut(container, segments, { size = 190, thick = 22, centerLabel = '', centerValue = '' } = {}) {
  const r = (size - thick) / 2, cx = size / 2, cy = size / 2;
  const tot = segments.reduce((s, x) => s + x.value, 0) || 1;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.filter(s => s.value > 0).map(s => {
    const frac = s.value / tot;
    const dash = Math.max(frac * C - 2.5, 0.5); // 2.5px surface gap between segments
    const off = C * 0.25 - acc * C;
    acc += frac;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thick}"
      stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${off}" data-i="${s.label}" data-v="${s.value}"
      style="cursor:pointer;transition:opacity .15s"/>`;
  }).join('');
  container.innerHTML = `<svg viewBox="0 0 ${size} ${size}" style="max-width:${size}px;margin:0 auto">
    ${arcs}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#f4f3ee" style="${FONT};font-size:21px;font-weight:720">${centerValue}</text>
    <text x="${cx}" y="${cy + 15}" text-anchor="middle" fill="${INK3}" style="${FONT};font-size:10.5px;letter-spacing:.08em">${centerLabel}</text>
  </svg>`;
  container.querySelectorAll('circle').forEach(c => {
    c.addEventListener('mousemove', e => {
      container.querySelectorAll('circle').forEach(o => o.style.opacity = o === c ? 1 : 0.35);
      showTip(e, `<div class="tt">${c.dataset.i}</div>${tipRow('Weight', (+c.dataset.v).toFixed(1) + '%')}`);
    });
    c.addEventListener('mouseleave', () => {
      container.querySelectorAll('circle').forEach(o => o.style.opacity = 1);
      hideTip();
    });
  });
}

/* ================= fan chart (projection bands) ================= */
// rows: [{t, p10,p25,p50,p75,p90}]
export function fanChart(container, rows, { h = 300, goal = null, fmtY = fmtINR } = {}) {
  const w = 720, padL = 66, padR = 18, padT = 16, padB = 30;
  const iw = w - padL - padR, ih = h - padT - padB;
  const maxV = Math.max(...rows.map(r => r.p90), goal || 0) * 1.05;
  const minV = 0;
  const X = t => padL + iw * (t / rows[rows.length - 1].t);
  const Y = v => padT + ih * (1 - (v - minV) / (maxV - minV));

  const line = key => rows.map((r, i) => `${i ? 'L' : 'M'}${X(r.t).toFixed(1)},${Y(r[key]).toFixed(1)}`).join('');
  const band = (lo, hi) => line(hi) + rows.slice().reverse().map(r => `L${X(r.t).toFixed(1)},${Y(r[lo]).toFixed(1)}`).join('') + 'Z';

  // clean y ticks
  const ticks = 4, tickVals = Array.from({ length: ticks + 1 }, (_, i) => minV + (maxV - minV) * i / ticks);
  const gridH = tickVals.map(v => `<line x1="${padL}" x2="${w - padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="${GRID}" stroke-width="1"/>
    <text x="${padL - 8}" y="${Y(v) + 4}" text-anchor="end" fill="${INK3}" style="${FONT};font-size:10.5px" class="tnum">${fmtY(v)}</text>`).join('');
  const xTicks = rows.filter((r, i) => i % Math.ceil(rows.length / 8) === 0 || i === rows.length - 1)
    .map(r => `<text x="${X(r.t)}" y="${h - 8}" text-anchor="middle" fill="${INK3}" style="${FONT};font-size:10.5px">${r.t ? 'Y' + r.t : 'Now'}</text>`).join('');

  const goalLine = goal ? `<line x1="${padL}" x2="${w - padR}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="#c98500" stroke-width="1.5" stroke-dasharray="5 4"/>
    <text x="${w - padR}" y="${Y(goal) - 6}" text-anchor="end" fill="${INK2}" style="${FONT};font-size:11px;font-weight:600">Goal ${fmtY(goal)}</text>` : '';

  const endV = rows[rows.length - 1];
  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}">
    ${gridH}
    <path d="${band('p10', 'p90')}" fill="#3987e5" opacity="0.10"/>
    <path d="${band('p25', 'p75')}" fill="#3987e5" opacity="0.16"/>
    <path d="${line('p50')}" fill="none" stroke="#3987e5" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(endV.t)}" cy="${Y(endV.p50)}" r="4.5" fill="#3987e5" stroke="${SURF}" stroke-width="2"/>
    <text x="${X(endV.t) - 8}" y="${Y(endV.p50) - 10}" text-anchor="end" fill="#f4f3ee" style="${FONT};font-size:12.5px;font-weight:650">${fmtY(endV.p50)}</text>
    ${goalLine}
    <line x1="${padL}" x2="${w - padR}" y1="${padT + ih}" y2="${padT + ih}" stroke="${BASE}" stroke-width="1"/>
    ${xTicks}
    <line class="xh" x1="0" x2="0" y1="${padT}" y2="${padT + ih}" stroke="#f4f3ee" stroke-width="1" opacity="0"/>
    <rect x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent" class="hit"/>
  </svg>`;

  const svg = container.querySelector('svg'), xh = svg.querySelector('.xh'), hit = svg.querySelector('.hit');
  hit.addEventListener('mousemove', e => {
    const box = svg.getBoundingClientRect();
    const fx = (e.clientX - box.left) / box.width * w;
    const t = Math.round((fx - padL) / iw * rows[rows.length - 1].t);
    const r = rows[Math.max(0, Math.min(rows.length - 1, t))];
    xh.setAttribute('x1', X(r.t)); xh.setAttribute('x2', X(r.t)); xh.setAttribute('opacity', 0.25);
    showTip(e, `<div class="tt">Year ${r.t}</div>
      ${tipRow('Optimistic (P90)', fmtY(r.p90))}${tipRow('Median (P50)', fmtY(r.p50))}${tipRow('Stress (P10)', fmtY(r.p10))}`);
  });
  hit.addEventListener('mouseleave', () => { xh.setAttribute('opacity', 0); hideTip(); });
}

/* ================= horizontal bars (scenarios, comparisons) ================= */
// items: [{label, value, color, note}], values may be ±. fmt formats value.
export function barsH(container, items, { fmt = v => v.toFixed(1) + '%', max = null } = {}) {
  const w = 720, rowH = 44, padL = 210, padR = 90;
  const h = items.length * rowH + 8;
  const m = max || Math.max(...items.map(i => Math.abs(i.value)), 1);
  const zeroX = items.some(i => i.value < 0) && items.some(i => i.value > 0)
    ? padL + (w - padL - padR) / 2
    : (items.every(i => i.value <= 0) ? w - padR : padL);
  const scale = items.some(i => i.value < 0) && items.some(i => i.value > 0)
    ? (w - padL - padR) / 2 / m : (w - padL - padR) / m;

  const bars = items.map((it, i) => {
    const y = i * rowH + 10, bh = 22;
    const len = Math.abs(it.value) * scale;
    const x = it.value < 0 ? zeroX - len : zeroX;
    const rEnd = 4;
    // rounded on the data end only
    const path = it.value < 0
      ? `M${zeroX},${y} h${-(len - rEnd)} a${rEnd},${rEnd} 0 0 0 -${rEnd},${rEnd} v${bh - 2 * rEnd} a${rEnd},${rEnd} 0 0 0 ${rEnd},${rEnd} h${len - rEnd} Z`
      : `M${zeroX},${y} h${len - rEnd} a${rEnd},${rEnd} 0 0 1 ${rEnd},${rEnd} v${bh - 2 * rEnd} a${rEnd},${rEnd} 0 0 1 -${rEnd},${rEnd} h${-(len - rEnd)} Z`;
    const valX = it.value < 0 ? x - 8 : x + len + 8;
    const anchor = it.value < 0 ? 'end' : 'start';
    return `<g class="bar" data-i="${i}" style="cursor:pointer">
      <text x="${padL - 14}" y="${y + bh / 2 + 4}" text-anchor="end" fill="${INK2}" style="${FONT};font-size:12.5px;font-weight:550">${it.label}</text>
      <path d="${path}" fill="${it.color}"/>
      <text x="${valX}" y="${y + bh / 2 + 4}" text-anchor="${anchor}" fill="#f4f3ee" style="${FONT};font-size:12.5px;font-weight:650" class="tnum">${fmt(it.value)}</text>
    </g>`;
  }).join('');

  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}">
    <line x1="${zeroX}" x2="${zeroX}" y1="4" y2="${h - 4}" stroke="${BASE}" stroke-width="1"/>
    ${bars}
  </svg>`;
  container.querySelectorAll('.bar').forEach(g => {
    const it = items[+g.dataset.i];
    g.addEventListener('mousemove', e => showTip(e, `<div class="tt">${it.label}</div>${tipRow('Impact', fmt(it.value))}${it.note ? tipRow('', it.note) : ''}`));
    g.addEventListener('mouseleave', hideTip);
  });
}

/* ================= multi-line chart (fee paths etc.) ================= */
// series: [{label, color, values:[...]}], labels: x labels
export function lines(container, series, labels, { h = 300, fmtY = fmtINR } = {}) {
  const w = 720, padL = 66, padR = 130, padT = 14, padB = 30;
  const iw = w - padL - padR, ih = h - padT - padB;
  const maxV = Math.max(...series.flatMap(s => s.values)) * 1.04;
  const X = i => padL + iw * (i / (labels.length - 1));
  const Y = v => padT + ih * (1 - v / maxV);
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = maxV * i / ticks;
    return `<line x1="${padL}" x2="${w - padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="${GRID}"/>
      <text x="${padL - 8}" y="${Y(v) + 4}" text-anchor="end" fill="${INK3}" style="${FONT};font-size:10.5px">${fmtY(v)}</text>`;
  }).join('');
  // end labels: skip any that would collide with one already placed (legend carries identity)
  const placed = [];
  const paths = series.map(s => {
    const endY = Y(s.values[s.values.length - 1]);
    const collide = placed.some(y => Math.abs(y - endY) < 15);
    if (!collide) placed.push(endY);
    return `<path d="${s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('')}"
      fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${X(s.values.length - 1)}" cy="${endY}" r="4" fill="${s.color}" stroke="${SURF}" stroke-width="2"/>
    ${collide ? '' : `<text x="${X(s.values.length - 1) + 10}" y="${endY + 4}" fill="${INK2}" style="${FONT};font-size:11.5px;font-weight:600">${s.label}</text>`}`;
  }).join('');
  const xt = labels.map((l, i) => i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1
    ? `<text x="${X(i)}" y="${h - 8}" text-anchor="middle" fill="${INK3}" style="${FONT};font-size:10.5px">${l}</text>` : '').join('');
  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}">${grid}${paths}
    <line x1="${padL}" x2="${w - padR}" y1="${padT + ih}" y2="${padT + ih}" stroke="${BASE}"/>
    <line class="xh" y1="${padT}" y2="${padT + ih}" stroke="#f4f3ee" opacity="0"/>
    <rect class="hit" x="${padL}" y="${padT}" width="${iw}" height="${ih}" fill="transparent"/></svg>`;
  const svg = container.querySelector('svg'), xh = svg.querySelector('.xh');
  svg.querySelector('.hit').addEventListener('mousemove', e => {
    const box = svg.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left) / box.width * w - padL) / iw * (labels.length - 1));
    const ci = Math.max(0, Math.min(labels.length - 1, i));
    xh.setAttribute('x1', X(ci)); xh.setAttribute('x2', X(ci)); xh.setAttribute('opacity', 0.25);
    showTip(e, `<div class="tt">${labels[ci]}</div>` + series.map(s => tipRow(s.label, fmtY(s.values[ci]))).join(''));
  });
  svg.querySelector('.hit').addEventListener('mouseleave', () => { xh.setAttribute('opacity', 0); hideTip(); });
}

/* ================= sparkline ================= */
export function sparkline(container, values, { w = 120, h = 34, color = '#4dd6c1' } = {}) {
  const min = Math.min(...values), max = Math.max(...values);
  const X = i => 2 + (w - 4) * i / (values.length - 1);
  const Y = v => 3 + (h - 6) * (1 - (v - min) / ((max - min) || 1));
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  container.innerHTML = `<svg viewBox="0 0 ${w} ${h}" style="max-width:${w}px">
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${X(values.length - 1)}" cy="${Y(values[values.length - 1])}" r="3.4" fill="${color}" stroke="${SURF}" stroke-width="2"/>
  </svg>`;
}

/* ================= allocation strip (stacked 100% bar) ================= */
export function allocStrip(container, segs) {
  container.innerHTML = `<div class="alloc-bar">${segs.filter(s => s.value > 0)
    .map(s => `<i style="width:${s.value}%;background:${s.color}" title="${s.label} ${s.value}%"></i>`).join('')}</div>`;
}

/* ================= meter ================= */
export function meter(container, pct, { color = '#4dd6c1', track = 'rgba(77,214,193,0.15)' } = {}) {
  container.innerHTML = `<div style="height:8px;border-radius:6px;background:${track};overflow:hidden">
    <div style="height:100%;width:${Math.min(100, Math.max(0, pct))}%;background:${color};border-radius:6px;transition:width .4s"></div></div>`;
}
