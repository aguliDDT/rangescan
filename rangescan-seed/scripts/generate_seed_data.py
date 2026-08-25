#!/usr/bin/env python3
"""
RANGE/SCAN — dummy data generator
----------------------------------------------------------------
Produces every JSON file the demo reads from, all derived from one
seeded random run so the numbers reconcile across screens (the
Scorecard's Retain/Review/Delist split matches what the Financial
Impact bridge and Duplication stage build from).

Run:  python3 generate_seed_data.py
Output: ../data/*.json
"""
import json, random, statistics
from pathlib import Path
from collections import defaultdict

random.seed(42)
OUT = Path(__file__).resolve().parent.parent / "data"
OUT.mkdir(exist_ok=True)

STORES_TOTAL = 400
RAW_SKU_COUNT = 108
DROP_COUNT = 11  # dropped at Stage 1 cleansing (duplicates / zero-sales) -> 97 confirmed

# ---------------------------------------------------------------
# 1. SKU population
# ---------------------------------------------------------------
PORTION = [("Big Pack", 0.38), ("Multipack", 0.41), ("Single Portion", 0.21)]
DIETARY = [("Dairy - Cow", 0.76), ("Plant - Soya/Oat", 0.18), ("Dairy - Goat/Sheep", 0.06)]
FLAVOUR = [("Flavoured", 0.52), ("Natural", 0.31), ("Kids", 0.17)]
ATTRIBUTE = [("Standard", 0.53), ("High Protein", 0.28), ("Low Sugar", 0.19)]
BRAND = [("Branded", 0.70), ("Own Brand", 0.30)]

def weighted_choice(pairs):
    r, acc = random.random(), 0.0
    for label, w in pairs:
        acc += w
        if r <= acc:
            return label
    return pairs[-1][0]

def need_state(flavour, attribute, portion):
    if flavour == "Kids":
        return "Kids Lunchbox"
    if attribute == "High Protein":
        return "Health & Fitness"
    if flavour == "Flavoured":
        if portion == "Single Portion" and random.random() < 0.45:
            return "On-the-go"
        return "Indulgent Treat"
    return "Everyday Family"

skus = []
brand_counters = {"Branded": 0, "Own Brand": 0}
for i in range(RAW_SKU_COUNT):
    brand = weighted_choice(BRAND)
    portion = weighted_choice(PORTION)
    dietary = weighted_choice(DIETARY)
    flavour = weighted_choice(FLAVOUR)
    attribute = weighted_choice(ATTRIBUTE)
    ns = need_state(flavour, attribute, portion)

    brand_counters[brand] += 1
    prefix = "BR" if brand == "Branded" else "OB"
    sku_id = f"{prefix}-{brand_counters[brand]:02d}"
    name = f"{brand} \u2013 Product {brand_counters[brand]:02d}"

    # sales: lognormal-ish, branded + big pack + protein skew higher
    base = random.lognormvariate(11.2, 0.9)
    if brand == "Branded":
        base *= 1.35
    if portion == "Big Pack":
        base *= 1.25
    if attribute == "High Protein":
        base *= 1.15
    sales_value = round(base, 2)

    distribution = min(STORES_TOTAL, max(20, int(random.gauss(
        260 + (sales_value / 3000), 70))))
    margin_pct = round(random.uniform(0.30, 0.36) if brand == "Own Brand"
                        else random.uniform(0.20, 0.30), 3)
    waste_pct = round(max(0.005, random.gauss(0.045, 0.02) - sales_value / 4_000_000), 4)
    ros = round(sales_value / max(distribution, 1) / 52, 2)
    volume = int(sales_value / random.uniform(1.8, 3.6))
    case_size = random.choice([6, 8, 12, 16, 24])
    supplier_risk = round(random.triangular(1, 5, 1.8), 1)

    skus.append(dict(
        id=sku_id, name=name, brandType=brand,
        portionFormat=portion, dietaryBase=dietary, flavourProfile=flavour,
        attribute=attribute, needState=ns,
        salesValueGBP=sales_value, salesVolumeUnits=volume,
        tradingMarginPct=margin_pct, storesDistributed=distribution,
        storesTotal=STORES_TOTAL, rateOfSalePerStorePerWeekGBP=ros,
        wastePct=max(0.005, waste_pct), caseSize=case_size,
        supplierRiskScore=supplier_risk,
    ))

# drop the lowest-sales DROP_COUNT SKUs at "cleansing" (dup/zero-sales removal)
skus_sorted = sorted(skus, key=lambda s: s["salesValueGBP"])
drop_ids = {s["id"] for s in skus_sorted[:DROP_COUNT]}
for s in skus:
    s["status"] = "cleansed_out" if s["id"] in drop_ids else "confirmed"

# ---------------------------------------------------------------
# 2. Scorecard: financial + operational scores -> weighted decision
# ---------------------------------------------------------------
confirmed = [s for s in skus if s["status"] == "confirmed"]

# percentile rank (not /max) so a long sales tail doesn't compress everyone's score to ~0
def percentile_ranks(items, key):
    ordered = sorted(items, key=key)
    n = len(ordered)
    ranks = {}
    for i, item in enumerate(ordered):
        ranks[item["id"]] = i / max(n - 1, 1)
    return ranks

sales_pctile = percentile_ranks(confirmed, lambda s: s["salesValueGBP"])
ros_pctile = percentile_ranks(confirmed, lambda s: s["rateOfSalePerStorePerWeekGBP"])

WEIGHT_CONFIG = {
    "financial": [
        {"label": "Sales value", "weightPct": 20},
        {"label": "Sales growth", "weightPct": 10},
        {"label": "Trading margin %", "weightPct": 15},
        {"label": "Rate of sale", "weightPct": 15},
    ],
    "operational": [
        {"label": "Distribution / availability", "weightPct": 15},
        {"label": "Waste & markdown", "weightPct": 10},
        {"label": "Case fill / CPC", "weightPct": 5},
        {"label": "Supplier risk", "weightPct": 10},
    ],
}

for s in confirmed:
    sales_n = sales_pctile[s["id"]]
    growth_n = random.uniform(0.2, 0.9)  # no history modelled; randomised placeholder
    margin_n = min(1, max(0, (s["tradingMarginPct"] - 0.18) / (0.38 - 0.18)))
    ros_n = ros_pctile[s["id"]]
    financial_score = round(5 * (0.33 * sales_n + 0.17 * growth_n + 0.25 * margin_n + 0.25 * ros_n), 2)

    dist_n = s["storesDistributed"] / s["storesTotal"]
    waste_n = 1 - min(s["wastePct"] / 0.09, 1)
    case_n = 1 - abs(s["caseSize"] - 12) / 18
    risk_n = 1 - (s["supplierRiskScore"] - 1) / 4
    operational_score = round(5 * (0.375 * dist_n + 0.25 * waste_n + 0.125 * case_n + 0.25 * risk_n), 2)

    weighted = round(financial_score * 0.6 + operational_score * 0.4, 2)
    decision = "Retain" if weighted >= 3.1 else ("Review" if weighted >= 2.2 else "Delist")

    s["scorecard"] = dict(
        financialScore=max(0, min(5, financial_score)),
        operationalScore=max(0, min(5, operational_score)),
        weightedScore=max(0, min(5, weighted)),
        decision=decision,
    )

(OUT / "skus.json").write_text(json.dumps(skus, indent=2))
(OUT / "scorecard-weights.json").write_text(json.dumps(WEIGHT_CONFIG, indent=2))

# ---------------------------------------------------------------
# 3. Customer Decision Tree (flat, per-stage split weights)
# ---------------------------------------------------------------
cdt = []
for label, w in PORTION:
    cdt.append(dict(stage=1, stageLabel="Portion format", nodeLabel=label, weightPct=round(w * 100), isLeaf=False))
for label, w in DIETARY:
    cdt.append(dict(stage=2, stageLabel="Dietary base", nodeLabel=label, weightPct=round(w * 100), isLeaf=False))
for label, w in FLAVOUR:
    cdt.append(dict(stage=3, stageLabel="Flavour profile", nodeLabel=label, weightPct=round(w * 100), isLeaf=False))
for label, w in ATTRIBUTE:
    cdt.append(dict(stage=4, stageLabel="Attribute", nodeLabel=label, weightPct=round(w * 100), isLeaf=False))

need_state_counts = defaultdict(int)
for s in confirmed:
    need_state_counts[s["needState"]] += 1
total_confirmed = len(confirmed)
for ns, count in need_state_counts.items():
    cdt.append(dict(stage=5, stageLabel="Need-state (leaf)", nodeLabel=ns,
                     weightPct=round(count / total_confirmed * 100), isLeaf=True))

(OUT / "cdt.json").write_text(json.dumps(cdt, indent=2))

# ---------------------------------------------------------------
# 4. Duplication pairs
# ---------------------------------------------------------------
groups = defaultdict(list)
for s in confirmed:
    groups[(s["needState"], s["portionFormat"], s["flavourProfile"], s["attribute"], s["dietaryBase"])].append(s)

dup_pairs = []
pair_n = 0
for key, members in groups.items():
    if len(members) < 2:
        continue
    members_sorted = sorted(members, key=lambda s: -s["salesValueGBP"])
    a, b = members_sorted[0], members_sorted[1]  # only the closest-matched pair per micro-segment
    price_gap = abs(a["rateOfSalePerStorePerWeekGBP"] - b["rateOfSalePerStorePerWeekGBP"]) / max(a["rateOfSalePerStorePerWeekGBP"], 1)
    if price_gap > 0.45:
        continue  # too different in performance to be a real duplication risk
    pair_n += 1
    shared = ["need-state", "flavour profile", "pack size"]
    if a["brandType"] == b["brandType"]:
        shared.append("brand tier")
    brand_same = a["brandType"] == b["brandType"]
    transfer_risk = round(min(92, max(12, (70 if brand_same else 35) - price_gap * 40 + random.uniform(-8, 8))))
    loser = b if b["salesValueGBP"] < a["salesValueGBP"] else a
    if transfer_risk >= 55:
        rec = f"Delist lower performer ({loser['name']})"
    elif transfer_risk >= 30:
        rec = "Consolidate to a single SKU"
    else:
        rec = "Retain both — materially different shopper/occasion"
    dup_pairs.append(dict(
        id=f"DUP-{pair_n:03d}", skuIdA=a["id"], skuIdB=b["id"],
        needState=a["needState"], sharedAttributes=shared,
        transferRiskPct=transfer_risk, recommendation=rec,
    ))

(OUT / "duplication.json").write_text(json.dumps(dup_pairs, indent=2))

# ---------------------------------------------------------------
# 5. Financial impact bridge + transfer assumptions
# ---------------------------------------------------------------
current_margin = sum(s["salesValueGBP"] * s["tradingMarginPct"] for s in confirmed)
delisted = [s for s in confirmed if s["scorecard"]["decision"] == "Delist"]
delist_margin = sum(s["salesValueGBP"] * s["tradingMarginPct"] for s in delisted)

TRANSFER_TO_RETAINED = 0.65
TRANSFER_TO_NPD = 0.20
GENUINE_LOSS = 0.15

substitution_effect = round(delist_margin * TRANSFER_TO_RETAINED)
new_lines_added = round(delist_margin * TRANSFER_TO_NPD * 1.6)  # NPD assumed slightly margin-accretive
higher_sales_density = round(current_margin * 0.018)  # space reallocation uplift on retained lines
proposed_margin = round(current_margin - delist_margin + substitution_effect + new_lines_added + higher_sales_density)

bridge = [
    {"label": "Current range", "valueGBP": round(current_margin), "type": "total"},
    {"label": "Delists", "valueGBP": -round(delist_margin), "type": "negative"},
    {"label": "Substitution effect", "valueGBP": substitution_effect, "type": "positive"},
    {"label": "New lines added", "valueGBP": new_lines_added, "type": "positive"},
    {"label": "Higher sales density", "valueGBP": higher_sales_density, "type": "positive"},
    {"label": "New proposed range", "valueGBP": proposed_margin, "type": "total"},
]
(OUT / "financial-bridge.json").write_text(json.dumps(bridge, indent=2))

assumptions = [
    {"scenario": "Conservative", "transferToRetainedPct": 50, "transferToNpdPct": 15, "genuineLossPct": 35},
    {"scenario": "Base", "transferToRetainedPct": 65, "transferToNpdPct": 20, "genuineLossPct": 15},
    {"scenario": "Aggressive", "transferToRetainedPct": 78, "transferToNpdPct": 17, "genuineLossPct": 5},
]
(OUT / "sales-transfer-assumptions.json").write_text(json.dumps(assumptions, indent=2))

# ---------------------------------------------------------------
# 6. Planogram allocation (need-state x store format)
# ---------------------------------------------------------------
FORMAT_SPACE = {"Hypermarket": 1057, "Supermarket": 684, "Metro": 287, "Small": 140}
needstate_sales = defaultdict(float)
for s in confirmed:
    needstate_sales[s["needState"]] += s["salesValueGBP"]
total_sales_confirmed = sum(needstate_sales.values())

planogram = []
for fmt, space in FORMAT_SPACE.items():
    for ns, ns_sales in needstate_sales.items():
        target_share = ns_sales / total_sales_confirmed
        variance = random.uniform(0.75, 1.22)
        allocated = round(space * target_share * variance)
        index_pct = round(variance * 100)
        planogram.append(dict(
            needState=ns, storeFormat=fmt,
            spaceAllocatedCm=max(4, allocated), spaceIndexPct=index_pct,
        ))
(OUT / "planogram.json").write_text(json.dumps(planogram, indent=2))

# ---------------------------------------------------------------
# 7. Current Range baseline (pre-cleansing, all 108 raw SKUs)
# ---------------------------------------------------------------
raw_sorted = sorted(skus, key=lambda s: -s["salesValueGBP"])
total_raw_sales = sum(s["salesValueGBP"] for s in skus)
quartile_cut = len(skus) // 4

def sales_rank_quartile(idx):
    # idx 0 = highest seller. Q1 (0-25%) = lowest risk .. Q4 (75-100%) = highest risk
    return min(4, idx // quartile_cut + 1)

rank_by_id = {s["id"]: i for i, s in enumerate(raw_sorted)}

baseline_groups = defaultdict(list)
for s in skus:
    baseline_groups[(s["needState"], s["portionFormat"])].append(s)

current_range_rows = []
for (ns, portion), members in baseline_groups.items():
    count = len(members)
    sales = sum(m["salesValueGBP"] for m in members)
    ros_avg = round(statistics.mean(m["rateOfSalePerStorePerWeekGBP"] for m in members), 1)
    quartiles = [sales_rank_quartile(rank_by_id[m["id"]]) for m in members]
    risk_quartile = round(statistics.mean(quartiles), 1)
    long_tail_pct = round(sum(1 for q in quartiles if q == 4) / count * 100)
    current_range_rows.append(dict(
        needState=ns, portionFormat=portion, skuCount=count,
        salesValueGBP=round(sales), rateOfSalePerStorePerWeekGBP=ros_avg,
        riskQuartile=risk_quartile, longTailPct=long_tail_pct,
    ))
(OUT / "current-range-baseline.json").write_text(json.dumps(current_range_rows, indent=2))

# Pareto bands off the same raw 108, cumulative-sales ranked
bands_def = [20, 30, 50, 70, 80, 90, 100]
band_labels = ["0\u201320%", "21\u201330%", "31\u201350%", "51\u201370%", "71\u201380%", "81\u201390%", "91\u2013100%"]
cum_sales, cum_skus = 0.0, 0
prev_cut = 0.0
pareto = []
running_sales_idx = 0
for label, cut in zip(band_labels, bands_def):
    band_skus, band_sales = 0, 0.0
    target_cum_sales = total_raw_sales * cut / 100
    while running_sales_idx < len(raw_sorted) and cum_sales < target_cum_sales:
        s = raw_sorted[running_sales_idx]
        cum_sales += s["salesValueGBP"]
        band_sales += s["salesValueGBP"]
        band_skus += 1
        running_sales_idx += 1
    pareto.append(dict(
        band=label,
        pctOfSkus=round(band_skus / len(raw_sorted) * 100),
        pctOfSales=round(band_sales / total_raw_sales * 100),
        salesPerSkuGBP=round(band_sales / max(band_skus, 1)),
    ))
(OUT / "pareto-bands.json").write_text(json.dumps(pareto, indent=2))

# ---------------------------------------------------------------
print(f"SKUs: {len(skus)} raw / {len(confirmed)} confirmed")
print(f"Current margin: £{current_margin:,.0f}  ->  Proposed margin: £{proposed_margin:,.0f}")
print(f"Delists: {len(delisted)}  Duplicate pairs: {len(dup_pairs)}")
print(f"Wrote {len(list(OUT.glob('*.json')))} files to {OUT}")
