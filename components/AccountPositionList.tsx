"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/apiClient";
import { Loader2 } from "lucide-react";

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

export function AccountPositionList() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<Position[] | null>(null);
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
          setPositions([]);
          return;
        }

        type PositionMap = Record<string, Position[]>;

        const data = (await res.json()) as { schwab_positions: PositionMap };

        const flatPositions = Object.entries(data.schwab_positions).flatMap(
          ([symbol, positions]) =>
            positions.map((p) => ({
              ...p,
              instrument: {
                ...p.instrument,
                symbol,
              },
            })),
        );

        setPositions(flatPositions);
      } catch {
        setError("Failed to load positions");
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.accessToken]);

  if (!session?.accessToken) return null;

  return (
    <section className="w-full px-4 py-6">
      <div className="mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Account positions</h2>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        {!loading && positions && positions.length === 0 && (
          <p className="text-sm text-neutral-400">
            No positions found yet. Once Schwab is connected and you have
            holdings, they’ll appear here.
          </p>
        )}

        {!loading && positions && positions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60">
            <table className="w-full text-sm">
              <thead className="bg-neutral-900 text-neutral-300">
                <tr>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-left hidden sm:table-cell">
                    Name
                  </th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Market value</th>
                  <th className="px-4 py-2 text-right hidden sm:table-cell">
                    Today P/L
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr
                    key={`${p.instrument.symbol}-${p.longQuantity}-${p.shortQuantity}`}
                    className="border-t border-neutral-800 hover:bg-neutral-800/40"
                  >
                    <td className="px-4 py-2 font-medium">
                      {p.instrument.symbol}
                    </td>
                    <td className="px-4 py-2 text-left text-neutral-400 hidden sm:table-cell">
                      {p.instrument.description ?? "\u2014"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(p.longQuantity - p.shortQuantity).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      ${p.marketValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right hidden sm:table-cell">
                      {p.currentDayProfitLoss >= 0 ? "+" : ""}
                      {p.currentDayProfitLoss.toLocaleString()} (
                      {p.currentDayProfitLossPercentage.toFixed(2)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
