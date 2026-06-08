import { cn } from "@/lib/utils";
import {
  appEyebrowClass,
  appPanelBodyClass,
  appPanelBodyLgClass,
  appPanelClass,
  appPanelHeaderClass,
  appPanelSubtleClass,
  appSectionLabelClass,
} from "@/lib/appUi";

export const mbPanelClass = cn(appPanelClass, "w-full max-w-none");
export const mbPanelSubtleClass = cn(appPanelSubtleClass, "w-full max-w-none");
export const mbPanelHeaderClass = appPanelHeaderClass;
export const mbPanelBodyClass = appPanelBodyClass;
export const mbPanelBodyLgClass = appPanelBodyLgClass;
export const mbEyebrowClass = appEyebrowClass;
export const mbSectionLabelClass = appSectionLabelClass;

export const mbPageGridClass =
  "grid grid-cols-1 gap-8";

export const mbScanColumnClass = "flex min-w-0 flex-col gap-8";

export const mbWatchlistStickyClass = "";

export function mbHeroShellClass(
  tone: "favorable" | "cautious" | "neutral",
): string {
  switch (tone) {
    case "favorable":
      return "border-l-2 border-l-success bg-success/[0.035]";
    case "cautious":
      return "border-l-2 border-l-warning bg-warning-muted/20";
    default:
      return "border-l-2 border-l-border bg-muted-bg/20";
  }
}

export function mbStatusPillClass(
  kind: "approved" | "caution" | "rejected" | "neutral",
): string {
  const base =
    "inline-flex shrink-0 items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
  switch (kind) {
    case "approved":
      return cn(base, "bg-success/15 text-success");
    case "caution":
      return cn(base, "bg-warning-muted text-amber-900 dark:text-amber-100");
    case "rejected":
      return cn(base, "bg-danger/10 text-danger");
    default:
      return cn(base, "bg-muted-bg text-muted");
  }
}

export const mbStatTileClass =
  "min-w-0 bg-muted-bg/35 px-3 py-3";

export const mbMetricTileClass =
  "min-w-0 bg-muted-bg/35 px-3 py-3";

export const mbMetricLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-muted";

export const mbMetricValueClass =
  "mt-1 font-mono text-sm font-semibold tabular-nums text-foreground sm:text-base";

export const mbOpportunityCardClass =
  "border-t border-border/60 py-4 transition-colors first:border-t-0 first:pt-0 last:pb-0";

export const mbOpportunityCardApprovedClass =
  "border-t border-success/20 bg-success/[0.025] px-3 py-4 transition-colors first:border-t-0 first:pt-3 last:pb-3";

export const mbInsetListClass =
  "divide-y divide-border/50 overflow-hidden border-t border-border/60 p-0";

export const mbInsetRowClass =
  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-muted-bg/50";

export const mbChipClass =
  "inline-flex items-center gap-1.5 bg-muted-bg/45 px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition hover:bg-accent-muted/30 hover:text-accent-strong";
