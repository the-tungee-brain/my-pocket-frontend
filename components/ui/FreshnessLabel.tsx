"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { formatResearchDataAsOf } from "@/lib/formatDataAsOf";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { cn } from "@/lib/utils";

type FreshnessLabelProps = {
  /** Epoch ms — shows “Updated X ago”. */
  updatedAt?: number | null;
  /** ISO timestamp — shows “Data as of …”. */
  dataAsOf?: string | null;
  pending?: boolean;
  pendingLabel?: string;
  variant?: "inline" | "badge";
  className?: string;
};

export function FreshnessLabel({
  updatedAt = null,
  dataAsOf = null,
  pending = false,
  pendingLabel = "Updating…",
  variant = "inline",
  className,
}: FreshnessLabelProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!updatedAt || pending) return;
    const id = window.setInterval(() => tick((value) => value + 1), 60_000);
    return () => window.clearInterval(id);
  }, [updatedAt, pending]);

  let label: string | null = null;

  if (pending) {
    label = pendingLabel;
  } else if (dataAsOf) {
    const formatted = formatResearchDataAsOf(dataAsOf);
    label = formatted ? `Data as of ${formatted}` : null;
  } else if (updatedAt != null) {
    label = formatRelativeUpdatedAt(updatedAt);
  }

  if (!label) return null;

  const baseClass =
    variant === "badge"
      ? "inline-flex items-center gap-1 rounded-full border border-border bg-muted-bg/60 px-2 py-0.5 font-mono text-[10px] text-muted"
      : "inline-flex items-center gap-1 text-[11px] text-muted";

  return (
    <span className={cn(baseClass, className)}>
      {pending ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}
