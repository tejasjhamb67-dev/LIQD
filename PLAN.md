# LIQD — Master Plan v3
### One membership. Ten products. Every rupee decision in one place.

---

## 1 · Competitive teardown — what each player actually sells

| Player | Positioning | Core features | What we take | What we reject |
|---|---|---|---|---|
| **BlackRock (Aladdin / Aladdin Wealth)** | One risk engine under everything, institution-grade | Factor risk models, scenario shocks, what-if rebalancing, whole-book monitoring | The single-engine architecture; scenario vectors; policy bands | Institution-only access, opacity to end client |
| **Goldman Sachs PWM** | $10M+ concierge; access as the product | Alts/private deals, structured notes, lending against portfolio, banker relationship | Access tiers; lending-aware net worth view | Human bottleneck, 1%+ fees, zero self-serve |
| **Morgan Stanley PWM (+E*TRADE, Parametric)** | Advice + workplace equity + direct indexing | ESOP/RSU handling, tax-loss harvesting at scale, unified managed accounts | ESOP awareness; tax alpha as a first-class feature | Advisor-led everything |
| **Dezerv** | ₹50L+ expert-led PMS for Indian affluent | Integrated portfolios, Wealth Monitor (free portfolio audit), profit-share fee | Free-audit-as-funnel (our Integrations import) | ₹50L floor, discretionary black box |
| **Kristal.AI / boutique MFOs (Klay-type)** | Curated global funds + private desk for NRI/HNI | Fund menus, LRS execution, advisory pods | Global rails (LRS/GIFT) as default | Fund-supermarket clutter |
| **smallcase / WealthDesk** | Thematic baskets on broker rails | Curated model baskets, one-click execute, SIP into baskets | Basket = strategy-as-product | No holistic risk view |
| **INDmoney / ET Money** | Aggregation super-app | AA-based net worth, US stocks, insurance cross-sell | Whole-life aggregation | Ad/cross-sell-driven advice conflicts |
| **Zerodha (+Varsity)** | Cheapest execution + best education in India | Kite, Console analytics, Varsity structured lessons | Education as retention moat (→ LIQD Learn) | No advice layer by design |
| **CRED** | Club membership for creditworthy Indians | Card management, rewards, curated commerce, member psychology | Design bar, member-tier psychology, credit as wedge (→ LIQD Credit) | Rewards-first shallowness |
| **Bloomberg Terminal** | The professional's single pane for *everything* | Security master pages, screeners, news, analytics, chat — 40k+ functions | Instrument pages + screener + one command surface (→ LIQD Terminal) | $24k/yr, 1980s UX |

**The gap LIQD owns:** nobody serves the ₹10L–₹1Cr HENRY with institution-grade construction + Bloomberg-depth instrument intelligence + CRED-grade product design + Varsity-grade education — as one flat-fee membership.

---

## 2 · The product tree — 10 products under one membership

```
LIQD ──────────────────────────────────────────────────────────────────
│
├── 01 WEALTH            the PMS core (exists, keeps deepening)
│     ├── Blueprint      mandate wizard → transparent construction → 3 proposals
│     ├── Overview       whole-book snapshot, risk profile, actions
│     ├── Portfolio      4 asset classes · sleeves · liquidity ladder · LRS
│     ├── Growth         Monte Carlo · glide path · drawdown simulator
│     ├── Studio         policy bands · frontier · trade list · tax math
│     └── IPS            printable investment policy statement
│
├── 02 TERMINAL          instrument intelligence (Bloomberg, humanised)
│     ├── Security pages price history, fundamentals, ratios, shareholding,
│     │                  tax treatment, how-to-buy, role-in-your-portfolio
│     ├── Watchlist      starred instruments, live-ish tiles
│     └── (v2) News, corporate actions, peer comps, FII/DII flows
│
├── 03 SCREEN            discovery machines
│     ├── Equity screener  factor filters (quality/value/momentum/growth)
│     ├── Fund screener    TER, alpha, consistency (v2)
│     └── Preset screens   "Coffee-can", "Dividend ladder", "Momentum 20"
│
├── 04 STRATEGIES        rules-based playbooks, not tips
│     ├── Library        momentum rotation, covered calls, arbitrage carry,
│     │                  index+gold barbell, special situations, ESOP unwind
│     ├── Each: rules · when it works · when it bleeds · historical stats
│     └── Deploy → tactical sleeve of Wealth (capped by policy)
│
├── 05 LEARN             the mentoring ladder (Duolingo mechanics)
│     ├── Tracks         Foundations → Markets → Portfolio Craft → Tax & Structuring
│     ├── Lessons        3-min cards + quiz gates, XP, streaks, levels
│     └── Unlocks        finishing a track unlocks Strategies/features contextually
│
├── 06 CREDIT            the HENRY wedge (CRED-adjacent, advice-first)
│     ├── Card stack     spend profile → optimal 2–3 card combination, reward math
│     ├── Borrowing      loan-against-MF/shares vs personal loan vs FD-break math
│     └── Score hygiene  utilisation, limit strategy, fee-vs-reward breakevens
│
├── 07 CIRCLES           community capital (pooled access)
│     ├── Asset circles  10 people × ₹5L → CRE/SM-REIT lot, bond lots, art
│     ├── Loan circles   group negotiation for bulk rates (v2)
│     └── Governance     min ticket, quorum, exit rules, escrow status
│
├── 08 PULSE             social, in a financial-literacy grammar
│     ├── Setups         structured trade posts: instrument, direction, entry,
│     │                  target, stop, thesis, invalidation → auto R:R
│     ├── Journals       performance-tracked public track records (v2)
│     └── No noise rule  every post must carry risk + invalidation to publish
│
├── 09 ASSETS            the long tail (small alternatives, transparently)
│     ├── REITs/InvITs, SGB-successors, fractional CRE, P2P (capped),
│     │   invoice discounting, art/collectibles via circles
│     └── Each with liquidity, lock-in, tax and "role in portfolio" tags
│
└── 10 ADVISORY          the human layer (tier-gated)
      ├── Quarterly reviews (HNI+), mandate desk (UHNI/FO)
      ├── IPS + rebalancing protocol enforcement
      └── (v2) advisor console — the B2B2C product
```

**Spine:** one engine, one design system, one state. Wealth is the anchor; Terminal/Screen feed it instruments; Strategies feed its tactical sleeve; Learn gates sophistication; Credit/Circles/Assets capture the money that isn't in markets yet; Pulse keeps them here daily; Advisory monetises the top tiers.

---

## 3 · Design law (the "expensive" bar)

1. **Minimal text.** Labels, numbers, and one-line captions. No paragraphs on working screens; explanation lives in Learn and in tooltips.
2. **Dense, calm surfaces.** Tighter radii, hairlines, tabular numerals, uppercase micro-labels. Data is the decoration.
3. **Every number is computed** by the shared engine — never typed into copy.
4. **Every list opens.** Any instrument, strategy, card, circle or lesson is a page/sheet, not a dead row.
5. **State-aware everywhere.** Every module reads the user's blueprint (tier, corpus, risk) and adapts what it shows.

---

## 4 · Delivery sequence

| Phase | Ships | Status |
|---|---|---|
| P0 | Wealth core (v2.1) | ✅ live |
| P1 | Suite IA (10-product nav) · design maturation pass · Scenario Lab rebuilt as Risk Matrix | **this release** |
| P2 | Terminal security pages · Screen (equity) · Universe→openable | **this release** |
| P3 | Credit · Learn (tracks/XP) · Pulse (structured setups) · Circles · Strategies | **this release** |
| P4 | Live market data feed, real broker OAuth, payments/KYC, backend (Supabase/Postgres), auth | next — needs backend |
| P5 | Advisory console (B2B2C), Journals with verified track records, Loan circles | after P4 |

**Deploy model:** static front-end on Vercel (current) → P4 adds a thin API layer (Vercel functions + Postgres) for auth, community persistence, and market-data proxy (NSE/BSE EOD + a quotes vendor). Community/Pulse/Circles run demo-grade on localStorage until then.

---

## 5 · Monetisation map

| Product | Free | Member (₹9k–₹1L/yr by tier) | Extra rails |
|---|---|---|---|
| Wealth | 1 blueprint, view-only | full engine, rebalancing, IPS | — |
| Terminal/Screen | 5 instruments/day | unlimited + watchlists | — |
| Strategies | read rules | deploy to sleeve | — |
| Learn | track 1 | all tracks, certificates | B2B (employers) |
| Credit | card stack teaser | full math + alerts | issuer referral (disclosed, flat) |
| Circles | browse | join/create | platform fee per circle (flat) |
| Pulse | read | post/journal | — |
| Advisory | — | HNI+ tiers | mandate fees (UHNI/FO) |
```

All figures illustrative; SEBI RIA/RA licensing required before advice goes live; circle structures need escrow + trustee rails.
