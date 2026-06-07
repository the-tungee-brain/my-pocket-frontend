"use client";

import Link from "next/link";
import { usePortfolioContext } from "@/app/contextSelectors";
import { usePortfolioNews } from "@/app/hooks/usePortfolioNews";
import { PageShell } from "@/components/PageShell";
import { PortfolioNewsSection } from "@/components/PortfolioNewsSection";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

const sectionClass = pageSectionClass;

export default function PortfolioNewsPage() {
  const { error, sessionAccessToken, schwabReauth } = usePortfolioContext();
  const {
    items,
    loading,
    refreshing,
    error: newsError,
    lastUpdated,
    refetch,
  } = usePortfolioNews(sessionAccessToken, {
    enabled: Boolean(sessionAccessToken),
  });

  return (
    <PageShell className={appStackClass}>
      {schwabReauth && (
        <SchwabConnectionBanner
          message={schwabReauth.message}
          authorizationUrl={schwabReauth.authorizationUrl}
        />
      )}

      {error && !schwabReauth && <ErrorBanner message={error} />}

      <section className={cn(sectionClass, "space-y-3")}>
        <Link
          href="/portfolio"
          className="text-xs font-medium text-muted hover:text-foreground hover:underline"
        >
          ← Back to portfolio
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Portfolio news
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Full holdings news feed
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Recent headlines connected to the symbols in your portfolio.
          </p>
        </div>
      </section>

      {sessionAccessToken ? (
        <PortfolioNewsSection
          className={sectionClass}
          items={items}
          loading={loading}
          refreshing={refreshing}
          error={newsError}
          lastUpdated={lastUpdated}
          onRefresh={() => void refetch()}
        />
      ) : (
        <PortfolioOnboarding className={sectionClass} />
      )}
    </PageShell>
  );
}
