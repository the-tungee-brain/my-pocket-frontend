"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { BarChart3, ChevronRight, Lock } from "lucide-react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { wheelBacktestPath } from "@/lib/wheelBacktestRoutes";
import { hasProFeature } from "@/lib/planFeatures";
import {
  appCalloutClass,
  appIconBoxClass,
  appSectionLabelClass,
} from "@/lib/appUi";
import { cn } from "@/lib/utils";

type Props = {
  symbols: string[];
  className?: string;
};

export function WheelBacktestPlaybookLink({ symbols, className }: Props) {
  const { data: session } = useSession();
  const { isPaid, plan } = useAccountPlan(session?.accessToken);
  const allowed = hasProFeature(isPaid, "wheelBacktest", plan);
  const choices = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];

  if (choices.length === 0) {
    return null;
  }

  return (
    <div className={cn(appCalloutClass, "min-h-0", className)}>
      <div className="flex items-start gap-3">
        <div className={appIconBoxClass}>
          <BarChart3 className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className={appSectionLabelClass}>Historical backtest</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            Run a full chart and trade log on the symbol&apos;s research page —
            same delta band and DTE as your wheel settings.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((ticker) =>
          allowed ? (
            <Link
              key={ticker}
              href={wheelBacktestPath(ticker, { years: 5, run: true })}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-accent-muted/50 px-3 text-xs font-medium text-accent-strong transition hover:bg-accent-muted/70"
            >
              {choices.length === 1 ? "Open backtest" : `Backtest ${ticker}`}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : (
            <Link
              key={ticker}
              href="/settings?tab=account"
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-muted-bg px-3 text-xs font-medium text-muted transition hover:text-foreground"
            >
              <Lock className="h-3 w-3" aria-hidden />
              {choices.length === 1 ? "Backtest (Pro)" : `${ticker} · Pro`}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
