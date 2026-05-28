"use client";

import type { ReactNode } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { useBusinessDetails } from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";
import {
  ResearchBulletList,
  ResearchAsideCard,
} from "@/components/ResearchDetailBlocks";
import { PageSplit } from "@/components/PageShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type BusinessSectionProps = {
  symbol: string | null;
};

function BusinessCollapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="business-tab__details" open={defaultOpen || undefined}>
      <summary className="business-tab__details-summary">{title}</summary>
      <div className="mt-2 text-sm leading-relaxed text-foreground">{children}</div>
    </details>
  );
}

export function BusinessSection({ symbol }: BusinessSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { business, isLoading, error } = useBusinessDetails(symbol, {
    accessToken,
  });

  if (isLoading && !business) {
    return (
      <div className={cn("business-tab space-y-4", pageSectionClass)} aria-hidden>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className={pageSectionClass}>
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!business) {
    return (
      <div className={cn("business-tab space-y-4", pageSectionClass)}>
        <BusinessPageHeader />
        <p className="text-sm text-muted">Business details are not available.</p>
      </div>
    );
  }

  const hasAside =
    business.segments.length > 0 || !!business.moatAndDifferentiators;

  return (
    <div className={cn("business-tab space-y-5", pageSectionClass)}>
      <BusinessPageHeader />

      <div className="business-tab__hook" aria-labelledby="business-hook">
        <h3 id="business-hook" className="business-tab__hook-title">
          What they do
        </h3>
        <p className="text-sm leading-relaxed text-foreground">
          {business.whatTheyDo}
        </p>
      </div>

      <PageSplit
        main={
          <div className="space-y-2">
            <BusinessCollapsible title="How they make money" defaultOpen>
              <p>{business.revenueNotes}</p>
            </BusinessCollapsible>

            {business.customersAndMarkets ? (
              <BusinessCollapsible title="Customers & markets">
                <p>{business.customersAndMarkets}</p>
              </BusinessCollapsible>
            ) : null}

            {business.competitiveLandscape ? (
              <BusinessCollapsible title="Competitive landscape">
                <p>{business.competitiveLandscape}</p>
              </BusinessCollapsible>
            ) : null}
          </div>
        }
        aside={
          hasAside ? (
            <>
              {business.segments.length > 0 ? (
                <ResearchAsideCard title="Business segments">
                  <ul className="space-y-2">
                    {business.segments.map((seg) => (
                      <li
                        key={seg}
                        className="rounded-lg border border-border bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground"
                      >
                        {seg}
                      </li>
                    ))}
                  </ul>
                </ResearchAsideCard>
              ) : null}

              {business.moatAndDifferentiators ? (
                <ResearchAsideCard title="Moat & differentiators" tone="accent">
                  <p className="text-sm leading-relaxed text-foreground">
                    {business.moatAndDifferentiators}
                  </p>
                </ResearchAsideCard>
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ResearchBulletList
          title="Growth drivers"
          items={business.growthDrivers ?? []}
        />
        <ResearchBulletList
          title="Business risks"
          items={business.keyRisks ?? []}
          variant="risk"
        />
      </div>
    </div>
  );
}

function BusinessPageHeader() {
  return (
    <header className="business-tab__header">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Business</h2>
          <p className="mt-0.5 text-xs text-muted">
            Model, segments, competition, and growth drivers
          </p>
        </div>
      </div>
    </header>
  );
}
