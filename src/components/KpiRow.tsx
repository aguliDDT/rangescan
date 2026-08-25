export interface Kpi {
  label: string;
  value: string;
  sub?: string;
}

export function KpiRow({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="text-xs font-medium text-text-mute">{kpi.label}</div>
          <div className="mt-1 font-data text-xl font-semibold text-ink">
            {kpi.value}
          </div>
          {kpi.sub && (
            <div className="mt-0.5 text-xs text-text-mute">{kpi.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
