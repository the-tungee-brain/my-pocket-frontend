"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ArrowRight, BarChart3 } from "lucide-react";
import { usePositionsContext } from "@/app/Providers";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import type { StrategyNextAction } from "@/app/types/strategy";
import { PlaybookActionButtons } from "@/components/PlaybookActionButtons";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import {
  formatStrategyPlaybookTitle,
  isOnStrategyPlaybook,
  playbookActionAskable,
  playbookHoldBadge,
  symbolStatusForSymbol,
} from "@/lib/strategyPlaybook";
import { wheelBacktestPath } from "@/lib/wheelBacktestRoutes";
import { scrollToChat } from "@/lib/scrollToChat";
import { symbolChatKey } from "@/lib/chatKeys";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
};

export function StrategySymbolPlaybookStrip({ symbol, className }: Props) {
  const { profile, recommendations } = useStrategyContext();
  const { sendPlaybookAsk } = usePositionsContext();
  const { connect, connecting } = useSchwabConnect();

  const upperSymbol = symbol.trim().toUpperCase();
  const onPlaybook = isOnStrategyPlaybook(profile, upperSymbol);

  const handleRunAction = useCallback(
    (action: StrategyNextAction) => {
      if (!playbookActionAskable(action) || !profile?.primaryStrategy) return;
      const chatKey = symbolChatKey(upperSymbol) ?? upperSymbol;
      void sendPlaybookAsk({
        activeChatKey: chatKey,
        action,
        strategy: profile.primaryStrategy,
      });
      scrollToChat();
    },
    [upperSymbol, sendPlaybookAsk, profile?.primaryStrategy],
  );

  if (!onPlaybook || !profile?.primaryStrategy) {
    return null;
  }

  const status = symbolStatusForSymbol(recommendations, upperSymbol);
  const nextAction = status?.nextAction ?? null;
  const showBacktestLink = profile.primaryStrategy === "wheel";

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-muted-bg/40 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            On your playbook
          </p>
          <p className="mt-0.5 text-xs font-medium text-foreground">
            {status?.statusLabel ?? "Tracking this symbol"}
            {status ? ` · ${playbookHoldBadge(status)}` : ""}
          </p>
          {nextAction && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
              {nextAction.title}. {nextAction.reason}
            </p>
          )}
        </div>
        <Link
          href="/portfolio"
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-accent-strong hover:underline"
        >
          Full playbook
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      {nextAction && (
        <div className="mt-2.5">
          <PlaybookActionButtons
            action={nextAction}
            onRunAction={handleRunAction}
            onConnectSchwab={() => void connect()}
            connectingSchwab={connecting}
            size="sm"
          />
        </div>
      )}

      {!nextAction && (
        <p className="mt-1.5 text-[11px] text-muted">
          {formatStrategyPlaybookTitle(profile.primaryStrategy)} — open Portfolio
          for next steps across all symbols.
        </p>
      )}

      {showBacktestLink && (
        <Link
          href={wheelBacktestPath(upperSymbol, { years: 5, run: true })}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-strong hover:underline"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          Wheel backtest
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      )}
    </section>
  );
}
