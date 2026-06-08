"use client";

import {
  statusBadgeClass,
  statusBadgeLabel,
  statusBadgeTone,
} from "@/lib/momentumBreakoutAlertUi";
import { cn } from "@/lib/utils";

type Props = {
  status: string;
  className?: string;
};

export function AlertStatusBadge({ status, className }: Props) {
  const tone = statusBadgeTone(status);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        statusBadgeClass(tone),
        className,
      )}
    >
      {statusBadgeLabel(status)}
    </span>
  );
}
