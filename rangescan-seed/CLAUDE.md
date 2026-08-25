# RANGE/SCAN — Rapid Range & Assortment Optimisation

## What this is
A demo of a range & assortment optimisation tool for grocery retail clients.
It compresses a range review from weeks into a ~10 working-day "rapid scan",
using agentic AI for the data-heavy stages. This repo is a **client-facing
demo built on dummy data** — not connected to any real client system.

Demo client/category used throughout: **Northgate Grocery — Chilled Yoghurt
& Desserts** (fictional). All figures are illustrative.

## The 6-stage journey (+ baseline)
The product is a single linear journey through a category review. Build and
navigate it in this order:

0. **Current Range** — baseline diagnostic (pre-scan). Category summary
   table + Pareto curve showing where sales concentrate and where the long
   tail sits today. This motivates the scan; it isn't one of the 6 numbered
   stages.
1. **Ingest & Cleanse** — agentic AI connects sources (EPOS, Nielsen,
   loyalty/basket, supplier cost, planogram), standardises SKU data, maps
   it to the commercial hierarchy, and flags exceptions for review.
2. **Decision Trees** — Customer Decision Trees (CDTs), built from
   basket-switching data, showing the order shoppers make decisions in
   (portion format → dietary base → flavour → attribute → need-state).
   Used to check the range covers every customer need.
3. **Scorecard** — weighted financial (60%) + operational (40%) scoring of
   every SKU against comparable products, producing a Retain / Review /
   Delist recommendation per line.
4. **Duplication** — AI agents test whether SKUs serving the same
   need-state are genuinely incremental or largely substitutable, modelling
   sales-transfer risk for flagged pairs.
5. **Financial Impact** — a sales & margin bridge from current to proposed
   range, applying sales-transfer assumptions (genuine loss / transfer to
   retained range / transfer to NPD) under Conservative / Base / Aggressive
   scenarios.
6. **Planogram** — the resulting optimised shelf layout, grouped by
   need-state (not just brand), with space allocation checked against a
   macro/midi target by store format.

## The 7 ranging principles
Every scorecard decision and planogram call is testable against this
framework. It should be visible in-product (e.g. a reference drawer/panel),
not just internal documentation:

1. **Role in customer mission** — mission/need-state served; strategic
   credibility products; market diamonds & growth spaces. *(Stages 0–2)*
2. **Role in target range architecture** — GBB/price-ladder tier; branded
   vs. own-brand mix; alignment to value strategy. *(Stage 3)*
3. **SKU performance (scorecard)** — outperformance vs. comparable
   products; justifiable underperformance. *(Stages 0 & 3)*
4. **Assortment duplication & transferability** — same need served
   elsewhere; incrementality vs. substitution; sales-transfer risk.
   *(Stage 4)*
5. **Operational complexity** — case size/shelf life fit; waste/markdown;
   supplier risk; cost-to-serve. *(Stage 3, operational weighting)*
6. **Range monetisation** — supplier investment, JBP/solus terms, cost/
   margin improvement levers. *(Stage 5)*
7. **Merchandising & ease-of-shop** — brand blocking, GBB navigation,
   need-state grouping, facings optimisation, macro/midi space fit.
   *(Stage 6)*

## Stack
- React + TypeScript + Vite
- Tailwind CSS (theme tokens below map directly to `tailwind.config`)
- No backend — the app reads static JSON from `/data` at build/runtime.
  State (selected scenario, weight sliders, active filters) is local
  component/context state; nothing needs to persist server-side for the
  demo.

## Data
`schema.ts` is the contract. `scripts/generate_seed_data.py` produces every
file in `/data` from one seeded random run, so figures reconcile across
screens (e.g. the Scorecard's Delist count drives the Financial Impact
bridge's "Delists" step, and the Duplication stage's flagged pairs are a
subset of the same SKU pool). **Never hand-edit a number directly in a
component** — if a screen needs a number that isn't in `/data`, extend the
schema and regenerate, don't hardcode it locally.

| File | Feeds |
|---|---|
| `data/skus.json` | Scorecard, Duplication, Planogram, Current Range (raw+confirmed) |
| `data/scorecard-weights.json` | Scorecard weighting panel |
| `data/cdt.json` | Decision Trees |
| `data/duplication.json` | Duplication agent cards |
| `data/financial-bridge.json` | Financial Impact waterfall |
| `data/sales-transfer-assumptions.json` | Financial Impact scenario toggle |
| `data/planogram.json` | Planogram space-allocation heatmap |
| `data/current-range-baseline.json` | Current Range need-state table |
| `data/pareto-bands.json` | Current Range Pareto breakdown table |

To regenerate with different dummy figures, edit the distribution
parameters at the top of `generate_seed_data.py` (weights, sales ranges,
margin ranges) and re-run it — don't hand-edit the JSON output.

## Design tokens
Colour, type and component patterns are established in the wireframe
(`reference/rangescan-wireframe.html`) — treat it as the visual reference,
not code to port directly. Rebuild each pattern as a proper component.

```
--ink:      #0E211A   (headings, dark text)
--pine:     #0F2A21   (sidebar / dark surfaces)
--emerald:  #1F8A6E   (primary action, "Retain"/positive)
--amber:    #E2A03F   (attention, "Review", in-progress)
--red:      #D14B3D   ("Delist", risk, negative)
--canvas:   #F3F5F1   (page background)
--surface:  #FFFFFF   (cards)
--border:   #E2E7E1
--text-mute:#5B665F
```

- **Display font**: Fraunces (serif) — section titles / stage headers only.
- **UI font**: Inter — everything else (labels, buttons, body).
- **Data font**: IBM Plex Mono, tabular figures — every number in a table,
  KPI, or chart. Never render a £ value or % in Inter.
- Status colour convention is fixed: **emerald = Retain/Complete/positive,
  amber = Review/In-progress, red = Delist/negative/risk**. Keep this
  consistent across every stage — a red cell means the same thing on the
  Scorecard as it does on the Current Range baseline table.

## Components to build once, reuse everywhere
Don't let each stage reinvent these — build them in `/components` before
starting on individual stage screens:
- `Sidebar` (6-stage nav + Overview + Current Range, with done/active/
  pending state per item)
- `KpiRow` (the 5–6 column stat strip used on every stage)
- `Card` (the standard white surface + border + shadow container)
- `DataTable` (sortable, with a `scoreCell` variant for red/amber/green
  conditional formatting)
- `Tag` (Retain/Review/Delist and Complete/In progress/Pending chips)
- `PrinciplesDrawer` (slide-out panel listing the 7 principles, with a
  `focusIds` prop to auto-expand and highlight the ones relevant to the
  current stage)

## Build order
1. Scaffold the app; set up Tailwind theme from the tokens above.
2. Load `schema.ts` types and wire up `/data` loading (a simple typed
   `useData()` hook or context is enough — no need for a real data layer).
3. Build `Sidebar`, `KpiRow`, `Card`, `DataTable`, `Tag`, `PrinciplesDrawer`.
4. Build stages in this order: **Overview → Current Range → Ingest →
   Decision Trees → Scorecard → Duplication → Financial Impact →
   Planogram.** Each stage is its own prompt/session once the shell works.
5. Add the agentic-feel touches last (staggered/streaming activity feeds on
   Ingest and Duplication) — polish, not structure.
6. Add a second dummy category dataset if a "compare categories" demo
   moment is wanted; deploy to Vercel/Netlify for a shareable link.

## What NOT to do
- Don't invent new colours/fonts per screen — extend the tokens above.
- Don't hardcode numbers that should come from `/data`.
- Don't build a backend or auth for this demo — it's a static, seeded
  walkthrough.
- Don't copy the wireframe's inline CSS — it was a fast prototype, not a
  component system.
