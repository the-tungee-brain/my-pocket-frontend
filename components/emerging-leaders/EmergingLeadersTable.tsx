"use client";

import type { EmergingLeaderItem } from "@/app/types/emergingLeaders";
import { Badge } from "@/components/ui/Badge";
import {
  listRowSubtitle,
  rankLabel,
  setupScoreTone,
  stageBadgeVariant,
} from "@/lib/emergingLeaders";
import {
  moversRankedListLabelClass,
  moversRankedRowButtonClass,
  moversRankedRowHoverClass,
  moversRankedRowSelectedClass,
} from "@/lib/moversUi";
import { cn } from "@/lib/utils";

type Props = {
  items: EmergingLeaderItem[];
  selectedSymbol: string | null;
  onSelect: (symbol: string) => void;
  companyNames?: Record<string, string>;
};

export function EmergingLeadersTable({
  items,
  selectedSymbol,
  onSelect,
  companyNames = {},
}: Props) {
  return (
    <div className="app-panel overflow-hidden">
      <p className={moversRankedListLabelClass}>Ranked list</p>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const sym = item.symbol.toUpperCase();
          const selected = selectedSymbol === sym;
          const name = companyNames[sym];
          const scoreTone = setupScoreTone(item.setupQualityScore);

          return (
            <li key={sym}>
              <button
                type="button"
                onClick={() => onSelect(sym)}
                className={cn(
                  moversRankedRowButtonClass,
                  selected ? moversRankedRowSelectedClass : moversRankedRowHoverClass,
                )}
                aria-current={selected ? "true" : undefined}
              >
                <span className="w-8 shrink-0 pt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {rankLabel(item.rank)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-mono text-sm font-semibold text-foreground">
                    {sym}
                  </span>
                  <span className="block text-xs text-muted">
                    {listRowSubtitle(item)}
                  </span>
                  {name ? (
                    <span className="block truncate text-xs text-muted">
                      {name}
                    </span>
                  ) : null}
                  <span className="mt-1 block font-mono text-[11px] text-muted">
                    Setup {item.setupQualityScore}/100 · CV{" "}
                    {item.compressionVelocity}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge variant={stageBadgeVariant(item.setupStage)}>
                    {item.setupStage === "BREAKOUT_WATCH"
                      ? "Watch"
                      : item.setupStage === "TIGHTENING"
                        ? "Tight"
                        : item.setupStage === "BASE_BUILDING"
                          ? "Base"
                          : item.setupStage === "BREAKOUT_TRIGGERED"
                            ? "Triggered"
                            : "Extended"}
                  </Badge>
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold tabular-nums",
                      scoreTone === "positive" && "text-success",
                      scoreTone === "warning" && "text-accent-highlight",
                      scoreTone === "negative" && "text-danger",
                      scoreTone === "default" && "text-foreground",
                    )}
                  >
                    {item.setupQualityScore}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
