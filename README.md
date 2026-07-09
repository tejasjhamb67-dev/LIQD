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

## What's inside

| Page | What it does |
|---|---|
| **The Blueprint** | 6-step inputs wizard — client info, corpus, monthly top-up, tenure, goal, risk appetite, risk tolerance, constraints, investor tier — then generates **three model portfolios (Conservative / Balanced / Aggressive)** and you deploy one |
| **Overview** | Client info, corpus, risk score breakdown (capacity vs willingness), allocation donut, top sleeves, next best actions |
| **Portfolio** | The four asset classes — Equities, Fixed Income, Alternatives, Tactical — every sleeve, the liquidity ladder, and the global/LRS sleeve |
| **Growth & Projections** | Lognormal fan chart (P10–P90) with live tenure/SIP sliders, goal probability, crore milestones |
| **Rebalancing Studio** | Drag class weights; return, vol, drawdown, Sharpe and goal odds reprice live; before/after diff; commit |
| **Scenario Lab** | 8 stress scenarios (2008, COVID, rate shock, stagflation, INR slide, melt-up…) as shock vectors on your live weights, with recovery estimates and a 100%-equity comparison |
| **Product Universe** | 40+ instruments across all classes incl. US/global via LRS & GIFT City, AIF/PMS/unlisted — filterable, tier-gated |
| **Integrations** | Zerodha, Groww, Upstox, Angel One, MF Central, CAMS/KFin CAS, Account Aggregator, Vested/IBKR… mock connect + import analysis (fee leaks, overlap, drift) |
| **LIQD Advantage** | Fee-drag chart: LIQD flat fee vs DIY direct vs 2%+20% PMS vs regular MF over your tenure, plus the six differentiation pillars and pricing |

## Architecture

```
index.html
css/liqd.css          design system (dark luxe, validated data palette)
js/
  app.js              shell + hash router
  state.js            client state → localStorage
  engine.js           THE engine: risk score → model construction →
                      lognormal projections → scenario shocks → fee drag
  charts.js           hand-rolled SVG kit: donut, fan chart, bars, lines,
                      sparkline, meter — all with hover tooltips
  data.js             product universe, sleeves, scenarios, integrations
  util.js             ₹ Cr/L formatting, tooltip singleton, class meta
  pages/*.js          one module per page
```

One deterministic engine powers every screen, so the Overview, Studio, Lab and Projections always agree — that's the Aladdin idea, miniaturised.

All figures are illustrative model assumptions, not investment advice.
