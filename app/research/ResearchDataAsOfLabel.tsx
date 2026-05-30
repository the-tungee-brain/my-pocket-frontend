"use client";

import { useResearchDataAsOf } from "@/app/research/ResearchOverviewContext";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function ResearchDataAsOfLabel({ className }: Props) {
  const asOf = useResearchDataAsOf();

  return (
    <FreshnessLabel
      dataAsOf={asOf}
      variant="inline"
      className={cn(className)}
    />
  );
}
