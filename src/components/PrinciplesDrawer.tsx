import clsx from "clsx";

export interface Principle {
  id: number;
  title: string;
  description: string;
}

export const RANGING_PRINCIPLES: Principle[] = [
  { id: 1, title: "Role in customer mission", description: "Mission/need-state served; strategic credibility products; market diamonds & growth spaces." },
  { id: 2, title: "Role in target range architecture", description: "GBB/price-ladder tier; branded vs. own-brand mix; alignment to value strategy." },
  { id: 3, title: "SKU performance (scorecard)", description: "Outperformance vs. comparable products; justifiable underperformance." },
  { id: 4, title: "Assortment duplication & transferability", description: "Same need served elsewhere; incrementality vs. substitution; sales-transfer risk." },
  { id: 5, title: "Operational complexity", description: "Case size/shelf life fit; waste/markdown; supplier risk; cost-to-serve." },
  { id: 6, title: "Range monetisation", description: "Supplier investment, JBP/solus terms, cost/margin improvement levers." },
  { id: 7, title: "Merchandising & ease-of-shop", description: "Brand blocking, GBB navigation, need-state grouping, facings optimisation, macro/midi space fit." },
];

interface PrinciplesDrawerProps {
  open: boolean;
  onClose: () => void;
  focusIds?: number[];
}

export function PrinciplesDrawer({ open, onClose, focusIds = [] }: PrinciplesDrawerProps) {
  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-ink/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={clsx(
          "fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto bg-surface p-6 shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base">The 7 ranging principles</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-mute hover:text-ink"
          >
            Close
          </button>
        </div>
        <ol className="space-y-3">
          {RANGING_PRINCIPLES.map((p) => (
            <li
              key={p.id}
              className={clsx(
                "rounded-lg border border-border p-3",
                focusIds.includes(p.id) && "border-emerald bg-emerald/5",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-data text-xs font-bold text-text-mute">{p.id}</span>
                <span className="text-sm font-semibold text-ink">{p.title}</span>
              </div>
              <p className="mt-1 text-xs text-text-mute">{p.description}</p>
            </li>
          ))}
        </ol>
      </aside>
    </>
  );
}
