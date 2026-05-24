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

export function AccountPositionList({
  positionsForSelectedSymbol,
  selectedSymbol,
}: AccountPositionListProps) {
  if (!selectedSymbol) {
    return (
      <section className="w-full py-4">
        <p className="text-sm text-muted">
          Select a symbol on the left to view its positions.
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
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="hidden w-2/5 px-4 py-2.5 text-left sm:table-cell">
                  Name
                </th>
                <th className="w-1/5 px-4 py-2.5 text-right">Qty</th>
                <th className="w-1/5 px-4 py-2.5 text-right">Value</th>
                <th className="hidden w-1/5 px-4 py-2.5 text-right sm:table-cell">
                  Today P/L
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => {
                const qty = p.longQuantity - p.shortQuantity;
                const isPositive = p.currentDayProfitLoss >= 0;

                return (
                  <tr
                    key={`${p.instrument.symbol}-${p.instrument.cusip}-${p.longQuantity}-${p.shortQuantity}`}
                    className="border-t border-border transition-colors hover:bg-muted-bg/40"
                  >
                    <td className="hidden w-2/5 px-4 py-3 text-left text-muted sm:table-cell">
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
                        "hidden w-1/5 px-4 py-3 text-right tabular-nums sm:table-cell",
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
