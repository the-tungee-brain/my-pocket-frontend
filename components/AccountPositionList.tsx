"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/apiClient";
import { Loader2, MessageCircle } from "lucide-react";

type Instrument = {
  symbol: string;
  description?: string;
};

type Position = {
  shortQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  instrument: Instrument;
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice?: number | null;
  taxLotAverageLongPrice?: number | null;
  longOpenProfitLoss?: number | null;
  previousSessionLongQuantity?: number | null;
  averageShortPrice?: number | null;
  taxLotAverageShortPrice?: number | null;
  shortOpenProfitLoss?: number | null;
  previousSessionShortQuantity?: number | null;
  currentDayCost: number;
};

type PositionMap = Record<string, Position[]>;

export function AccountPositionList() {
  const { data: session } = useSession();
  const [positionMap, setPositionMap] = useState<PositionMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/get-account-positions", {
          method: "GET",
          accessToken: session.accessToken,
        });

        if (!res.ok) {
          setError("Failed to load positions");
          setPositionMap({});
          return;
        }

        const data = (await res.json()) as { schwab_positions: PositionMap };
        setPositionMap(data.schwab_positions);
      } catch {
        setError("Failed to load positions");
        setPositionMap({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.accessToken]);

  if (!session?.accessToken) return null;

  const hasNoPositions =
    !loading &&
    positionMap &&
    Object.values(positionMap).every((arr) => arr.length === 0);

  const handleAnalyzeSymbol = (positions: Position[]) => {
    console.log("Analyze positions for", positions);
  };

  return (
    <section className="w-full px-4 py-6">
      <div className="mx-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold">Account positions</h2>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {hasNoPositions && (
          <p className="text-sm text-neutral-400">
            No positions found yet. Once Schwab is connected and you have
            holdings, they’ll appear here.
          </p>
        )}

        {!loading && positionMap && !hasNoPositions && (
          <div className="space-y-6">
            {Object.entries(positionMap).map(([symbol, positions]) => {
              if (!positions || positions.length === 0) return null;

              return (
                <div
                  key={symbol}
                  className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/70">
                    <div>
                      <h3 className="text-sm font-semibold">{symbol}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAnalyzeSymbol(positions)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-800"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Analyze
                    </button>
                  </div>

                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-neutral-900 text-neutral-300">
                      <tr>
                        <th className="w-2/5 px-4 py-2 text-left hidden sm:table-cell">
                          Name
                        </th>
                        <th className="w-1/5 px-4 py-2 text-right">Qty</th>
                        <th className="w-1/5 px-4 py-2 text-right">
                          Market value
                        </th>
                        <th className="w-1/5 px-4 py-2 text-right hidden sm:table-cell">
                          Today P/L
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((p, idx) => {
                        const qty = p.longQuantity - p.shortQuantity;

                        return (
                          <tr
                            key={`${symbol}-${idx}-${p.longQuantity}-${p.shortQuantity}`}
                            className="border-t border-neutral-800 hover:bg-neutral-800/40"
                          >
                            <td className="w-2/5 px-4 py-2 text-left text-neutral-400 hidden sm:table-cell">
                              {p.instrument.description ?? "EQUITY"}
                            </td>
                            <td className="w-1/5 px-4 py-2 text-right">
                              {qty.toLocaleString()}
                            </td>
                            <td className="w-1/5 px-4 py-2 text-right">
                              ${p.marketValue.toLocaleString()}
                            </td>
                            <td className="w-1/5 px-4 py-2 text-right hidden sm:table-cell">
                              {p.currentDayProfitLoss >= 0 ? "+" : ""}
                              {p.currentDayProfitLoss.toLocaleString()} (
                              {p.currentDayProfitLossPercentage.toFixed(2)}%)
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
