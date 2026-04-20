"use client";

import { usePerformanceSnapshot } from "@/app/hooks/usePerformance";
import { BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";

type Props = {
  symbol: string;
  fallback: {
    trendLabel: string;
    oneMonth: string;
    threeMonth: string;
    oneYear: string;
    volatilityNote: string;
  };
  accessToken?: string | null;
};

export function PerformanceSnapshot({ symbol, fallback }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const {
    performance: perf,
    isLoading,
    error,
  } = usePerformanceSnapshot(symbol, { accessToken });

  const performance = perf ?? fallback;

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <BarChart3 className="h-4 w-4 text-neutral-500" />
        Recent performance
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-secondary animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-12 rounded bg-secondary animate-pulse" />
            <div className="h-12 rounded bg-secondary animate-pulse" />
            <div className="h-12 rounded bg-secondary animate-pulse" />
          </div>
        </div>
      ) : error ? (
        <p className="text-xs text-red-600">
          {error} Showing placeholder performance.
        </p>
      ) : null}

      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        {performance.trendLabel}
      </p>
      <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-secondary/70 p-3 text-xs">
        <div>
          <p className="text-neutral-500">1 month</p>
          <p className="mt-1 font-medium">{performance.oneMonth}</p>
        </div>
        <div>
          <p className="text-neutral-500">3 months</p>
          <p className="mt-1 font-medium">{performance.threeMonth}</p>
        </div>
        <div>
          <p className="text-neutral-500">1 year</p>
          <p className="mt-1 font-medium">{performance.oneYear}</p>
        </div>
      </div>
      <p className="text-xs text-neutral-600 dark:text-neutral-400">
        {performance.volatilityNote}
      </p>
    </section>
  );
}
