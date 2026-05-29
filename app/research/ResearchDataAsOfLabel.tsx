"use client";

import { useResearchDataAsOf } from "@/app/research/ResearchOverviewContext";
import { formatResearchDataAsOf } from "@/lib/formatDataAsOf";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function ResearchDataAsOfLabel({ className }: Props) {
  const asOf = useResearchDataAsOf();
  const label = formatResearchDataAsOf(asOf);
  if (!label) return null;

  return (
    <p className={cn("text-[11px] text-muted", className)}>
      Data as of {label}
    </p>
  );
}
