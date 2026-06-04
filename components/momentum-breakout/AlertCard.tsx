"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MomentumBreakoutAlertDto } from "@/app/types/momentumBreakoutAlerts";
import { Card, CardBody } from "@/components/ui/Card";
import {
  alertVerdictPanelClass,
  alertVerdictTitleClass,
  formatProfitFactor,
  formatSetupName,
  formatUsdLevel,
  formatWinRate,
  isAlertCancellable,
  statusBadgeLabel,
} from "@/lib/momentumBreakoutAlertUi";
import { deriveAlertVerdict, mbAlertElementId } from "@/lib/momentumBreakoutInvestorUi";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  alert: MomentumBreakoutAlertDto;
  className?: string;
  showCancel?: boolean;
  onCancel?: (alertId: string) => void;
  cancelLoading?: boolean;
};

export function AlertCard({
  alert,
  className,
  showCancel = false,
  onCancel,
  cancelLoading = false,
}: Props) {
  const [statsOpen, setStatsOpen] = useState(false);
  const verdict = deriveAlertVerdict(alert);

  return (
    <Card
      id={mbAlertElementId(alert.symbol)}
      className={cn("scroll-mt-24 overflow-hidden", className)}
    >
      <CardBody className="space-y-3">
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            alertVerdictPanelClass(verdict.kind),
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-[17px] font-bold tracking-wide text-foreground">
                {alert.symbol}
              </h3>
              <p
                className={cn(
                  "mt-2 text-lg font-semibold",
                  alertVerdictTitleClass(verdict.kind),
                )}
              >
                {verdict.kind}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-foreground">
                {verdict.explanation}
              </p>
            </div>
            {showCancel &&
              alert.alertId &&
              isAlertCancellable(alert.status) &&
              onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  isLoading={cancelLoading}
                  onClick={() => onCancel(alert.alertId!)}
                >
                  Stop tracking
                </Button>
              )}
          </div>
        </div>

        <p className="text-[13px] text-foreground/75">
          <span className="font-medium text-foreground">Status: </span>
          {statusBadgeLabel(alert.status)}
        </p>

        <p className="text-[15px] leading-relaxed text-foreground">
          <span className="font-semibold">Entry </span>
          <span className="font-mono text-[17px] font-semibold">
            {formatUsdLevel(alert.entryPrice)}
          </span>
          <span className="text-foreground/50"> · </span>
          <span className="font-semibold">Stop </span>
          <span className="font-mono text-[17px] font-semibold">
            {formatUsdLevel(alert.stopPrice)}
          </span>
          <span className="text-foreground/50"> · </span>
          <span className="font-semibold">Target </span>
          <span className="font-mono text-[17px] font-semibold">
            {formatUsdLevel(alert.targetPrice)}
          </span>
        </p>

        {alert.nextActionMessage ? (
          <p className="text-[13px] leading-relaxed text-foreground/80">
            <span className="font-semibold text-foreground">Next: </span>
            {alert.nextActionMessage}
          </p>
        ) : null}

        {alert.outcomeReturnPct != null && (
          <p className="text-[13px] text-foreground/75">
            Result when closed:{" "}
            <span className="font-mono text-[17px] font-semibold text-foreground">
              {(alert.outcomeReturnPct * 100).toFixed(1)}%
            </span>
          </p>
        )}

        <p className="text-[13px] text-foreground/65">
          {formatSetupName(alert.setupName)} pattern
        </p>

        <div className="border-t border-border/60 pt-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left text-[13px] text-foreground/75"
            onClick={() => setStatsOpen((open) => !open)}
            aria-expanded={statsOpen}
          >
            <span className="font-semibold text-foreground">
              More detail (optional)
            </span>
            {statsOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
          </button>
          {statsOpen && (
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <dt className="text-[13px] font-medium text-foreground/75">
                  Reward vs risk
                </dt>
                <dd className="mt-1 font-mono text-[17px] font-semibold text-foreground">
                  {alert.riskReward.toFixed(2)}×
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-foreground/75">
                  Past win rate
                </dt>
                <dd className="mt-1 font-mono text-[17px] font-semibold text-foreground">
                  {formatWinRate(alert.historicalWinRate)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-foreground/75">
                  Past profit factor
                </dt>
                <dd className="mt-1 font-mono text-[17px] font-semibold text-foreground">
                  {formatProfitFactor(alert.historicalProfitFactor)}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] font-medium text-foreground/75">
                  Past examples
                </dt>
                <dd className="mt-1 font-mono text-[17px] font-semibold text-foreground">
                  {alert.historicalTotalTrades ?? "—"}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
