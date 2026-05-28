"use client";

import { useMemo } from "react";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import {
  isOnStrategyPlaybook,
  symbolStatusForSymbol,
} from "@/lib/strategyPlaybook";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
};

export function StrategySymbolBadge({ symbol, className }: Props) {
  const { profile, recommendations } = useStrategyContext();

  const upperSymbol = symbol.toUpperCase();
  const onPlaybook = useMemo(
    () => isOnStrategyPlaybook(profile, upperSymbol),
    [profile, upperSymbol],
  );
  const status = useMemo(
    () => symbolStatusForSymbol(recommendations, upperSymbol),
    [recommendations, upperSymbol],
  );

  if (!onPlaybook || !profile?.primaryStrategy) return null;

  const label = status?.statusLabel ?? "On your playbook";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-accent/30 bg-accent-muted/40 px-2 py-0.5 text-[10px] font-medium text-accent-strong",
        className,
      )}
    >
      {label}
    </span>
  );
}
