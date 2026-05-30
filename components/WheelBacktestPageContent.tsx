"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { WheelBacktestPanel } from "@/components/WheelBacktestPanel";
import { Card, CardBody } from "@/components/ui/Card";
import { hasProFeature } from "@/lib/planFeatures";
import { parseWheelBacktestSearchParams } from "@/lib/wheelBacktestRoutes";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
};

export function WheelBacktestPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const { profile } = useStrategyContext();
  const { plan } = useAccountPlan(session?.accessToken);
  const backtestAllowed = hasProFeature(plan, "wheelBacktest");
  const accessToken = session?.accessToken as string | undefined;

  const upperSymbol = symbol.trim().toUpperCase();
  const urlOptions = useMemo(
    () => parseWheelBacktestSearchParams(searchParams),
    [searchParams],
  );

  const wheel = profile?.wheel;
  const isWheel = profile?.primaryStrategy === "wheel";

  const pageDescription = useMemo(() => {
    const band =
      wheel?.targetDeltaMin != null && wheel?.targetDeltaMax != null
        ? ` (${wheel.targetDeltaMin.toFixed(2)}–${wheel.targetDeltaMax.toFixed(2)})`
        : "";
    return `One cash-secured put contract at a time using your wheel delta band${band} and your chosen DTE. Model premiums — not live option quotes.`;
  }, [wheel?.targetDeltaMin, wheel?.targetDeltaMax]);

  if (!accessToken) {
    return (
      <Card className={pageSectionClass}>
        <CardBody className="text-sm text-muted">
          Sign in to run a wheel backtest.
        </CardBody>
      </Card>
    );
  }

  if (!isWheel) {
    return (
      <Card className={pageSectionClass}>
        <CardBody className="space-y-3 text-sm">
          <p className="font-medium text-foreground">Wheel backtest</p>
          <p className="text-muted">
            Historical wheel simulation is available when your primary strategy is
            the wheel. You can change that in settings.
          </p>
          <Link
            href="/settings?tab=strategy"
            className="inline-flex font-medium text-accent-strong hover:underline"
          >
            Strategy settings
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={cn(appStackClass, pageSectionClass)}>
      <ProFeatureGate feature="wheelBacktest" allowed={backtestAllowed}>
        <WheelBacktestPanel
          accessToken={accessToken}
          symbols={[upperSymbol]}
          fixedSymbol={upperSymbol}
          targetDeltaMin={wheel?.targetDeltaMin}
          targetDeltaMax={wheel?.targetDeltaMax}
          defaultYears={urlOptions.years ?? 5}
          {...(urlOptions.dteDays != null
            ? { defaultDteDays: urlOptions.dteDays }
            : {})}
          defaultMaintainOneLot={urlOptions.maintainOneLot ?? true}
          defaultCallStrikeMode={urlOptions.callStrikeMode ?? "delta"}
          autoRun={backtestAllowed ? urlOptions.autoRun : false}
          variant="research"
          pageTitle={`Wheel backtest · ${upperSymbol}`}
          pageDescription={pageDescription}
        />
      </ProFeatureGate>
    </div>
  );
}
