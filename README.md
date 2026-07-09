# LIQD — Portfolio Intelligence

**Aladdin-grade portfolio construction, projection, stress-testing and rebalancing — as a chic flat-fee SaaS for HENRYs, HNIs, UHNIs and family offices.** See [PLAN.md](PLAN.md) for the full product thesis and Dezerv/BlackRock positioning.

## Run it

Zero dependencies, zero build step. Any static server works:

```bash
cd LIQD
python3 -m http.server 4173
# open http://localhost:4173
```

(ES modules require http:// — opening index.html directly from the filesystem won't work.)

## Deploy to Vercel

The repo is Vercel-ready (`vercel.json` included, pure static output — no build step):

```bash
npm i -g vercel
vercel login          # one-time
vercel --prod         # from the repo root — done
```

Or zero-CLI: [vercel.com/new](https://vercel.com/new) → import the GitHub repo → Framework preset "Other" → leave build command empty → Deploy.

## What's inside

| Page | What it does |
|---|---|
| **The Blueprint** | Mandate wizard — client info, corpus, SIP with **annual step-up + up to 5 income events**, tenure, goal, risk appetite, risk tolerance, constraints, investor tier — then a **transparent construction step** (risk-score math, capital-market assumptions, correlation matrix, applied adjustments) before generating **three proposals (Conservative / Balanced / Aggressive)**, each deployable as-is or deploy-and-tune |
| **Overview** | Client info, corpus, risk score breakdown (capacity vs willingness), allocation donut, top sleeves, next best actions |
| **Portfolio** | The four asset classes — Equities, Fixed Income, Alternatives, Tactical — every sleeve, the liquidity ladder, and the global/LRS sleeve |
| **Growth & Projections** | 2,000-path **Monte Carlo** fan (P10–P90) with invested-capital line, live SIP/step-up/tenure sliders, goal probability from the simulated distribution, contribution schedule, crore milestones |
| **Rebalancing Studio** | Policy bands (±5 pts) with **whole-portfolio drift incl. linked external holdings**, live what-if sliders, **efficient frontier** with your draft plotted, **risk-contribution decomposition**, sleeve-level **trade list with LTCG estimate** and harvesting budget, before/after diff, commit |
| **Scenario Lab** | 8 stress scenarios (2008, COVID, rate shock, stagflation, INR slide, melt-up…) as shock vectors on your live weights, with recovery estimates and a 100%-equity comparison |
| **Product Universe** | 40+ instruments across all classes incl. US/global via LRS & GIFT City, AIF/PMS/unlisted — filterable, tier-gated |
| **Integrations** | Zerodha, Groww, Upstox, Angel One, MF Central, CAMS/KFin CAS, Account Aggregator, Vested/IBKR… mock connect + import analysis (fee leaks, overlap, drift) |
| **LIQD Advantage** | Fee-drag chart: LIQD flat fee vs DIY direct vs 2%+20% PMS vs regular MF over your tenure, plus the six differentiation pillars and pricing |

## Architecture

```
index.html
css/liqd.css          design system (light porcelain + petrol, validated data palette)
js/
  app.js              shell + hash router
  state.js            client state → localStorage
  engine.js           THE engine: risk score → model construction (correlation
                      matrix) → contribution schedule (step-up + income events)
                      → seeded Monte Carlo → risk contributions → efficient
                      frontier → scenario shocks → fee drag
  charts.js           hand-rolled SVG kit: donut, fan chart, bars, lines,
                      sparkline, meter — all with hover tooltips
  data.js             product universe, sleeves, scenarios, integrations
  util.js             ₹ Cr/L formatting, tooltip singleton, class meta
  pages/*.js          one module per page
```

One deterministic engine powers every screen, so the Overview, Studio, Lab and Projections always agree — that's the Aladdin idea, miniaturised.

All figures are illustrative model assumptions, not investment advice.
