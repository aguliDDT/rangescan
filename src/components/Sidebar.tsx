import clsx from "clsx";
import { NavLink } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  stageNumber?: number;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Overview" },
  { to: "/current-range", label: "Current Range" },
  { to: "/ingest", label: "Ingest & Cleanse", stageNumber: 1 },
  { to: "/decision-trees", label: "Decision Trees", stageNumber: 2 },
  { to: "/scorecard", label: "Scorecard", stageNumber: 3 },
  { to: "/duplication", label: "Duplication", stageNumber: 4 },
  { to: "/financial-impact", label: "Financial Impact", stageNumber: 5 },
  { to: "/planogram", label: "Planogram", stageNumber: 6 },
];

export function Sidebar() {
  return (
    <nav className="flex h-full w-64 flex-col gap-1 bg-pine p-4">
      <div className="mb-4 px-2">
        <div className="font-display text-base font-semibold text-white">
          RANGE/SCAN
        </div>
        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald/70">
          Northgate Grocery
        </div>
      </div>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-emerald/15 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white",
            )
          }
        >
          {item.stageNumber !== undefined && (
            <span className="font-data text-xs text-white/40">
              {item.stageNumber}
            </span>
          )}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
