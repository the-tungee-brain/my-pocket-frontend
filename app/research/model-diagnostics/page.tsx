"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Activity, AlertTriangle, BarChart2 } from "lucide-react";
import type { ModelDiagnostics } from "@/app/types/intelligence";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { fetchModelDiagnostics } from "@/lib/apiClient";
import { hasProFeature } from "@/lib/planFeatures";
import { PageShell } from "@/components/PageShell";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { KpiStat } from "@/components/ui/KpiStat";
import { formatFriendlyDate } from "@/lib/dateUtils";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function ModelDiagnosticsPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { plan } = useAccountPlan(accessToken);
  const allowed = hasProFeature(plan, "patternTrend");

  const [data, setData] = useState<ModelDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !allowed) return;
    let cancelled = false;
    setLoading(true);
    fetchModelDiagnostics(accessToken)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, allowed]);

  return (
    <PageShell title="Model diagnostics" description="Research signal monitoring and quality">
      <ProFeatureGate feature="patternTrend" allowed={allowed} className={pageSectionClass}>
        {loading ? <p className="text-sm text-muted">Loading diagnostics…</p> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {data ? (
          <div className="space-y-6">
            <ResearchSectionCard
              title="Signal quality"
              description={
                data.modelLabel
                  ? `${data.modelLabel} · ${data.universe?.toUpperCase() ?? "TOP20"}`
                  : "Model C walk-forward baseline"
              }
              icon={BarChart2}
              className={pageSectionClass}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiStat label="Rolling IC" value={data.rollingIc.toFixed(3)} />
                <KpiStat label="Rank IC" value={data.rankIc.toFixed(3)} />
                <KpiStat label="Sharpe" value={data.sharpe.toFixed(2)} />
                <KpiStat label="Hit rate" value={`${(data.hitRate * 100).toFixed(0)}%`} />
              </div>
              <p className="mt-3 text-xs text-muted">
                {data.rollingWindowDays}-day window · Source: {data.source ?? "baseline"}
                {data.trainEndDate
                  ? ` · Trained through ${formatFriendlyDate(data.trainEndDate)}`
                  : null}
              </p>
            </ResearchSectionCard>

            <ResearchSectionCard
              title="Current regime performance"
              description={`As of ${formatFriendlyDate(data.asOfDate ?? "")}`}
              icon={Activity}
              className={pageSectionClass}
            >
              <p className="text-sm font-medium text-foreground">
                {data.currentRegime.regimeLabel}
              </p>
              <p className="mt-2 text-sm text-muted">
                Historical Model C in this regime: {data.regimePerformance.label ?? (
                  <>
                    Sharpe {data.regimePerformance.sharpe.toFixed(1)} · IC{" "}
                    {data.regimePerformance.ic >= 0 ? "+" : ""}
                    {data.regimePerformance.ic.toFixed(3)}
                  </>
                )}
              </p>
            </ResearchSectionCard>

            {data.featureDrift.length > 0 ? (
              <ResearchSectionCard
                title="Feature drift"
                icon={AlertTriangle}
                className={pageSectionClass}
              >
                <ul className="space-y-2 text-sm text-foreground">
                  {data.featureDrift.map((flag) => (
                    <li key={flag} className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
                      {flag}
                    </li>
                  ))}
                </ul>
              </ResearchSectionCard>
            ) : null}

            {data.alerts.length > 0 ? (
              <ResearchSectionCard title="Alerts" icon={AlertTriangle} className={pageSectionClass}>
                <ul className="space-y-2">
                  {data.alerts.map((alert) => (
                    <li
                      key={alert.message}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm",
                        alert.severity === "warning"
                          ? "border-warning/30 bg-warning/5 text-warning"
                          : "border-border bg-background/40 text-foreground",
                      )}
                    >
                      {alert.message}
                    </li>
                  ))}
                </ul>
              </ResearchSectionCard>
            ) : null}
          </div>
        ) : null}
      </ProFeatureGate>
    </PageShell>
  );
}
