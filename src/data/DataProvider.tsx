import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  CdtNode,
  CurrentRangeRow,
  DuplicatePair,
  FinancialBridgeStep,
  ParetoBand,
  PlanogramAllocation,
  SalesTransferAssumption,
  ScorecardWeightConfig,
  Sku,
} from "../types/schema";

interface RangeScanData {
  skus: Sku[];
  scorecardWeights: ScorecardWeightConfig;
  cdt: CdtNode[];
  duplication: DuplicatePair[];
  financialBridge: FinancialBridgeStep[];
  salesTransferAssumptions: SalesTransferAssumption[];
  planogram: PlanogramAllocation[];
  currentRangeBaseline: CurrentRangeRow[];
  paretoBands: ParetoBand[];
}

type DataState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ready"; data: RangeScanData };

const DataContext = createContext<DataState>({ status: "loading" });

const FILES: Record<keyof RangeScanData, string> = {
  skus: "skus.json",
  scorecardWeights: "scorecard-weights.json",
  cdt: "cdt.json",
  duplication: "duplication.json",
  financialBridge: "financial-bridge.json",
  salesTransferAssumptions: "sales-transfer-assumptions.json",
  planogram: "planogram.json",
  currentRangeBaseline: "current-range-baseline.json",
  paretoBands: "pareto-bands.json",
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const entries = Object.entries(FILES) as [keyof RangeScanData, string][];
        const results = await Promise.all(
          entries.map(async ([key, file]) => {
            const res = await fetch(`/data/${file}`);
            if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
            return [key, await res.json()] as const;
          }),
        );
        if (cancelled) return;
        const data = Object.fromEntries(results) as unknown as RangeScanData;
        setState({ status: "ready", data });
      } catch (err) {
        if (cancelled) return;
        setState({ status: "error", error: err instanceof Error ? err.message : String(err) });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData(): DataState {
  return useContext(DataContext);
}
