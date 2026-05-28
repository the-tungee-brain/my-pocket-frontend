"use client";

import { BriefcaseBusiness } from "lucide-react";
import { useBusinessDetails } from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";
import {
  ResearchBulletList,
  ResearchTextBlock,
  ResearchAsideCard,
} from "@/components/ResearchDetailBlocks";
import { PageSplit } from "@/components/PageShell";
import { StreamingResearchContent } from "@/components/StreamingResearchContent";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";

type BusinessSectionProps = {
  symbol: string | null;
};

export function BusinessSection({ symbol }: BusinessSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { business, streamMarkdown, isStreaming, isLoading, error } =
    useBusinessDetails(symbol, {
      accessToken,
    });

  if (isLoading && !business && !streamMarkdown) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (error && !business && !streamMarkdown) {
    return <ErrorBanner message={error} />;
  }

  if (!business && streamMarkdown) {
    return (
      <div className="space-y-4">
        <BusinessPageHeader />
        <StreamingResearchContent
          markdown={streamMarkdown}
          isStreaming={isStreaming}
          statusLabel="Generating business overview…"
        />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="space-y-4">
        <BusinessPageHeader />
        <p className="text-sm text-muted">Business details are not available.</p>
      </div>
    );
  }

  const hasAside =
    business.segments.length > 0 || !!business.moatAndDifferentiators;

  return (
    <div className="space-y-6">
      <BusinessPageHeader />

      <div className="rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
          What they do
        </h3>
        <p className="text-sm leading-relaxed text-foreground">
          {business.whatTheyDo}
        </p>
      </div>

      <PageSplit
        main={
          <>
            <ResearchTextBlock title="How they make money">
              <p>{business.revenueNotes}</p>
            </ResearchTextBlock>

            {business.customersAndMarkets && (
              <ResearchTextBlock title="Customers & markets">
                <p>{business.customersAndMarkets}</p>
              </ResearchTextBlock>
            )}

            {business.competitiveLandscape && (
              <ResearchTextBlock title="Competitive landscape">
                <p>{business.competitiveLandscape}</p>
              </ResearchTextBlock>
            )}
          </>
        }
        aside={
          hasAside ? (
            <>
              {business.segments.length > 0 && (
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
              )}

              {business.moatAndDifferentiators && (
                <ResearchAsideCard title="Moat & differentiators" tone="accent">
                  <p className="text-sm leading-relaxed text-foreground">
                    {business.moatAndDifferentiators}
                  </p>
                </ResearchAsideCard>
              )}
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
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-muted text-accent-strong">
        <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          How this business makes money
        </h2>
        <p className="mt-0.5 text-[11px] text-muted">
          Business model, segments, competition, and growth drivers
        </p>
      </div>
    </div>
  );
}
