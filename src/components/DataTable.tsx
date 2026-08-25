import clsx from "clsx";
import { useMemo, useState } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: (row: T) => string | number;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  /** Renders the cell as a red/amber/green score chip instead of plain text. */
  scoreCell?: (row: T) => { label: string; tone: "emerald" | "amber" | "red" };
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

const TONE_CLASSES: Record<"emerald" | "amber" | "red", string> = {
  emerald: "bg-emerald/10 text-emerald",
  amber: "bg-amber/10 text-amber",
  red: "bg-red/10 text-red",
};

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const av = column.accessor(a);
      const bv = column.accessor(b);
      if (av < bv) return -1 * sort.dir;
      if (av > bv) return 1 * sort.dir;
      return 0;
    });
  }, [rows, sort, columns]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 1 };
      if (prev.dir === 1) return { key, dir: -1 };
      return null;
    });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "px-3 py-2 text-xs font-semibold uppercase tracking-wide text-text-mute",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  !col.align && "text-left",
                  col.sortable && "cursor-pointer select-none",
                )}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                {col.header}
                {sort?.key === col.key && (sort.dir === 1 ? " ▲" : " ▼")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-0">
              {columns.map((col) => {
                const score = col.scoreCell?.(row);
                return (
                  <td
                    key={col.key}
                    className={clsx(
                      "px-3 py-2 font-data",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      !col.align && "text-left",
                    )}
                  >
                    {score ? (
                      <span
                        className={clsx(
                          "inline-block w-11 rounded-md py-0.5 text-center font-semibold",
                          TONE_CLASSES[score.tone],
                        )}
                      >
                        {score.label}
                      </span>
                    ) : (
                      col.accessor(row)
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
