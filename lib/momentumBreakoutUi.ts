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
  "grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:items-start";

export const mbScanColumnClass = "flex min-w-0 flex-col gap-5";

export const mbWatchlistStickyClass = "xl:sticky xl:top-20";

export function mbHeroShellClass(
  tone: "favorable" | "cautious" | "neutral",
): string {
  switch (tone) {
    case "favorable":
      return "border-l-4 border-l-success/70 bg-gradient-to-br from-success/[0.07] via-transparent to-transparent";
    case "cautious":
      return "border-l-4 border-l-warning/70 bg-gradient-to-br from-warning-muted/30 via-transparent to-transparent";
    default:
      return "border-l-4 border-l-border bg-gradient-to-br from-muted-bg/40 via-transparent to-transparent";
  }
}

export function mbStatusPillClass(
  kind: "approved" | "caution" | "rejected" | "neutral",
): string {
  const base =
    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";
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
  "rounded-xl border border-border/70 bg-background/50 px-3 py-2.5";

export const mbMetricTileClass =
  "min-w-0 rounded-lg border border-border/60 bg-background/55 px-3 py-2.5";

export const mbMetricLabelClass =
  "text-[10px] font-semibold uppercase tracking-wide text-muted";

export const mbMetricValueClass =
  "mt-1 font-mono text-sm font-semibold tabular-nums text-foreground sm:text-base";

export const mbOpportunityCardClass =
  "rounded-lg border border-border/70 bg-background/40 p-3.5 transition-colors hover:border-border";

export const mbOpportunityCardApprovedClass =
  "rounded-lg border border-success/20 bg-success/[0.04] p-3.5 transition-colors hover:border-success/35";

export const mbInsetListClass =
  "app-inset divide-y divide-border/60 overflow-hidden p-0";

export const mbInsetRowClass =
  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-muted-bg/50";

export const mbChipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition hover:border-accent/40 hover:bg-accent-muted/30";
