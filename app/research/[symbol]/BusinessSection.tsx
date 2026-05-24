"use client";

import { useBusinessDetails } from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";
import {
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import { StreamingResearchContent } from "@/components/StreamingResearchContent";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

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
    return <p className="text-sm text-muted">Loading business details…</p>;
  }

  if (error && !business && !streamMarkdown) {
    return <ErrorBanner message={error} />;
  }

  if (!business && streamMarkdown) {
    return (
      <StreamingResearchContent
        markdown={streamMarkdown}
        isStreaming={isStreaming}
        statusLabel="Generating business overview…"
      />
    );
  }

  if (!business) {
    return (
      <p className="text-sm text-muted">Business details are not available.</p>
    );
  }

  return (
    <div className="space-y-6">
      <ResearchTextBlock title="What they do">
        <p>{business.whatTheyDo}</p>
      </ResearchTextBlock>

      {business.segments.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Business segments
          </h3>
          <ul className="space-y-2">
            {business.segments.map((seg) => (
              <li
                key={seg}
                className="rounded-lg border border-border bg-surface-elevated/40 px-3 py-2 text-sm leading-relaxed text-foreground"
              >
                {seg}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {business.moatAndDifferentiators && (
        <ResearchTextBlock title="Moat & differentiators">
          <p>{business.moatAndDifferentiators}</p>
        </ResearchTextBlock>
      )}

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
  );
}
