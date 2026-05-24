"use client";

import { useFundamentals } from "@/app/hooks/useFundamentals";
import { useSession } from "next-auth/react";
import { ResearchTextBlock } from "@/components/ResearchDetailBlocks";

type FundamentalsSectionProps = {
  symbol: string;
};

export function FundamentalsSection({ symbol }: FundamentalsSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-muted-bg" />
        <div className="h-32 w-full animate-pulse rounded bg-muted-bg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!fundamentals) {
    return (
      <p className="text-sm text-muted">Fundamentals are not available.</p>
    );
  }

  return (
    <div className="space-y-6">
      {fundamentals.overviewNote && (
        <ResearchTextBlock title="Fundamental overview">
          <p>{fundamentals.overviewNote}</p>
        </ResearchTextBlock>
      )}

      {fundamentals.metrics.length > 0 ? (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Key metrics
          </h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-elevated/60">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    Metric
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fundamentals.metrics.map((metric) => (
                  <tr
                    key={metric.label}
                    className="bg-secondary/30 transition-colors hover:bg-surface-elevated/40"
                    title={metric.note ?? undefined}
                  >
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium text-foreground">
                        {metric.label}
                      </div>
                      {metric.note && (
                        <div className="mt-1 text-xs leading-relaxed text-muted">
                          {metric.note}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-semibold tabular-nums text-foreground">
                      {metric.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          No fundamental metrics were returned for this symbol.
        </p>
      )}
    </div>
  );
}
