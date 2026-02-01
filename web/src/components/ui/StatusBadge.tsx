import { clsx } from "clsx";
import { BoardStatus } from "@/types";

interface StatusBadgeProps {
  status: BoardStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white",
      )}
      style={{ backgroundColor: status.color }}
    >
      {status.name}
    </span>
  );
}
