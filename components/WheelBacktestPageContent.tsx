"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { BarChart3 } from "lucide-react";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import { WheelBacktestPanel } from "@/components/WheelBacktestPanel";
import { parseWheelBacktestSearchParams } from "@/lib/wheelBacktestRoutes";
import Link from "next/link";

type Props = {
  symbol: string;
};

export function WheelBacktestPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { profile } = useStrategyContext();
  const accessToken = session?.accessToken as string | undefined;

  const upperSymbol = symbol.trim().toUpperCase();
  const urlOptions = useMemo(
    () => parseWheelBacktestSearchParams(searchParams),
    [searchParams],
  );

  const wheel = profile?.wheel;
  const isWheel = profile?.primaryStrategy === "wheel";

  if (!accessToken) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted">
        Sign in to run a wheel backtest.
      </p>
    );
  }

  if (!isWheel) {
    return (
      <div className="rounded-xl border border-border/80 bg-secondary/20 px-4 py-5 text-sm">
        <p className="font-medium text-foreground">Wheel backtest</p>
        <p className="mt-2 text-muted">
          Historical wheel simulation is available when your primary strategy is
          the wheel. You can change that in settings.
        </p>
        <Link
          href="/settings?tab=strategy"
          className="mt-3 inline-flex text-sm font-medium text-accent-strong hover:underline"
        >
          Strategy settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <BarChart3 className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h1 className="text-base font-semibold text-foreground">
            Wheel backtest · {upperSymbol}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            One cash-secured put contract at a time using your wheel delta band
            {wheel?.targetDeltaMin != null && wheel?.targetDeltaMax != null
              ? ` (${wheel.targetDeltaMin.toFixed(2)}–${wheel.targetDeltaMax.toFixed(2)})`
              : ""}{" "}
            and ~30 trading-day DTE. Model premiums — not live option quotes.
          </p>
        </div>
      </div>

      <WheelBacktestPanel
        accessToken={accessToken}
        symbols={[upperSymbol]}
        fixedSymbol={upperSymbol}
        targetDeltaMin={wheel?.targetDeltaMin}
        targetDeltaMax={wheel?.targetDeltaMax}
        dteDays={30}
        defaultYears={urlOptions.years ?? 5}
        defaultMaintainOneLot={urlOptions.maintainOneLot ?? true}
        defaultCallStrikeMode={urlOptions.callStrikeMode ?? "delta"}
        autoRun={urlOptions.autoRun}
        variant="research"
      />
    </div>
  );
}
