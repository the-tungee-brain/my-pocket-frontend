"use client";

import { BarChart3 } from "lucide-react";
import { usePerformanceSnapshot } from "@/app/hooks/usePerformance";
import { useSession } from "next-auth/react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ResearchSectionSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
};

export function PerformanceSnapshot({ symbol, className }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const {
    performance: perf,
    isLoading,
    error,
  } = usePerformanceSnapshot(symbol, { accessToken });

  return (
    <ResearchSectionCard
      title="Recent performance"
      description="Price trends and volatility"
      icon={BarChart3}
      className={className}
    >
      {isLoading ? (
        <div className="space-y-2">
          <ResearchSectionSkeleton
            headerWidth="w-48"
            rows={0}
            className="space-y-2"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <ErrorBanner message={error} />
      ) : !perf ? (
        <p className="text-sm text-muted">Performance data is not available.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-foreground">
            {perf.trendLabel}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-border bg-background/40 p-3 text-xs">
            {(
              [
                ["1 month", perf.oneMonth],
                ["3 months", perf.threeMonth],
                ["1 year", perf.oneYear],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-muted">{label}</p>
                <p
                  className={cn(
                    "mt-1 font-medium tabular-nums",
                    value.startsWith("-") ? "text-danger" : "text-success",
                  )}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-foreground">{perf.volatilityNote}</p>
        </div>
      )}
    </ResearchSectionCard>
  );
}
