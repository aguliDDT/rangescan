import clsx from "clsx";
import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-surface p-5 shadow-sm",
        className,
      )}
    >
      {title && (
        <h3 className="mb-4 text-sm font-bold text-ink">{title}</h3>
      )}
      {children}
    </div>
  );
}
