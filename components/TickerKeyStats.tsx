"use client";

import Link from "next/link";
import { useResearchSnapshot } from "@/app/hooks/useResearchSnapshot";
import { useSession } from "next-auth/react";
import { useEtfHoldings } from "@/app/hooks/useEtfHoldings";
import { useResearchAssetTypeContext } from "@/app/research/[symbol]/ResearchAssetTypeContext";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { buildTickerKeyStats } from "@/lib/tickerKeyStats";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
  compact?: boolean;
};

export function TickerKeyStats({ symbol, className, compact = false }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { isEtf } = useResearchAssetTypeContext();
  const { snapshot, isLoading } = useResearchSnapshot(symbol, { accessToken });
  const { holdings: etfHoldings } = useEtfHoldings(symbol, {
    accessToken,
    limit: 8,
    enabled: isEtf && Boolean(snapshot),
  });

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-2",
          compact
            ? "grid-flow-col auto-cols-[minmax(6.5rem,1fr)] overflow-x-auto"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
          className,
        )}
      >
        {Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[3.75rem] rounded-xl" />
        ))}
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const stats = buildTickerKeyStats(snapshot, { isEtf, etfHoldings });
  const symbolUpper = symbol.toUpperCase();

  return (
    <div
      className={cn(
        "grid gap-2",
        compact
          ? "grid-flow-col auto-cols-[minmax(6.5rem,1fr)] overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      {stats.map((stat) => {
        const content = (
          <>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {stat.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              {stat.value}
            </p>
          </>
        );

        const tileClassName = cn(
          "rounded-xl border border-border bg-background/60 px-3 py-2.5",
          compact && "min-w-[6.5rem]",
        );

        if (stat.hrefTab) {
          return (
            <Link
              key={stat.label}
              href={symbolHubPath(symbolUpper, stat.hrefTab)}
              className={cn(
                tileClassName,
                "transition hover:border-accent/40 hover:bg-secondary/40",
              )}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={stat.label} className={tileClassName}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
