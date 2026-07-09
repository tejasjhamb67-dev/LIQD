// LIQD — static data: investor tiers, sleeves, product universe, scenarios, integrations

/* ---------------- investor tiers ---------------- */
export const INVESTOR_TYPES = [
  { key: 'henry', label: 'HENRY', glyph: '⚡', min: 1e6,
    desc: 'High Earner, Not Rich Yet · ₹10L–₹1Cr investable · the LIQD core' },
  { key: 'hni', label: 'HNI', glyph: '◆', min: 1e7,
    desc: '₹1Cr–₹25Cr · unlocks PMS, AIF & structured credit' },
  { key: 'uhni', label: 'UHNI', glyph: '❖', min: 25e7,
    desc: '₹25Cr+ · unlisted, pre-IPO, bespoke mandates' },
  { key: 'family', label: 'Family Office', glyph: '⬡', min: 50e7,
    desc: 'Multi-entity, multi-generation · reporting & governance' },
  { key: 'nri', label: 'NRI / Global Indian', glyph: '✈', min: 1e6,
    desc: 'NRE/NRO routing, FEMA-aware universe, GIFT City access' },
];

export const GOALS = [
  { key: 'wealth', label: 'Long-term wealth creation', glyph: '📈', desc: 'Compound aggressively; no fixed liability at the end' },
  { key: 'fire', label: 'Financial independence (FIRE)', glyph: '🔥', desc: 'Build a corpus that replaces salary income' },
  { key: 'home', label: 'Home / large purchase', glyph: '🏠', desc: 'A defined amount on a defined date' },
  { key: 'education', label: "Children's education abroad", glyph: '🎓', desc: 'USD-linked liability — global sleeve matters' },
  { key: 'preserve', label: 'Preserve & beat inflation', glyph: '🛡', desc: 'Protect what exists; grow it quietly' },
  { key: 'legacy', label: 'Legacy / generational transfer', glyph: '🏛', desc: 'Multi-decade horizon, estate-aware structuring' },
];

export const APPETITE = [
  { v: 1, label: 'Ultra conservative', desc: 'Capital safety above all — FD-plus outcomes are fine' },
  { v: 2, label: 'Conservative', desc: 'Mostly stable, a measured slice of growth' },
  { v: 3, label: 'Moderate', desc: 'Balanced growth — comfortable with market cycles' },
  { v: 4, label: 'Growth', desc: 'Equity-heavy; short-term noise is the price of returns' },
  { v: 5, label: 'Aggressive', desc: 'Maximum long-run compounding; volatility is opportunity' },
];

export const TOLERANCE = [
  { v: 1, dd: 5,  label: 'A 5% dip makes me anxious', desc: 'I would consider exiting' },
  { v: 2, dd: 10, label: 'I can sit through −10%', desc: 'Uncomfortable, but I hold' },
  { v: 3, dd: 20, label: '−20% is fine if the plan is intact', desc: 'I hold and review' },
  { v: 4, dd: 30, label: 'I buy more at −30%', desc: 'Drawdowns are entry points' },
  { v: 5, dd: 45, label: 'I can watch −45% without blinking', desc: '2008-grade drawdown tolerance' },
];

export const CONSTRAINTS = [
  { key: 'no_intl', label: 'No international exposure', effect: 'Global sleeve folds into domestic equity' },
  { key: 'liquidity', label: 'Need exit within 12 months', effect: 'Lock-in products (AIF, unlisted, some bonds) excluded' },
  { key: 'no_deriv', label: 'No derivatives / covered calls', effect: 'Tactical sleeve shifts to arbitrage & momentum only' },
  { key: 'esg', label: 'ESG screen', effect: 'Tobacco, thermal coal, gambling excluded from equity sleeves' },
  { key: 'shariah', label: 'Shariah-aligned', effect: 'Interest-bearing debt replaced with gold, REITs & screened equity' },
  { key: 'concentrated', label: 'Hold concentrated ESOP/RSU stock', effect: 'Blueprint hedges single-stock risk; staggered diversification plan' },
  { key: 'no_smallcap', label: 'No small caps / micro caps', effect: 'Equity sleeve capped at large & mid cap' },
  { key: 'tax_sensitive', label: 'Optimise for tax first', effect: 'Prefers growth options, debt via arbitrage, harvesting on' },
];

/* ---------------- sleeves (building blocks of every model) ----------------
   ret/vol are long-run nominal INR assumptions (%, annual). */
export const SLEEVES = {
  eq_large:   { cls: 'eq',  name: 'India Core — Large Cap', ret: 12.0, vol: 16, note: 'Nifty 100 quality tilt, direct/index blend' },
  eq_flexi:   { cls: 'eq',  name: 'India Growth — Flexi & Mid', ret: 13.5, vol: 20, note: 'Active flexi-cap + midcap quality' },
  eq_small:   { cls: 'eq',  name: 'Small Cap Quality', ret: 15.0, vol: 26, note: 'High-conviction small cap, capped weight' },
  eq_intl:    { cls: 'eq',  name: 'Global — US & World (LRS/GIFT)', ret: 11.5, vol: 17, note: 'S&P 500 + global ETFs via LRS or GIFT City FoF' },
  fi_gilt:    { cls: 'fi',  name: 'G-Sec / Gilt Ladder', ret: 7.0, vol: 4, note: 'Sovereign curve, target-maturity' },
  fi_corp:    { cls: 'fi',  name: 'Corporate Bonds AAA/AA', ret: 8.0, vol: 4.5, note: 'Laddered, hold-to-maturity bias' },
  fi_credit:  { cls: 'fi',  name: 'Performing Credit', ret: 10.0, vol: 7, note: 'Private credit / high-yield, gated by tier' },
  fi_arb:     { cls: 'fi',  name: 'Arbitrage & Liquid', ret: 6.5, vol: 1.5, note: 'Equity-taxed parking, T+1 liquidity' },
  alt_reit:   { cls: 'alt', name: 'REITs & InvITs', ret: 10.0, vol: 12, note: 'Listed yield + growth real assets' },
  alt_gold:   { cls: 'alt', name: 'Gold & Silver', ret: 8.0, vol: 14, note: 'ETF/SGB-successor routes, crisis ballast' },
  alt_aif:    { cls: 'alt', name: 'AIF / Late-stage Private', ret: 16.0, vol: 24, note: 'Cat II/III AIF — ₹1Cr min, 3–5yr lock' },
  alt_unlisted:{ cls: 'alt', name: 'Unlisted & Pre-IPO', ret: 18.0, vol: 30, note: 'UHNI/FO only, deep illiquidity premium' },
  tac_momo:   { cls: 'tac', name: 'Momentum Basket', ret: 15.0, vol: 22, note: 'Rules-based factor rotation, monthly rebalance' },
  tac_cc:     { cls: 'tac', name: 'Covered Call Overlay', ret: 11.0, vol: 12, note: 'Income overlay on index holdings' },
  tac_special:{ cls: 'tac', name: 'Special Situations', ret: 14.0, vol: 20, note: 'Buybacks, demergers, event-driven' },
};

/* ---------------- scenarios (shock % per asset class) ---------------- */
export const SCENARIOS = [
  { key: 'gfc', name: '2008 Global Financial Crisis', desc: 'Worst modern drawdown — credit freeze, −52% equities',
    shocks: { eq: -52, fi: 4, alt: -18, tac: -30 }, months: 20 },
  { key: 'covid', name: 'COVID Crash (Mar 2020)', desc: 'Fastest 35% drawdown ever; V-shaped recovery',
    shocks: { eq: -38, fi: 2, alt: -22, tac: -25 }, months: 8 },
  { key: 'taper', name: 'Rate Shock +200bps', desc: 'RBI/Fed shock — duration bleeds, equities de-rate',
    shocks: { eq: -14, fi: -7, alt: -9, tac: -8 }, months: 10 },
  { key: 'inr', name: 'INR Depreciation −12%', desc: 'Currency slide — global sleeve cushions in ₹ terms',
    shocks: { eq: -8, fi: -2, alt: 6, tac: -4 }, months: 6 },
  { key: 'stagflation', name: 'Stagflation (70s replay)', desc: 'High inflation + no growth; real assets outperform',
    shocks: { eq: -25, fi: -10, alt: 14, tac: -6 }, months: 24 },
  { key: 'smallcap', name: 'Small/Mid Cap Unwind', desc: 'SEBI-flagged froth clears — broad market −10%, SMIDs −30%',
    shocks: { eq: -19, fi: 3, alt: -6, tac: -22 }, months: 12 },
  { key: 'war', name: 'Geopolitical Shock', desc: 'Oil +40%, risk-off, gold bid',
    shocks: { eq: -18, fi: 1, alt: 12, tac: -10 }, months: 7 },
  { key: 'melt', name: 'Melt-Up Rally +30%', desc: 'The upside scenario — what you miss by sitting in cash',
    shocks: { eq: 30, fi: 4, alt: 12, tac: 24 }, months: 12 },
];

/* ---------------- integrations ---------------- */
export const INTEGRATIONS = [
  { key: 'zerodha', name: 'Zerodha', kind: 'Broker', api: 'Kite Connect v4', color: '#387ed1', imports: 'Equity & ETF holdings, positions' },
  { key: 'groww', name: 'Groww', kind: 'Broker + MF', api: 'Partner API', color: '#00b386', imports: 'Stocks, direct MF folios' },
  { key: 'upstox', name: 'Upstox', kind: 'Broker', api: 'Upstox API v2', color: '#5a2db6', imports: 'Equity holdings, F&O positions' },
  { key: 'angel', name: 'Angel One', kind: 'Broker', api: 'SmartAPI', color: '#e8590c', imports: 'Equity & commodity holdings' },
  { key: 'dhan', name: 'Dhan', kind: 'Broker', api: 'DhanHQ API', color: '#0f766e', imports: 'Equity, ETF, F&O' },
  { key: 'mfcentral', name: 'MF Central', kind: 'Registrar', api: 'MFC API', color: '#1d4ed8', imports: 'Every MF folio (CAMS + KFin), all AMCs' },
  { key: 'cams', name: 'CAMS + KFintech CAS', kind: 'Registrar', api: 'eCAS parse', color: '#b45309', imports: 'Consolidated MF statement' },
  { key: 'nsdl', name: 'NSDL / CDSL CAS', kind: 'Depository', api: 'CAS parse', color: '#334155', imports: 'Demat holdings across every broker' },
  { key: 'aa', name: 'Account Aggregator', kind: 'Sahamati AA', api: 'FIU–AA rails', color: '#7c3aed', imports: 'Bank, deposits, NPS, insurance — consent-driven' },
  { key: 'vested', name: 'Vested / INDmoney', kind: 'US Investing', api: 'Partner API', color: '#0284c7', imports: 'US stocks & ETFs bought via LRS' },
  { key: 'ibkr', name: 'Interactive Brokers', kind: 'Global Broker', api: 'IBKR Web API', color: '#dc2626', imports: 'Global multi-asset portfolio' },
  { key: 'epfo', name: 'EPFO / NPS', kind: 'Retirement', api: 'AA + passbook', color: '#059669', imports: 'EPF & NPS balances for whole-net-worth view' },
];

/* demo holdings imported when a broker is "connected" */
export const DEMO_IMPORT = {
  zerodha: [
    { name: 'Reliance Industries', qty: 120, value: 372000, cls: 'eq' },
    { name: 'HDFC Bank', qty: 300, value: 495000, cls: 'eq' },
    { name: 'Nifty BeES ETF', qty: 2000, value: 512000, cls: 'eq' },
    { name: 'Tata Motors', qty: 250, value: 198000, cls: 'eq' },
  ],
  groww: [
    { name: 'Parag Parikh Flexi Cap (Direct)', qty: '—', value: 640000, cls: 'eq' },
    { name: 'SBI Small Cap (Regular ⚠ 1.9% TER)', qty: '—', value: 310000, cls: 'eq' },
    { name: 'ICICI Liquid Fund', qty: '—', value: 150000, cls: 'fi' },
  ],
  vested: [
    { name: 'VOO — Vanguard S&P 500', qty: 14, value: 720000, cls: 'eq' },
    { name: 'NVDA', qty: 6, value: 480000, cls: 'eq' },
  ],
};

/* ---------------- product universe ---------------- */
/* tiers: which investor types can access. route: Direct | LRS | GIFT */
const T_ALL = ['henry', 'hni', 'uhni', 'family', 'nri'];
const T_1CR = ['hni', 'uhni', 'family'];
const T_UHNI = ['uhni', 'family'];

export const UNIVERSE = [
  // ---- Equities · India
  { name: 'Nifty 50 Index Fund (Direct)', cat: 'eq', sub: 'Index & ETF', min: 500, liq: 'T+2', risk: 3, ret: '11–13%', tax: 'Equity LTCG 12.5% >₹1.25L', tiers: T_ALL },
  { name: 'Nifty Next 50 Index Fund', cat: 'eq', sub: 'Index & ETF', min: 500, liq: 'T+2', risk: 4, ret: '12–15%', tax: 'Equity LTCG', tiers: T_ALL },
  { name: 'Flexi Cap Active (Direct)', cat: 'eq', sub: 'Active MF', min: 1000, liq: 'T+2', risk: 4, ret: '12–15%', tax: 'Equity LTCG', tiers: T_ALL },
  { name: 'Mid Cap Quality Fund', cat: 'eq', sub: 'Active MF', min: 1000, liq: 'T+2', risk: 4, ret: '13–17%', tax: 'Equity LTCG', tiers: T_ALL },
  { name: 'Small Cap Fund (capped exposure)', cat: 'eq', sub: 'Active MF', min: 1000, liq: 'T+2', risk: 5, ret: '14–19%', tax: 'Equity LTCG', tiers: T_ALL },
  { name: 'Direct Equity — LIQD Quality 25 basket', cat: 'eq', sub: 'Stock Basket', min: 200000, liq: 'T+1', risk: 4, ret: '12–16%', tax: 'Equity LTCG', tiers: T_ALL },
  { name: 'Momentum Factor Basket', cat: 'eq', sub: 'Stock Basket', min: 150000, liq: 'T+1', risk: 5, ret: '14–20%', tax: 'STCG-heavy 20%', tiers: T_ALL },
  { name: 'Low Volatility Factor Fund', cat: 'eq', sub: 'Factor', min: 1000, liq: 'T+2', risk: 3, ret: '11–13%', tax: 'Equity LTCG', tiers: T_ALL },
  { name: 'ELSS Tax Saver (80C)', cat: 'eq', sub: 'Tax-linked', min: 500, liq: '3yr lock', risk: 4, ret: '12–15%', tax: '80C + Equity LTCG', tiers: T_ALL },
  { name: 'Equity PMS — Concentrated 15-stock', cat: 'eq', sub: 'PMS', min: 5e6, liq: '15–30 days', risk: 5, ret: '14–20%', tax: 'Pass-through as stocks', tiers: T_1CR },
  // ---- Equities · Global
  { name: 'S&P 500 ETF (via LRS)', cat: 'eq', sub: 'Global — LRS', min: 85000, liq: 'T+2 (US)', risk: 3, ret: '10–12% USD', tax: 'Debt-rate slab, TCS 20% >₹10L', tiers: T_ALL, route: 'LRS' },
  { name: 'Nasdaq 100 ETF (via LRS)', cat: 'eq', sub: 'Global — LRS', min: 85000, liq: 'T+2 (US)', risk: 4, ret: '11–15% USD', tax: 'Slab + TCS', tiers: T_ALL, route: 'LRS' },
  { name: 'US Direct Stocks (fractional)', cat: 'eq', sub: 'Global — LRS', min: 10000, liq: 'T+2 (US)', risk: 5, ret: 'Stock-specific', tax: 'Slab + US estate rules', tiers: T_ALL, route: 'LRS' },
  { name: 'Global FoF — GIFT City (no LRS cap)', cat: 'eq', sub: 'Global — GIFT', min: 500000, liq: 'T+3', risk: 4, ret: '10–13% USD', tax: 'Fund-level efficiency', tiers: T_1CR.concat('nri'), route: 'GIFT' },
  { name: 'International FoF (domestic wrapper)', cat: 'eq', sub: 'Global — FoF', min: 1000, liq: 'T+3', risk: 4, ret: '10–13%', tax: 'Slab (debt-rate)', tiers: T_ALL },
  { name: 'China / EM ex-India FoF', cat: 'eq', sub: 'Global — FoF', min: 1000, liq: 'T+3', risk: 5, ret: '8–14%', tax: 'Slab', tiers: T_ALL },
  // ---- Fixed income
  { name: 'G-Sec 10yr (RBI Retail Direct)', cat: 'fi', sub: 'Sovereign', min: 10000, liq: 'Tradeable', risk: 1, ret: '6.8–7.2%', tax: 'Slab on coupon', tiers: T_ALL },
  { name: 'T-Bills 91/182/364 day', cat: 'fi', sub: 'Sovereign', min: 10000, liq: 'Hold to maturity', risk: 1, ret: '6.5–7%', tax: 'Slab', tiers: T_ALL },
  { name: 'Target Maturity Fund 2030 (Gilt+SDL)', cat: 'fi', sub: 'TMF', min: 1000, liq: 'T+1', risk: 1, ret: '7–7.5%', tax: 'Slab', tiers: T_ALL },
  { name: 'Corporate Bond Fund AAA', cat: 'fi', sub: 'Corporate', min: 1000, liq: 'T+1', risk: 2, ret: '7.5–8.2%', tax: 'Slab', tiers: T_ALL },
  { name: 'Listed NCDs — AA curated', cat: 'fi', sub: 'Corporate', min: 10000, liq: 'Exchange (thin)', risk: 3, ret: '9–11%', tax: 'Slab', tiers: T_ALL },
  { name: 'Arbitrage Fund (equity-taxed parking)', cat: 'fi', sub: 'Arbitrage', min: 1000, liq: 'T+1', risk: 1, ret: '6.5–7.5%', tax: 'Equity LTCG ✦ tax hack', tiers: T_ALL },
  { name: 'Liquid / Overnight Fund', cat: 'fi', sub: 'Cash', min: 1000, liq: 'T+0/T+1', risk: 1, ret: '6–6.8%', tax: 'Slab', tiers: T_ALL },
  { name: 'Performing Credit AIF (Cat II)', cat: 'fi', sub: 'Private Credit', min: 1e7, liq: '3–4yr lock', risk: 4, ret: '11–14%', tax: 'Pass-through', tiers: T_1CR },
  { name: 'Sovereign Gold-linked (SGB secondary)', cat: 'fi', sub: 'Quasi-sovereign', min: 8000, liq: 'Exchange', risk: 2, ret: 'Gold + 2.5%', tax: 'CGT-free at maturity', tiers: T_ALL },
  { name: 'Bank FD ladder (sweep)', cat: 'fi', sub: 'Deposits', min: 10000, liq: 'Breakable', risk: 1, ret: '6.5–7.5%', tax: 'Slab + TDS', tiers: T_ALL },
  { name: 'Fixed Income PMS — bond ladder', cat: 'fi', sub: 'PMS', min: 5e6, liq: '30 days', risk: 2, ret: '8–9.5%', tax: 'Pass-through', tiers: T_1CR },
  // ---- Alternatives
  { name: 'Embassy / Mindspace REITs', cat: 'alt', sub: 'REIT', min: 300, liq: 'T+1', risk: 3, ret: '9–12% (6% yield)', tax: 'Mixed distribution', tiers: T_ALL },
  { name: 'PowerGrid / IRB InvITs', cat: 'alt', sub: 'InvIT', min: 10000, liq: 'T+1', risk: 3, ret: '10–12%', tax: 'Mixed', tiers: T_ALL },
  { name: 'Gold ETF', cat: 'alt', sub: 'Metals', min: 100, liq: 'T+1', risk: 3, ret: '7–9%', tax: 'LTCG 12.5% >2yr', tiers: T_ALL },
  { name: 'Silver ETF', cat: 'alt', sub: 'Metals', min: 100, liq: 'T+1', risk: 4, ret: '7–11%', tax: 'LTCG 12.5% >2yr', tiers: T_ALL },
  { name: 'Multi-Asset Allocation Fund', cat: 'alt', sub: 'Multi-asset', min: 1000, liq: 'T+2', risk: 3, ret: '10–12%', tax: 'Wrapper-dependent', tiers: T_ALL },
  { name: 'Cat III Long-Short AIF', cat: 'alt', sub: 'AIF', min: 1e7, liq: 'Monthly NAV', risk: 4, ret: '12–16%', tax: 'Fund-level', tiers: T_1CR },
  { name: 'Cat II Late-Stage PE AIF', cat: 'alt', sub: 'AIF', min: 1e7, liq: '4–6yr lock', risk: 5, ret: '15–20%', tax: 'Pass-through', tiers: T_1CR },
  { name: 'Venture Debt Fund', cat: 'alt', sub: 'AIF', min: 1e7, liq: '3yr lock', risk: 4, ret: '12–15%', tax: 'Pass-through', tiers: T_1CR },
  { name: 'Unlisted Shares — Pre-IPO (NSE, Tata Cap…)', cat: 'alt', sub: 'Unlisted', min: 25e5, liq: 'Illiquid', risk: 5, ret: '15–25%', tax: 'LTCG 12.5% >2yr', tiers: T_UHNI },
  { name: 'Fractional CRE (SM-REIT)', cat: 'alt', sub: 'Real Estate', min: 1e6, liq: 'Platform exit', risk: 4, ret: '13–17% IRR', tax: 'Rental + CG', tiers: T_1CR.concat('henry') },
  { name: 'P2P / Invoice Discounting (capped 5%)', cat: 'alt', sub: 'Yield-alt', min: 50000, liq: '30–90d', risk: 4, ret: '10–13%', tax: 'Slab', tiers: T_ALL },
  // ---- Tactical
  { name: 'LIQD Momentum Rotation', cat: 'tac', sub: 'Factor rotation', min: 100000, liq: 'T+1', risk: 5, ret: '14–20%', tax: 'STCG-heavy', tiers: T_ALL },
  { name: 'Covered Call Income Overlay', cat: 'tac', sub: 'Options overlay', min: 500000, liq: 'Monthly cycle', risk: 3, ret: '10–13%', tax: 'F&O business income', tiers: T_ALL },
  { name: 'Special Situations basket (buybacks, demergers)', cat: 'tac', sub: 'Event-driven', min: 200000, liq: 'T+1', risk: 4, ret: '12–18%', tax: 'Mixed', tiers: T_ALL },
  { name: 'Dynamic Asset Allocation (BAF)', cat: 'tac', sub: 'Balanced Advantage', min: 1000, liq: 'T+2', risk: 3, ret: '10–12%', tax: 'Equity-taxed', tiers: T_ALL },
  { name: 'Structured Product — Nifty-linked debenture', cat: 'tac', sub: 'Structured', min: 1e7, liq: '3yr', risk: 3, ret: 'Capped 14–18%', tax: 'Slab at maturity', tiers: T_1CR },
];

export const UNIVERSE_CATS = [
  { key: 'eq', label: 'Equities' },
  { key: 'fi', label: 'Fixed Income' },
  { key: 'alt', label: 'Alternatives' },
  { key: 'tac', label: 'Tactical' },
];
