"use client";

import type { ValidationBucketMetrics } from "@/app/types/emergingLeadersValidation";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageShell } from "@/components/PageShell";
import { useEmergingLeadersValidation } from "@/app/hooks/useEmergingLeadersValidation";
import { appStackClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

function pct(value: number | null, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function hitPct(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(0)}%`;
}

function BucketTable({
  title,
  buckets,
}: {
  title: string;
  buckets: ValidationBucketMetrics[];
}) {
  return (
    <section className="app-panel overflow-hidden">
      <p className="border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-semibold">Bucket</th>
              <th className="px-3 py-2 font-semibold">N</th>
              <th className="px-3 py-2 font-semibold">5d avg</th>
              <th className="px-3 py-2 font-semibold">5d excess</th>
              <th className="px-3 py-2 font-semibold">5d hit</th>
              <th className="px-3 py-2 font-semibold">10d avg</th>
              <th className="px-3 py-2 font-semibold">10d hit</th>
              <th className="px-3 py-2 font-semibold">20d avg</th>
              <th className="px-3 py-2 font-semibold">20d hit</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((row) => (
              <tr
                key={row.bucket}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">
                  {row.bucket}
                </td>
                <td className="px-3 py-2.5 font-mono text-muted">{row.count}</td>
                <td className="px-3 py-2.5 font-mono">{pct(row.avgRet5D)}</td>
                <td className="px-3 py-2.5 font-mono">{pct(row.avgExcess5D)}</td>
                <td className="px-3 py-2.5 font-mono">{hitPct(row.hitRate5D)}</td>
                <td className="px-3 py-2.5 font-mono">{pct(row.avgRet10D)}</td>
                <td className="px-3 py-2.5 font-mono">{hitPct(row.hitRate10D)}</td>
                <td className="px-3 py-2.5 font-mono">{pct(row.avgRet20D)}</td>
                <td className="px-3 py-2.5 font-mono">{hitPct(row.hitRate20D)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EmergingLeadersValidationPage() {
  const query = useEmergingLeadersValidation();

  if (query.isLoading) {
    return (
      <PageShell className={appStackClass}>
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Emerging Leaders Validation
          </h1>
          <p className="text-sm text-muted">Loading forward-return analytics…</p>
        </header>
        <SkeletonList rows={6} />
      </PageShell>
    );
  }

  if (query.isError) {
    return (
      <PageShell className={appStackClass}>
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Emerging Leaders Validation
          </h1>
        </header>
        <ErrorBanner
          message={
            query.error instanceof Error
              ? query.error.message
              : "Failed to load validation data."
          }
        />
      </PageShell>
    );
  }

  const data = query.data!;

  return (
    <PageShell className={appStackClass}>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Emerging Leaders Validation
        </h1>
        <p className="text-sm text-muted">
          Measures whether setup score, compression velocity, and stage predict
          forward returns vs SPY. Ranking logic is unchanged — this is research
          only.
        </p>
        <p className="text-xs text-muted">{data.methodology}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="app-panel px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Snapshot dates
          </p>
          <p className="font-mono text-xl font-semibold">{data.snapshotDates}</p>
        </div>
        <div className="app-panel px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Snapshot rows
          </p>
          <p className="font-mono text-xl font-semibold">{data.snapshotRows}</p>
        </div>
        <div className="app-panel px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Labeled (20d)
          </p>
          <p className="font-mono text-xl font-semibold">{data.labeledRows}</p>
        </div>
      </div>

      {data.labeledRows === 0 ? (
        <div
          className={cn(
            "app-panel px-4 py-8 text-center text-sm text-muted",
          )}
        >
          No labeled snapshots yet. Run the daily Emerging Leaders validation
          job after market close, then revisit once 20 trading sessions have
          elapsed.
        </div>
      ) : (
        <>
          <BucketTable title="Setup score" buckets={data.setupScoreBuckets} />
          <BucketTable
            title="Compression velocity"
            buckets={data.compressionVelocityBuckets}
          />
          <BucketTable title="Stage" buckets={data.stageBuckets} />
          <BucketTable
            title="Top decile (by setup score)"
            buckets={[data.topDecile]}
          />
        </>
      )}
    </PageShell>
  );
}
