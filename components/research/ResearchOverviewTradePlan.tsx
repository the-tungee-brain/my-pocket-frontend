"use client";

import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import type {
  TraderPlaybookBestSetup,
  TraderPlaybookResponse,
  TraderPlaybookSide,
  TraderPlaybookStatus,
} from "@/app/types/research";
import {
  ResearchMetricList,
  ResearchRow,
  ResearchSection,
} from "@/components/research/ResearchMemoPrimitives";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  symbol: string;
  accessToken?: string | null;
  className?: string;
};

const STATUS_LABEL: Record<TraderPlaybookStatus, string> = {
  Valid: "Setup active",
  Waiting: "No trigger yet",
  Invalid: "Setup invalidated",
  NoSetup: "No clean trade plan",
};

const SETUP_LABEL: Record<TraderPlaybookBestSetup, string> = {
  BreakoutContinuation: "Breakout continuation",
  PullbackToSupport: "Pullback to support",
  FailedBreakout: "Failed breakout",
  RangeDay: "Range day",
  TrendContinuation: "Trend continuation",
  None: "None",
};

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function formatR(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}R`;
}

function sideLabel(side: TraderPlaybookSide | undefined): string {
  if (side === "Short") return "Short setup";
  if (side === "Long") return "Long setup";
  return "No trade setup";
}

function firstLine(values: string[]): string | null {
  return values.map((value) => value.trim()).find(Boolean) ?? null;
}

function hasTradeLevels(data: TraderPlaybookResponse): boolean {
  return (
    typeof data.levels.entry === "number" &&
    Number.isFinite(data.levels.entry) &&
    typeof data.levels.stop === "number" &&
    Number.isFinite(data.levels.stop) &&
    ((typeof data.levels.target1 === "number" &&
      Number.isFinite(data.levels.target1)) ||
      (typeof data.levels.target2 === "number" &&
        Number.isFinite(data.levels.target2)))
  );
}

function planSummary(data: TraderPlaybookResponse): string {
  if (data.status === "Valid") {
    return data.side === "Short"
      ? "A short setup is active with defined risk."
      : "A setup is active with defined risk.";
  }
  if (data.status === "Waiting") {
    return (
      firstLine(data.conditions.validIf) ?? "Waiting for a cleaner trigger."
    );
  }
  if (data.status === "Invalid") {
    return (
      firstLine(data.conditions.invalidIf) ??
      "The current setup has been invalidated."
    );
  }
  return (
    data.warnings[0] ??
    firstLine(data.conditions.invalidIf) ??
    "No clean trade plan is available."
  );
}

function TradePlanSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-4 w-44" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
  );
}

export function ResearchOverviewTradePlan({
  symbol,
  accessToken,
  className,
}: Props) {
  const { traderPlaybook, isLoading, error } = useTraderPlaybook(
    symbol,
    accessToken ?? undefined,
  );

  if (isLoading && !traderPlaybook) {
    return (
      <ResearchSection title="Trade Plan" className={className}>
        <TradePlanSkeleton />
      </ResearchSection>
    );
  }

  if (error && !traderPlaybook) {
    return (
      <ResearchSection title="Trade Plan" className={className}>
        <ErrorBanner message={error} />
      </ResearchSection>
    );
  }

  if (!traderPlaybook) {
    return (
      <ResearchSection title="Trade Plan" className={className}>
        <p className="text-sm text-muted">Trade plan is not available.</p>
      </ResearchSection>
    );
  }

  const trigger = firstLine(traderPlaybook.conditions.validIf);
  const invalidation = firstLine(traderPlaybook.conditions.invalidIf);
  const showRisk = hasTradeLevels(traderPlaybook);

  return (
    <ResearchSection title="Trade Plan" className={className}>
      <div className="divide-y divide-border/60">
        <ResearchRow
          label="Status"
          status={STATUS_LABEL[traderPlaybook.status]}
          body={planSummary(traderPlaybook)}
        />
        <ResearchRow
          label="Setup"
          status={SETUP_LABEL[traderPlaybook.bestSetup]}
          body={sideLabel(traderPlaybook.side)}
        />
        {trigger ? <ResearchRow label="Trigger" status={trigger} /> : null}
        {invalidation ? (
          <ResearchRow label="Invalidation" status={invalidation} />
        ) : null}
      </div>

      {showRisk ? (
        <ResearchMetricList
          columns={4}
          items={[
            {
              label: traderPlaybook.side === "Short" ? "Short entry" : "Entry",
              value: formatMoney(traderPlaybook.levels.entry),
            },
            {
              label: traderPlaybook.side === "Short" ? "Stop above" : "Stop",
              value: formatMoney(traderPlaybook.levels.stop),
            },
            {
              label:
                traderPlaybook.side === "Short" ? "Cover target" : "Target",
              value: formatMoney(
                traderPlaybook.levels.target1 ?? traderPlaybook.levels.target2,
              ),
            },
            {
              label: "Risk/reward",
              value:
                traderPlaybook.risk.rMultipleTarget1 != null
                  ? formatR(traderPlaybook.risk.rMultipleTarget1)
                  : traderPlaybook.risk.riskRewardLabel,
            },
          ]}
        />
      ) : null}
    </ResearchSection>
  );
}
