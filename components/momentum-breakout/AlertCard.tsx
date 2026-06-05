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
import {
  deriveAlertVerdict,
  mbAlertElementId,
} from "@/lib/momentumBreakoutInvestorUi";
import {
  mbMetricLabelClass,
  mbMetricTileClass,
  mbMetricValueClass,
  mbStatusPillClass,
} from "@/lib/momentumBreakoutUi";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  alert: MomentumBreakoutAlertDto;
  className?: string;
  showCancel?: boolean;
  onCancel?: (alertId: string) => void;
  cancelLoading?: boolean;
};

function AlertMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  return (
    <div className={mbMetricTileClass}>
      <dt className={mbMetricLabelClass}>{label}</dt>
      <dd
        className={cn(
          mbMetricValueClass,
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function AlertCard({
  alert,
  className,
  showCancel = false,
  onCancel,
  cancelLoading = false,
}: Props) {
  const [statsOpen, setStatsOpen] = useState(false);
  const verdict = deriveAlertVerdict(alert);
  const cancellableAlertId =
    showCancel && alert.alertId && isAlertCancellable(alert.status) && onCancel
      ? alert.alertId
      : null;

  return (
    <Card
      id={mbAlertElementId(alert.symbol)}
      className={cn("scroll-mt-24 overflow-hidden rounded-lg", className)}
    >
      <CardBody className="space-y-4">
        <div
          className={cn(
            "rounded-lg border px-4 py-3.5",
            alertVerdictPanelClass(verdict.kind),
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-mono text-lg font-semibold tracking-wide text-foreground">
                  {alert.symbol}
                </h3>
                <span className={mbStatusPillClass("neutral")}>
                  {statusBadgeLabel(alert.status)}
                </span>
              </div>
              <p
                className={cn(
                  "mt-2 text-base font-semibold",
                  alertVerdictTitleClass(verdict.kind),
                )}
              >
                {verdict.kind}
              </p>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-foreground/85">
                {verdict.explanation}
              </p>
            </div>
            {cancellableAlertId && onCancel && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                isLoading={cancelLoading}
                onClick={() => onCancel(cancellableAlertId)}
              >
                Stop tracking
              </Button>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <AlertMetric label="Entry" value={formatUsdLevel(alert.entryPrice)} />
          <AlertMetric
            label="Stop"
            value={formatUsdLevel(alert.stopPrice)}
            tone="danger"
          />
          <AlertMetric
            label="Target"
            value={formatUsdLevel(alert.targetPrice)}
            tone="success"
          />
        </dl>

        {alert.nextActionMessage ? (
          <p className="rounded-lg border border-border/60 bg-muted-bg/35 px-3 py-2.5 text-sm leading-relaxed text-foreground/85">
            <span className="font-semibold text-foreground">Next </span>
            {alert.nextActionMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>{formatSetupName(alert.setupName)} pattern</span>
          {alert.outcomeReturnPct != null && (
            <span>
              Result{" "}
              <span className="font-mono text-sm font-semibold text-foreground">
                {(alert.outcomeReturnPct * 100).toFixed(1)}%
              </span>
            </span>
          )}
        </div>

        <div className="border-t border-border/60 pt-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold text-muted transition hover:text-foreground"
            onClick={() => setStatsOpen((open) => !open)}
            aria-expanded={statsOpen}
          >
            <span>Research detail</span>
            {statsOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            )}
          </button>
          {statsOpen && (
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <AlertMetric
                label="Reward/risk"
                value={`${alert.riskReward.toFixed(2)}x`}
              />
              <AlertMetric
                label="Win rate"
                value={formatWinRate(alert.historicalWinRate)}
              />
              <AlertMetric
                label="Profit factor"
                value={formatProfitFactor(alert.historicalProfitFactor)}
              />
              <AlertMetric
                label="Examples"
                value={String(alert.historicalTotalTrades ?? "-")}
              />
            </dl>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
