"use client";

import Link from "next/link";
import type { StrategyNextAction } from "@/app/types/strategy";
import {
  playbookActionAskable,
  playbookActionSecondary,
} from "@/lib/strategyPlaybook";
import { cn } from "@/lib/utils";

type Props = {
  action: StrategyNextAction;
  onRunAction?: (action: StrategyNextAction) => void;
  onConnectSchwab?: () => void;
  connectingSchwab?: boolean;
  size?: "sm" | "md";
  className?: string;
};

const buttonClass =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition";

export function PlaybookActionButtons({
  action,
  onRunAction,
  onConnectSchwab,
  connectingSchwab = false,
  size = "md",
  className,
}: Props) {
  const secondary = playbookActionSecondary(action);
  const askable = playbookActionAskable(action);
  const symbol = action.symbol?.trim().toUpperCase();
  const compact = size === "sm";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {askable && onRunAction && (
        <button
          type="button"
          onClick={() => onRunAction(action)}
          className={cn(
            buttonClass,
            "border-accent/30 bg-accent-muted/40 text-accent-strong hover:bg-accent-muted/60",
            compact && "px-2 py-0.5 text-[10px]",
          )}
        >
          Ask AI{symbol ? ` about ${symbol}` : ""}
        </button>
      )}

      {secondary?.kind === "connect" && onConnectSchwab && (
        <button
          type="button"
          onClick={onConnectSchwab}
          disabled={connectingSchwab}
          className={cn(
            buttonClass,
            "border-accent/30 bg-accent-muted/40 text-accent-strong hover:bg-accent-muted/60 disabled:opacity-60",
            compact && "px-2 py-0.5 text-[10px]",
          )}
        >
          {connectingSchwab ? "Connecting…" : secondary.label}
        </button>
      )}

      {secondary?.kind === "settings" && (
        <Link
          href="/settings?tab=strategy"
          className={cn(
            buttonClass,
            "border-border bg-background text-foreground hover:border-accent/40",
            compact && "px-2 py-0.5 text-[10px]",
          )}
        >
          {secondary.label}
        </Link>
      )}

      {secondary?.kind === "link" && (
        <Link
          href={secondary.href}
          className={cn(
            buttonClass,
            "border-border bg-background text-foreground hover:border-accent/40",
            compact && "px-2 py-0.5 text-[10px]",
          )}
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
