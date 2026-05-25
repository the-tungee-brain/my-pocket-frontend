"use client";

import { CircleDollarSign, Inbox, LockKeyhole } from "lucide-react";
import { Position } from "@/app/types/schwab";
import { EmptyState } from "@/components/ui/EmptyState";
import { cspReservedCash, positionStrikePrice } from "@/lib/cspReservedCash";
import {
  isCashSecuredPut,
  isHighlightedOptionStrategy,
  optionStrategyLabel,
} from "@/lib/optionStrategyLabel";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import {
  positionCostBasis,
  positionOpenProfitLoss,
  positionOpenProfitLossPct,
} from "@/lib/positionMetrics";
import { cn } from "@/lib/utils";

export type PositionMap = Record<string, Position[]>;

type AccountPositionListProps = {
  positionsForSelectedSymbol: Position[] | null;
  selectedSymbol: string | null;
};

function positionKey(p: Position) {
  return `${p.instrument.symbol}-${p.instrument.cusip}-${p.longQuantity}-${p.shortQuantity}`;
}

function positionLabel(p: Position) {
  return p.instrument.description ?? p.instrument.assetType ?? "Position";
}

function PositionTypeChip({
  position,
  siblingPositions,
}: {
  position: Position;
  siblingPositions: Position[];
}) {
  const label = optionStrategyLabel(position, siblingPositions);
  if (!label) return null;

  const highlighted = isHighlightedOptionStrategy(position, siblingPositions);
  const isCsp = isCashSecuredPut(position);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        highlighted
          ? "bg-accent/15 text-accent-strong"
          : "bg-muted-bg text-muted",
      )}
    >
      {isCsp && <LockKeyhole className="h-3 w-3 shrink-0" aria-hidden />}
      {label}
    </span>
  );
}

function ReservedCashNote({ position }: { position: Position }) {
  const reserved = cspReservedCash(position);
  if (reserved == null) return null;

  const strike = positionStrikePrice(position);
  const contracts = position.shortQuantity;

  return (
    <p className="mt-1 text-xs text-muted">
      <span className="font-medium text-accent-strong">
        {formatUsd(reserved)} reserved
      </span>
      {strike != null && (
        <>
          {" "}
          · {formatUsd(strike, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
          strike × {contracts} {contracts === 1 ? "contract" : "contracts"} × 100 shares
        </>
      )}
    </p>
  );
}

export function AccountPositionList({
  positionsForSelectedSymbol,
  selectedSymbol,
}: AccountPositionListProps) {
  if (!selectedSymbol) {
    return (
      <section className="mx-auto w-full max-w-3xl py-4">
        <EmptyState
          icon={CircleDollarSign}
          title="Pick a symbol"
          description="Open the menu on mobile or choose a symbol from the sidebar to view its positions."
          variant="solid"
          className="py-8"
        />
      </section>
    );
  }

  if (!positionsForSelectedSymbol || positionsForSelectedSymbol.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl py-4">
        <EmptyState
          icon={Inbox}
          title={`No positions for ${selectedSymbol}`}
          description="This symbol isn't in your Schwab holdings, or positions haven't loaded yet."
          variant="solid"
          className="py-8"
        />
      </section>
    );
  }

  const positions = positionsForSelectedSymbol.slice().sort((a, b) => {
    const qtyA = a.longQuantity - a.shortQuantity;
    const qtyB = b.longQuantity - b.shortQuantity;
    return qtyB - qtyA;
  });

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const symbolCspReserved = positions.reduce(
    (sum, p) => sum + (cspReservedCash(p) ?? 0),
    0,
  );

  return (
    <section className="w-full py-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {selectedSymbol}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {positions.length}{" "}
              {positions.length === 1 ? "position" : "positions"}
              {symbolCspReserved > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-accent-strong">
                    {formatUsd(symbolCspReserved)} reserved for puts
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Total value
            </p>
            <p className="text-lg font-semibold tabular-nums">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
          <div className="divide-y divide-border sm:hidden">
            {positions.map((p) => {
              const qty = p.longQuantity - p.shortQuantity;
              const isPositive = p.currentDayProfitLoss >= 0;
              const name = positionLabel(p);
              const reserved = cspReservedCash(p);
              const cost = positionCostBasis(p);
              const openPL = positionOpenProfitLoss(p);
              const openPLPct = positionOpenProfitLossPct(p);

              return (
                <div key={positionKey(p)} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{name}</p>
                      <div className="mt-1">
                        <PositionTypeChip position={p} siblingPositions={positions} />
                      </div>
                      <ReservedCashNote position={p} />
                    </div>
                    {reserved != null && (
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                          Reserved
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular-nums text-accent-strong">
                          {formatUsd(reserved)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div>
                      <p className="text-muted">Qty</p>
                      <p className="mt-0.5 tabular-nums font-medium">
                        {qty.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Cost</p>
                      <p className="mt-0.5 tabular-nums font-medium">
                        {cost != null ? formatUsd(cost) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Value</p>
                      <p className="mt-0.5 tabular-nums font-medium">
                        ${p.marketValue.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted">Open P/L</p>
                      {openPL == null ? (
                        <p className="mt-0.5 tabular-nums font-medium text-muted">
                          —
                        </p>
                      ) : (
                        <>
                          <p
                            className={cn(
                              "mt-0.5 tabular-nums font-medium",
                              openPL >= 0 ? "text-success" : "text-danger",
                            )}
                          >
                            {formatSignedUsd(openPL)}
                          </p>
                          {openPLPct != null && (
                            <p
                              className={cn(
                                "tabular-nums text-[11px]",
                                openPL >= 0 ? "text-success" : "text-danger",
                              )}
                            >
                              ({openPLPct >= 0 ? "+" : ""}
                              {openPLPct.toFixed(2)}%)
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs">
                    <p className="text-muted">Today P/L</p>
                    <p
                      className={cn(
                        "mt-0.5 tabular-nums font-medium",
                        isPositive ? "text-success" : "text-danger",
                      )}
                    >
                      {formatSignedUsd(p.currentDayProfitLoss)} (
                      {p.currentDayProfitLossPercentage.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <table className="hidden w-full text-sm sm:table">
            <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5 text-right">Open P/L</th>
                <th className="px-4 py-2.5 text-right">Reserved</th>
                <th className="px-4 py-2.5 text-right">Today P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const qty = p.longQuantity - p.shortQuantity;
                const isPositive = p.currentDayProfitLoss >= 0;
                const reserved = cspReservedCash(p);
                const cost = positionCostBasis(p);
                const openPL = positionOpenProfitLoss(p);
                const openPLPct = positionOpenProfitLossPct(p);

                return (
                  <tr
                    key={positionKey(p)}
                    className="border-t border-border transition-colors hover:bg-muted-bg/40"
                  >
                    <td className="px-4 py-3 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="text-muted">{positionLabel(p)}</span>
                        <PositionTypeChip position={p} siblingPositions={positions} />
                        {reserved != null && (
                          <span className="text-[11px] text-muted">
                            {formatUsd(reserved)} at{" "}
                            {formatUsd(positionStrikePrice(p) ?? 0, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            strike
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {qty.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {cost != null ? formatUsd(cost) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ${p.marketValue.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        openPL == null
                          ? "text-muted"
                          : openPL >= 0
                            ? "text-success"
                            : "text-danger",
                      )}
                    >
                      {openPL != null ? (
                        <>
                          {formatSignedUsd(openPL)}
                          {openPLPct != null && (
                            <span className="block text-[11px] opacity-80">
                              ({openPLPct >= 0 ? "+" : ""}
                              {openPLPct.toFixed(2)}%)
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {reserved != null ? (
                        <span className="font-medium text-accent-strong">
                          {formatUsd(reserved)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        isPositive ? "text-success" : "text-danger",
                      )}
                    >
                      {formatSignedUsd(p.currentDayProfitLoss)}{" "}
                      <span className="text-[11px] opacity-80">
                        ({p.currentDayProfitLossPercentage.toFixed(2)}%)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
