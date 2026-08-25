/**
 * RANGE/SCAN — data contract
 * ---------------------------------------------------------------
 * Every screen reads from the JSON files in /data, typed against
 * these interfaces. Don't let a component invent its own shape for
 * a number that already exists here — extend the interface instead.
 * The generator that produces /data lives at scripts/generate_seed_data.py.
 */

export type PortionFormat = "Big Pack" | "Multipack" | "Single Portion";
export type DietaryBase = "Dairy - Cow" | "Dairy - Goat/Sheep" | "Plant - Soya/Oat";
export type FlavourProfile = "Natural" | "Flavoured" | "Kids";
export type Attribute = "High Protein" | "Low Sugar" | "Standard";
export type NeedState =
  | "Everyday Family"
  | "Health & Fitness"
  | "Indulgent Treat"
  | "Kids Lunchbox"
  | "On-the-go";
export type BrandType = "Branded" | "Own Brand";
export type Decision = "Retain" | "Review" | "Delist";
export type SkuStatus = "confirmed" | "cleansed_out"; // cleansed_out = dropped at Stage 1 (dup/zero-sales)
export type StoreFormat = "Hypermarket" | "Supermarket" | "Metro" | "Small";
export type Scenario = "Conservative" | "Base" | "Aggressive";

export interface Sku {
  id: string;                    // "BR-014" / "OB-032"
  name: string;                  // "Branded – Product 14"
  brandType: BrandType;
  status: SkuStatus;             // confirmed = survives Stage 1 cleansing
  portionFormat: PortionFormat;
  dietaryBase: DietaryBase;
  flavourProfile: FlavourProfile;
  attribute: Attribute;
  needState: NeedState;          // CDT leaf this SKU rolls up to
  salesValueGBP: number;         // £ / 52 weeks
  salesVolumeUnits: number;
  tradingMarginPct: number;      // 0–1
  storesDistributed: number;
  storesTotal: number;           // denominator, currently fixed at 400
  rateOfSalePerStorePerWeekGBP: number;
  wastePct: number;              // 0–1
  caseSize: number;
  supplierRiskScore: number;     // 1 (low) – 5 (high)
  scorecard: {
    financialScore: number;      // 0–5
    operationalScore: number;    // 0–5
    weightedScore: number;       // 0–5, financial*0.6 + operational*0.4
    decision: Decision;          // >=3.4 Retain · 2.0–3.4 Review · <2.0 Delist
  };
}

export interface ScorecardWeightConfig {
  financial: { label: string; weightPct: number }[]; // sums to 60
  operational: { label: string; weightPct: number }[]; // sums to 40
}

export interface CdtNode {
  stage: number;                 // 1..5, matches the tree's column order
  stageLabel: string;            // "Portion format", "Dietary base", ...
  nodeLabel: string;             // "Big Pack", "Dairy - Cow", ...
  weightPct: number;             // split % within its stage
  isLeaf: boolean;               // true for Stage 5 need-state nodes
}

export interface DuplicatePair {
  id: string;
  skuIdA: string;
  skuIdB: string;
  needState: NeedState;
  sharedAttributes: string[];    // e.g. ["brand tier", "flavour", "pack size"]
  transferRiskPct: number;       // modelled % sales transfer if A or B delisted
  recommendation: string;        // short agent-style recommendation
}

export interface FinancialBridgeStep {
  label: string;
  valueGBP: number;              // absolute for "total" steps, delta for others
  type: "total" | "positive" | "negative";
}

export interface SalesTransferAssumption {
  scenario: Scenario;
  transferToRetainedPct: number;
  transferToNpdPct: number;
  genuineLossPct: number;        // the three should sum to 100
}

export interface PlanogramAllocation {
  needState: NeedState;
  storeFormat: StoreFormat;
  spaceAllocatedCm: number;
  spaceIndexPct: number;         // vs. sales-share target; 90–110 = aligned
}

export interface CurrentRangeRow {
  needState: NeedState;
  portionFormat: PortionFormat;
  skuCount: number;
  salesValueGBP: number;
  rateOfSalePerStorePerWeekGBP: number;
  riskQuartile: number;          // 1 (low risk) – 4 (high risk), avg
  longTailPct: number;           // % of SKUs in this group in bottom sales quartile
}

export interface ParetoBand {
  band: string;                  // "0–20%", "21–30%", ...
  pctOfSkus: number;
  pctOfSales: number;
  salesPerSkuGBP: number;
}
