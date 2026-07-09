# LIQD — Product & Build Plan

**The pitch:** Dezerv proved affluent Indians will pay for expert-led, actively managed portfolios. But their model (₹50L PMS minimum, %-of-AUM economics, human-led) structurally ignores the fastest-growing wealth cohort in India: **HENRYs — High Earners, Not Rich Yet** (24–40, ₹40L–₹1Cr+ income, ₹10L–₹1Cr investable). LIQD is the Aladdin-grade portfolio engine, rebuilt as a chic self-serve SaaS, priced as a flat subscription instead of a cut of your wealth.

---

## 1. Market position

| | Dezerv | Traditional PMS | LIQD |
|---|---|---|---|
| Entry | ₹50L (SEBI PMS floor) | ₹50L | **₹10L** (MF/ETF/bond rails — no PMS wrapper needed) |
| Fees | 0% fixed + up to 10% profit share | 2% fixed + 20% perf | **Flat subscription** (₹9k–₹1L/yr by tier) |
| Model | Discretionary, human-led | Discretionary | **Engine-led, human-optional** — you see the machine |
| Target | Affluent 35–55 | UHNI | **HENRY / young HNI 24–40**, plus HNI/UHNI/FO/NRI tiers |
| Portfolio ingestion | Wealth Monitor (MF CAS) | Manual | **API-first**: Zerodha, Groww, Upstox, MF Central, CAMS/KFin, AA, Vested/IBKR |
| Global | Limited | Rare | **Native LRS + GIFT City** sleeve in every model |

**Why "LIQD":** liquidity as a first-class portfolio dimension. Every product in the universe is tagged T+0 → 5yr lock-in; every model portfolio shows its liquidity ladder.

## 2. What BlackRock/Aladdin does that retail tools don't — and what we steal

1. **One risk engine under everything** — the same factor model powers construction, monitoring, rebalancing, and stress tests. LIQD: one `engine.js` (risk scoring → model construction → projections → scenarios → rebalancing) so every screen agrees with every other screen.
2. **Scenario analysis as a first-class citizen** — shock factors, not just "markets fall 10%". LIQD Scenario Lab ships 8 named historical/hypothetical scenarios with per-asset-class shock vectors and recovery-time estimates.
3. **What-if before commit** — Aladdin's modeling sandbox → LIQD Rebalancing Studio: drag allocations, watch return/vol/drawdown/goal-probability reprice live, then commit.
4. **Whole-portfolio view across wrappers** — external holdings imported via broker APIs sit next to LIQD sleeves.

## 3. Client journey (this app)

```
Inputs (Blueprint) ──► 3 model portfolios ──► choose one ──► full workspace
  corpus                 Conservative           │
  tenure                 Balanced               ├─ Overview (client info, corpus, risk, snapshot)
  risk appetite          Aggressive             ├─ Portfolio (4 asset classes, sleeves, holdings)
  risk tolerance                                ├─ Growth & Projections (fan chart, goal probability)
  goal                                          ├─ Rebalancing Studio (live what-if between classes)
  constraints                                   ├─ Scenario Lab (stress tests)
  investor type                                 ├─ Product Universe (70+ instruments, filterable)
                                                ├─ Integrations (broker/registrar APIs)
                                                └─ LIQD Advantage (fee drag calculator, pillars)
```

## 4. The engine (deterministic, explainable)

- **Risk score (0–100)** = 45% *capacity* (tenure, age, liquidity constraints) + 55% *willingness* (appetite, drawdown tolerance).
- **Model construction**: three base allocations across **Equities / Fixed Income / Alternatives / Tactical**, tilted by risk score, then filtered by constraints (no-international ⇒ LRS sleeve folds into domestic; Shariah ⇒ debt→gold/sukuk-like; ESG screen; liquidity floor ⇒ lock-in products excluded) and gated by investor tier (AIF/PMS/unlisted only above SEBI minimums).
- **Projections**: lognormal percentile bands (P10/P25/P50/P75/P90) with monthly top-ups; goal probability from the same distribution.
- **Scenarios**: shock vector per asset class × current weights ⇒ ₹ impact + est. recovery months.
- **Rebalancing**: weights renormalize live; μ, σ, max-drawdown estimate, and goal probability reprice on every drag; drift vs chosen model tracked.

## 5. Product universe (v1: ~70 instruments)

Direct equity & baskets · MFs (active/index/international FoF) · ETFs · G-Secs/T-Bills/SDLs · corporate bonds · target-maturity funds · REITs/InvITs · gold/silver · AIF Cat I/II/III · PMS strategies · private credit · unlisted/pre-IPO · **US stocks & global ETFs via LRS** · GIFT City inbound funds · covered-call & momentum tactical sleeves. Each tagged: min ticket, liquidity, risk grade, expected return band, tax treatment, investor-tier eligibility, route (Direct/LRS/GIFT).

## 6. Integrations (mocked in v1, real API map documented)

Zerodha Kite Connect · Groww · Upstox · Angel One SmartAPI · Dhan · MF Central · CAMS + KFintech CAS · NSDL/CDSL CAS · Sahamati Account Aggregator · Vested / INDmoney / IBKR (US) — one-click import ⇒ overlap analysis, TER drag, drift vs blueprint ⇒ migrate.

## 7. Monetization

- **HENRY** ₹9,000/yr (self-serve, ₹10L–1Cr)
- **HNI** ₹36,000/yr (+ quarterly human review, 1–25Cr)
- **UHNI/FO** ₹1,00,000+/yr (multi-entity, mandates, reporting API, 25Cr+)
- Zero AUM fees, zero commissions (direct plans only) — the fee gap *is* the marketing (see Advantage page).

## 8. Build status (this repo)

- [x] Zero-dependency SPA (vanilla ES modules, hand-rolled SVG chart kit, hash router, localStorage persistence)
- [x] Blueprint onboarding → 3 generated models → selection
- [x] Overview · Portfolio · Growth · Rebalancing Studio · Scenario Lab · Universe · Integrations · Advantage
- [ ] v2: real broker OAuth, live NAV/quote feeds, PDF reporting, multi-goal buckets, family-office entity tree, advisor console (B2B2C)
