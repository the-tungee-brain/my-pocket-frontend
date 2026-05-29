"use client";

import { BriefcaseBusiness } from "lucide-react";
import {
  useBusinessDetails,
  type BusinessBlock,
} from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchAtAGlanceBox,
  ResearchBulletList,
  ResearchProseText,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { buildBusinessAtAGlance } from "@/lib/businessArticle";
import { appCalloutClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type BusinessSectionProps = {
  symbol: string | null;
};

function BusinessOverviewSkeleton() {
  return (
    <div className="app-stack">
      <div className={cn(appCalloutClass, "space-y-2")}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}

export function BusinessSection({ symbol }: BusinessSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { business, isLoading, error } = useBusinessDetails(symbol, {
    accessToken,
  });

  return (
    <div className="app-stack">
      {error && !business ? <ErrorBanner message={error} /> : null}

      <ResearchSectionCard
        title="Business"
        description="How the company works, competes, and grows"
        icon={BriefcaseBusiness}
      >
        {isLoading && !business ? (
          <BusinessOverviewSkeleton />
        ) : !business ? (
          <p className="text-sm text-muted">Business details are not available.</p>
        ) : (
          <BusinessOverviewContent business={business} />
        )}
      </ResearchSectionCard>
    </div>
  );
}

function BusinessOverviewContent({ business }: { business: BusinessBlock }) {
  const atAGlance = buildBusinessAtAGlance(business);
  const customersText = business.customersAndMarkets?.trim() ?? "";
  const competitiveText = business.competitiveLandscape?.trim() ?? "";
  const moatText = business.moatAndDifferentiators?.trim() ?? "";
  const revenueText = business.revenueNotes?.trim() ?? "";
  const whatTheyDo = business.whatTheyDo?.trim() ?? "";

  return (
    <div className="app-stack">
      {atAGlance.length > 0 ? (
        <ResearchAtAGlanceBox>
          <ul className="space-y-1.5 text-sm font-medium leading-relaxed text-foreground">
            {atAGlance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </ResearchAtAGlanceBox>
      ) : null}

      {business.segments.length > 0 ? (
        <ResearchTextBlock title="Segments">
          <div className="flex flex-wrap gap-2">
            {business.segments.map((segment) => (
              <span
                key={segment}
                className={cn(
                  "inline-flex max-w-full rounded-full border border-border",
                  "bg-surface-elevated/40 px-3 py-1 text-sm leading-snug text-foreground",
                )}
              >
                {segment}
              </span>
            ))}
          </div>
        </ResearchTextBlock>
      ) : null}

      {whatTheyDo ? (
        <ResearchTextBlock title="What they do">
          <ResearchProseText text={whatTheyDo} />
        </ResearchTextBlock>
      ) : null}

      {revenueText ? (
        <ResearchTextBlock title="How they make money">
          <ResearchProseText text={revenueText} />
        </ResearchTextBlock>
      ) : null}

      {customersText ? (
        <ResearchTextBlock title="Customers & markets">
          <ResearchProseText text={customersText} />
        </ResearchTextBlock>
      ) : null}

      {competitiveText ? (
        <ResearchTextBlock title="Competitive landscape">
          <ResearchProseText text={competitiveText} />
        </ResearchTextBlock>
      ) : null}

      {moatText ? (
        <ResearchTextBlock title="Moat & differentiators">
          <ResearchProseText text={moatText} />
        </ResearchTextBlock>
      ) : null}

      {(business.growthDrivers?.length || business.keyRisks?.length) ? (
        <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
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
      ) : null}
    </div>
  );
}
