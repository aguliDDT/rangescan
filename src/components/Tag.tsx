import clsx from "clsx";
import type { Decision } from "../types/schema";

export type ProgressStatus = "Complete" | "In progress" | "Pending";
export type TagValue = Decision | ProgressStatus;

const TAG_STYLES: Record<TagValue, string> = {
  Retain: "bg-emerald/10 text-emerald",
  Review: "bg-amber/10 text-amber",
  Delist: "bg-red/10 text-red",
  Complete: "bg-emerald/10 text-emerald",
  "In progress": "bg-amber/10 text-amber",
  Pending: "bg-text-mute/10 text-text-mute",
};

export function Tag({ value, className }: { value: TagValue; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-data text-xs font-semibold",
        TAG_STYLES[value],
        className,
      )}
    >
      {value}
    </span>
  );
}
