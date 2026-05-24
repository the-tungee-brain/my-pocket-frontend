"use client";

import { Position } from "@/app/types/schwab";
import { cn } from "@/lib/utils";

export type PositionMap = Record<string, Position[]>;

type AccountPositionListProps = {
  positionsForSelectedSymbol: Position[] | null;
  selectedSymbol: string | null;
};

function formatPL(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function positionKey(p: Position) {
  return `${p.instrument.symbol}-${p.instrument.cusip}-${p.longQuantity}-${p.shortQuantity}`;
}

export function AccountPositionList({
  positionsForSelectedSymbol,
  selectedSymbol,
}: AccountPositionListProps) {
  if (!selectedSymbol) {
    return (
      <section className="w-full py-4">
        <p className="text-sm text-muted md:hidden">
          Open the menu to pick a symbol.
        </p>
        <p className="hidden text-sm text-muted md:block">
          Select a symbol from the sidebar to view its positions.
        </p>
      </section>
    );
  }

  if (!positionsForSelectedSymbol || positionsForSelectedSymbol.length === 0) {
    return (
      <section className="mx-auto w-full max-w-3xl py-4">
        <p className="text-sm text-muted">
          No positions found for {selectedSymbol}.
        </p>
      </section>
    );
  }

  const positions = positionsForSelectedSymbol.slice().sort((a, b) => {
    const qtyA = a.longQuantity - a.shortQuantity;
    const qtyB = b.longQuantity - b.shortQuantity;
    return qtyB - qtyA;
  });

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);

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
              const name = p.instrument.description ?? "EQUITY";

              return (
                <div key={positionKey(p)} className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted">Qty</p>
                      <p className="mt-0.5 tabular-nums font-medium">
                        {qty.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted">Value</p>
                      <p className="mt-0.5 tabular-nums font-medium">
                        ${p.marketValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted">Today P/L</p>
                      <p
                        className={cn(
                          "mt-0.5 tabular-nums font-medium",
                          isPositive ? "text-success" : "text-danger",
                        )}
                      >
                        {formatPL(p.currentDayProfitLoss)}
                      </p>
                      <p
                        className={cn(
                          "tabular-nums text-[11px]",
                          isPositive ? "text-success" : "text-danger",
                        )}
                      >
                        ({p.currentDayProfitLossPercentage.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <table className="hidden w-full table-fixed text-sm sm:table">
            <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="w-2/5 px-4 py-2.5 text-left">Name</th>
                <th className="w-1/5 px-4 py-2.5 text-right">Qty</th>
                <th className="w-1/5 px-4 py-2.5 text-right">Value</th>
                <th className="w-1/5 px-4 py-2.5 text-right">Today P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const qty = p.longQuantity - p.shortQuantity;
                const isPositive = p.currentDayProfitLoss >= 0;

                return (
                  <tr
                    key={positionKey(p)}
                    className="border-t border-border transition-colors hover:bg-muted-bg/40"
                  >
                    <td className="w-2/5 px-4 py-3 text-left text-muted">
                      {p.instrument.description ?? "EQUITY"}
                    </td>
                    <td className="w-1/5 px-4 py-3 text-right tabular-nums">
                      {qty.toLocaleString()}
                    </td>
                    <td className="w-1/5 px-4 py-3 text-right tabular-nums">
                      ${p.marketValue.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "w-1/5 px-4 py-3 text-right tabular-nums",
                        isPositive ? "text-success" : "text-danger",
                      )}
                    >
                      {formatPL(p.currentDayProfitLoss)}{" "}
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
