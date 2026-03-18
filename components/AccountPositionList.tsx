"use client";

import { Position } from "@/app/types/schwab";

export type PositionMap = Record<string, Position[]>;

type AccountPositionListProps = {
  positionsForSelectedSymbol: Position[] | null;
  selectedSymbol: string | null;
};

export function AccountPositionList({
  positionsForSelectedSymbol,
  selectedSymbol,
}: AccountPositionListProps) {
  if (!selectedSymbol) {
    return (
      <section className="w-full py-4">
        <p className="text-sm text-neutral-400">
          Select a symbol on the left to view its positions.
        </p>
      </section>
    );
  }

  if (!positionsForSelectedSymbol || positionsForSelectedSymbol.length === 0) {
    return (
      <section className="w-full py-4">
        <p className="text-sm text-neutral-400">
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

  return (
    <section className="w-full py-4">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-lg font-semibold">
          Positions for {selectedSymbol}
        </h2>

        <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-secondary text-foreground">
              <tr>
                <th className="hidden w-2/5 px-4 py-2 text-left sm:table-cell">
                  Name
                </th>
                <th className="w-1/5 px-4 py-2 text-right">Qty</th>
                <th className="w-1/5 px-4 py-2 text-right">Market value</th>
                <th className="hidden w-1/5 px-4 py-2 text-right sm:table-cell">
                  Today P/L
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, idx) => {
                const qty = p.longQuantity - p.shortQuantity;

                return (
                  <tr
                    key={`${selectedSymbol}-${idx}-${p.longQuantity}-${p.shortQuantity}`}
                    className="border-t border-border hover:bg-neutral-800/40"
                  >
                    <td className="hidden w-2/5 px-4 py-2 text-left text-neutral-400 sm:table-cell">
                      {p.instrument.description ?? "EQUITY"}
                    </td>
                    <td className="w-1/5 px-4 py-2 text-right">
                      {qty.toLocaleString()}
                    </td>
                    <td className="w-1/5 px-4 py-2 text-right">
                      ${p.marketValue.toLocaleString()}
                    </td>
                    <td className="hidden w-1/5 px-4 py-2 text-right sm:table-cell">
                      {p.currentDayProfitLoss >= 0 ? "+" : ""}
                      {p.currentDayProfitLoss.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ({p.currentDayProfitLossPercentage.toFixed(2)}%)
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
