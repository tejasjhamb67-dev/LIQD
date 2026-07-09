// LIQD — shared utilities

export const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** ₹ formatter in Indian units: ₹1.24 Cr / ₹38.5 L / ₹42,000 */
export function fmtINR(v, { sign = false } = {}) {
  const s = v < 0 ? '−' : (sign && v > 0 ? '+' : '');
  const a = Math.abs(v);
  if (a >= 1e7) return `${s}₹${(a / 1e7).toFixed(a >= 1e9 ? 0 : 2)} Cr`;
  if (a >= 1e5) return `${s}₹${(a / 1e5).toFixed(a >= 1e6 ? 1 : 2)} L`;
  return `${s}₹${inr.format(Math.round(a))}`;
}

export const fmtPct = (v, dp = 1, sign = false) =>
  `${sign && v > 0 ? '+' : ''}${v.toFixed(dp)}%`;

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- shared tooltip ---------- */
let tipNode;
export function tip() {
  if (!tipNode) {
    tipNode = el('div', 'viz-tip');
    document.body.appendChild(tipNode);
  }
  return tipNode;
}
export function showTip(evt, html) {
  const t = tip();
  t.innerHTML = html;
  t.style.opacity = 1;
  const pad = 14;
  const w = t.offsetWidth, h = t.offsetHeight;
  let x = evt.clientX + pad, y = evt.clientY + pad;
  if (x + w > innerWidth - 8) x = evt.clientX - w - pad;
  if (y + h > innerHeight - 8) y = evt.clientY - h - pad;
  t.style.left = x + 'px';
  t.style.top = y + 'px';
}
export function hideTip() { if (tipNode) tipNode.style.opacity = 0; }

export const tipRow = (label, value) => `<div class="tr"><span>${label}</span><b>${value}</b></div>`;

/* ---------- misc ---------- */
export const CLASS_META = {
  eq:  { key: 'eq',  label: 'Equities',      color: 'var(--eq)',  hex: '#3987e5' },
  fi:  { key: 'fi',  label: 'Fixed Income',  color: 'var(--fi)',  hex: '#199e70' },
  alt: { key: 'alt', label: 'Alternatives',  color: 'var(--alt)', hex: '#9085e9' },
  tac: { key: 'tac', label: 'Tactical',      color: 'var(--tac)', hex: '#c98500' },
};
export const CLASS_ORDER = ['eq', 'fi', 'alt', 'tac'];

export const riskDots = n =>
  `<span class="risk-dots">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
