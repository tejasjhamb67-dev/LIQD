// LIQD — security master (demo dataset; live feed lands in P4).
// Every number is static reference data; price series are generated
// deterministically from ret1y/vol so all screens agree.

export const STOCKS = [
  { sym: 'RELIANCE', name: 'Reliance Industries', mkt: 'IN', sector: 'Conglomerate', mcapCr: 2010000, px: 2985,
    pe: 28.4, pb: 2.4, roe: 9.2, roce: 10.1, salesG: 8.5, profitG: 10.2, divY: 0.35, de: 0.44, promoter: 50.3, fii: 21.8, beta: 1.05,
    ret1y: 14.2, ret3y: 11.5, vol: 22, q: 62, v: 48, mo: 58,
    about: 'Energy-to-everything conglomerate: O2C, Jio telecom, Retail, new energy.',
    moat: 'Scale + regulatory depth + consumer platforms with 480M subscribers.',
    risks: 'Capex intensity, conglomerate discount, succession.' },
  { sym: 'HDFCBANK', name: 'HDFC Bank', mkt: 'IN', sector: 'Private Bank', mcapCr: 1290000, px: 1685,
    pe: 18.9, pb: 2.7, roe: 14.8, roce: 7.6, salesG: 14.1, profitG: 12.8, divY: 1.15, de: 0, promoter: 0, fii: 47.9, beta: 0.95,
    ret1y: 11.8, ret3y: 8.9, vol: 20, q: 74, v: 60, mo: 52,
    about: 'India\'s largest private bank; merged with HDFC Ltd in 2023.',
    moat: 'Lowest-cost deposit franchise, underwriting culture, distribution.',
    risks: 'Merger drag on NIMs, deposit-growth race, size limits growth.' },
  { sym: 'BAJFINANCE', name: 'Bajaj Finance', mkt: 'IN', sector: 'NBFC', mcapCr: 445000, px: 7190,
    pe: 32.1, pb: 5.8, roe: 20.4, roce: 11.9, salesG: 26.0, profitG: 22.5, divY: 0.5, de: 3.9, promoter: 54.7, fii: 20.6, beta: 1.25,
    ret1y: 9.5, ret3y: 6.2, vol: 30, q: 78, v: 34, mo: 47,
    about: 'Consumer-lending powerhouse: durables, personal loans, cards ecosystem.',
    moat: 'Cross-sell data engine on 88M customers; cost of funds edge among NBFCs.',
    risks: 'Unsecured-credit cycles, RBI action on fintech-style lending, rich multiple.' },
  { sym: 'TCS', name: 'Tata Consultancy Services', mkt: 'IN', sector: 'IT Services', mcapCr: 1420000, px: 3890,
    pe: 29.2, pb: 14.1, roe: 51.2, roce: 64.4, salesG: 6.8, profitG: 8.5, divY: 1.9, de: 0.08, promoter: 71.8, fii: 12.4, beta: 0.8,
    ret1y: 6.5, ret3y: 9.1, vol: 18, q: 88, v: 42, mo: 44,
    about: 'World\'s #2 IT-services firm; the Tata group cash engine.',
    moat: '50%+ ROE, decade-long client relationships, unmatched delivery scale.',
    risks: 'GenAI deflation of services pricing, US cycle, visa policy.' },
  { sym: 'ITC', name: 'ITC', mkt: 'IN', sector: 'FMCG', mcapCr: 545000, px: 435,
    pe: 26.0, pb: 7.3, roe: 28.5, roce: 37.2, salesG: 7.2, profitG: 9.0, divY: 3.2, de: 0.0, promoter: 0, fii: 41.5, beta: 0.7,
    ret1y: 8.9, ret3y: 15.6, vol: 17, q: 81, v: 66, mo: 49,
    about: 'Cigarettes cash cow funding FMCG, hotels (demerged), paper, agri.',
    moat: '80%+ cigarette share, distribution to 7M outlets, 3%+ dividend.',
    risks: 'Sin-tax shocks, ESG exclusion flows, FMCG margins vs peers.' },
  { sym: 'TITAN', name: 'Titan Company', mkt: 'IN', sector: 'Consumer', mcapCr: 300000, px: 3380,
    pe: 88.0, pb: 24.5, roe: 30.8, roce: 25.1, salesG: 22.0, profitG: 18.0, divY: 0.3, de: 0.6, promoter: 52.9, fii: 18.2, beta: 0.9,
    ret1y: 4.2, ret3y: 12.4, vol: 24, q: 76, v: 18, mo: 41,
    about: 'Tanishq jewellery + watches + eyewear; the Tata consumer crown jewel.',
    moat: 'Trust in a trust-deficit category (gold); 8,000+ store network.',
    risks: 'Gold-price demand elasticity, lab-grown diamonds, 80x+ multiple.' },
  { sym: 'DIXON', name: 'Dixon Technologies', mkt: 'IN', sector: 'Electronics Mfg', mcapCr: 105000, px: 17550,
    pe: 122.0, pb: 32.0, roe: 28.0, roce: 32.5, salesG: 49.0, profitG: 52.0, divY: 0.05, de: 0.3, promoter: 32.9, fii: 22.1, beta: 1.4,
    ret1y: 38.0, ret3y: 45.0, vol: 38, q: 71, v: 8, mo: 86,
    about: 'India\'s largest EMS player — phones, TVs, wearables under PLI.',
    moat: 'PLI-scale manufacturing, China+1 flows, client lock-ins.',
    risks: 'Razor-thin margins, client concentration, triple-digit P/E.' },
  { sym: 'ZOMATO', name: 'Eternal (Zomato)', mkt: 'IN', sector: 'Platforms', mcapCr: 240000, px: 272,
    pe: 145.0, pb: 8.6, roe: 5.2, roce: 5.8, salesG: 60.0, profitG: 0, divY: 0, de: 0.02, promoter: 0, fii: 52.3, beta: 1.5,
    ret1y: 22.0, ret3y: 38.0, vol: 42, q: 44, v: 12, mo: 78,
    about: 'Food delivery + Blinkit quick-commerce duopoly with Swiggy.',
    moat: 'Two-sided network density; Blinkit dark-store lead.',
    risks: 'Quick-commerce cash burn, ONDC, valuation assumes flawless execution.' },
  { sym: 'SUNPHARMA', name: 'Sun Pharma', mkt: 'IN', sector: 'Pharma', mcapCr: 420000, px: 1750,
    pe: 35.5, pb: 5.6, roe: 17.1, roce: 18.9, salesG: 10.5, profitG: 15.0, divY: 0.8, de: 0.05, promoter: 54.5, fii: 17.8, beta: 0.75,
    ret1y: 12.5, ret3y: 21.0, vol: 21, q: 72, v: 40, mo: 60,
    about: 'India\'s largest pharma; specialty (Ilumya, Cequa) drives the rerating.',
    moat: 'Specialty pipeline + generics scale + US derm franchise.',
    risks: 'FDA plant actions, specialty R&D binary outcomes.' },
  { sym: 'LT', name: 'Larsen & Toubro', mkt: 'IN', sector: 'Infra & Capital Goods', mcapCr: 500000, px: 3640,
    pe: 33.0, pb: 5.0, roe: 15.5, roce: 17.2, salesG: 18.0, profitG: 20.0, divY: 0.9, de: 1.1, promoter: 0, fii: 25.4, beta: 1.1,
    ret1y: 16.0, ret3y: 24.0, vol: 25, q: 68, v: 45, mo: 65,
    about: 'India\'s infrastructure proxy — E&C order book ₹4.7L Cr+, defence, IT arms.',
    moat: 'Execution reputation on nation-scale projects; balance-sheet discipline.',
    risks: 'Order-cycle timing, Middle-East concentration, working capital.' },
  { sym: 'IRCTC', name: 'IRCTC', mkt: 'IN', sector: 'Monopoly Platform', mcapCr: 62000, px: 780,
    pe: 48.0, pb: 15.5, roe: 38.0, roce: 48.0, salesG: 14.0, profitG: 15.5, divY: 0.9, de: 0, promoter: 62.4, fii: 7.6, beta: 1.0,
    ret1y: -4.0, ret3y: 6.0, vol: 28, q: 79, v: 25, mo: 30,
    about: 'Monopoly on rail ticketing, catering and packaged water.',
    moat: '100% share of online rail booking; government-granted.',
    risks: 'The moat-giver can cap the take-rate any morning.' },
  { sym: 'GOLDBEES', name: 'Nippon Gold BeES (ETF)', mkt: 'IN', sector: 'Commodity ETF', mcapCr: 14000, px: 62,
    pe: 0, pb: 0, roe: 0, roce: 0, salesG: 0, profitG: 0, divY: 0, de: 0, promoter: 0, fii: 0, beta: 0.1,
    ret1y: 18.0, ret3y: 14.5, vol: 13, q: 50, v: 50, mo: 72,
    about: 'Physical-gold ETF; the standard crisis-ballast instrument.',
    moat: '—', risks: 'Gold gives no cash flows; long flat decades happen.' },
  { sym: 'AAPL', name: 'Apple Inc.', mkt: 'US', sector: 'Consumer Tech', mcapCr: 27500000, px: 232,
    pe: 33.0, pb: 48.0, roe: 147.0, roce: 56.0, salesG: 4.5, profitG: 7.0, divY: 0.45, de: 1.5, promoter: 0, fii: 0, beta: 1.1,
    ret1y: 15.0, ret3y: 12.0, vol: 24, q: 90, v: 30, mo: 62, route: 'LRS',
    about: 'The iPhone annuity + services flywheel; the world\'s premier consumer franchise.',
    moat: 'Ecosystem lock-in of 2.2B devices; 30%+ services margins.',
    risks: 'China exposure both ways, AI narrative gap, antitrust on services.' },
  { sym: 'MSFT', name: 'Microsoft', mkt: 'US', sector: 'Software & Cloud', mcapCr: 26000000, px: 428,
    pe: 35.0, pb: 11.5, roe: 36.0, roce: 28.0, salesG: 15.0, profitG: 16.5, divY: 0.7, de: 0.3, promoter: 0, fii: 0, beta: 0.95,
    ret1y: 18.0, ret3y: 16.0, vol: 23, q: 92, v: 34, mo: 68, route: 'LRS',
    about: 'Azure + Office + the OpenAI position — enterprise AI\'s toll collector.',
    moat: 'Enterprise distribution nobody can replicate; switching costs measured in careers.',
    risks: 'AI capex supercycle ROI, regulatory attention.' },
  { sym: 'NVDA', name: 'NVIDIA', mkt: 'US', sector: 'Semiconductors', mcapCr: 30000000, px: 138,
    pe: 48.0, pb: 32.0, roe: 91.0, roce: 75.0, salesG: 94.0, profitG: 120.0, divY: 0.03, de: 0.2, promoter: 0, fii: 0, beta: 1.7,
    ret1y: 42.0, ret3y: 75.0, vol: 48, q: 85, v: 10, mo: 92, route: 'LRS',
    about: 'The AI-compute monopoly: GPUs + CUDA + networking.',
    moat: 'CUDA software lock-in; a full-stack lead measured in years.',
    risks: 'Customer concentration (hyperscalers), custom-silicon substitution, cycle risk.' },
  { sym: 'VOO', name: 'Vanguard S&P 500 (ETF)', mkt: 'US', sector: 'Index ETF', mcapCr: 110000000, px: 545,
    pe: 24.5, pb: 4.8, roe: 0, roce: 0, salesG: 0, profitG: 0, divY: 1.3, de: 0, promoter: 0, fii: 0, beta: 1.0,
    ret1y: 13.0, ret3y: 11.0, vol: 17, q: 70, v: 45, mo: 60, route: 'LRS',
    about: '500 largest US companies at 0.03% cost — the global equity default.',
    moat: '—', risks: 'Top-10 concentration is at 1970s highs; USD-INR cuts both ways.' },
];

/* deterministic daily-ish price series (156 weekly points ≈ 3y) */
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const seriesCache = {};
export function priceSeries(stock, n = 156) {
  if (seriesCache[stock.sym]) return seriesCache[stock.sym];
  const rand = rng([...stock.sym].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7));
  const wDrift = Math.log(1 + stock.ret3y / 100) / 52;
  const wVol = stock.vol / 100 / Math.sqrt(52);
  let v = stock.px / Math.exp(wDrift * n); // walk ends near current px
  const out = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rand(), 1e-12), u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    v *= Math.exp(wDrift + wVol * z);
    out.push(v);
  }
  const scale = stock.px / out[out.length - 1];
  const scaled = out.map(x => x * scale);
  seriesCache[stock.sym] = scaled;
  return scaled;
}

export const bySym = sym => STOCKS.find(s => s.sym === sym);
