"use client";

import { useState, type ReactNode } from "react";
import { BriefcaseBusiness } from "lucide-react";
import { useBusinessDetails } from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";
import { ResearchBulletList } from "@/components/ResearchDetailBlocks";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  buildBusinessAtAGlance,
  BUSINESS_PROSE_PREVIEW_SENTENCES,
  BUSINESS_REVENUE_PREVIEW_SENTENCES,
  splitIntoSentences,
} from "@/lib/businessArticle";
import { splitIntoParagraphs } from "@/lib/bigPictureArticle";
import { pageArticleClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type BusinessSectionProps = {
  symbol: string | null;
};

function BusinessAtAGlance({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="business-tab__at-a-glance" aria-labelledby="business-at-a-glance">
      <h3 id="business-at-a-glance" className="business-tab__at-a-glance-title">
        At a glance
      </h3>
      <ul className="business-tab__at-a-glance-list">
        {items.map((item) => (
          <li key={item}>
            <span className="business-tab__at-a-glance-dot" aria-hidden>
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessSegmentChips({ segments }: { segments: string[] }) {
  if (segments.length === 0) return null;

  return (
    <div aria-labelledby="business-segments">
      <h3 id="business-segments" className="business-tab__segments-label">
        Segments
      </h3>
      <ul className="business-tab__segments">
        {segments.map((seg) => (
          <li key={seg}>
            <span className="business-tab__segment-chip">{seg}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BusinessExpandableProse({
  text,
  previewSentences = BUSINESS_PROSE_PREVIEW_SENTENCES,
  startExpanded = false,
}: {
  text: string;
  previewSentences?: number;
  startExpanded?: boolean;
}) {
  const trimmed = text.trim();
  const [expanded, setExpanded] = useState(startExpanded);

  if (!trimmed) return null;

  const sentences = splitIntoSentences(trimmed);
  const isTruncatable = !startExpanded && sentences.length > previewSentences;
  const showFull = startExpanded || expanded || !isTruncatable;
  const displayText = showFull
    ? trimmed
    : sentences.slice(0, previewSentences).join(" ");
  const paragraphs = splitIntoParagraphs(displayText);

  return (
    <div>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="business-tab__p">
          {paragraph}
        </p>
      ))}
      {isTruncatable ? (
        <button
          type="button"
          className="business-tab__expand-btn"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function BusinessSubBlock({
  title,
  children,
  callout = false,
}: {
  title: string;
  children: ReactNode;
  callout?: boolean;
}) {
  if (callout) {
    return (
      <div className="business-tab__callout">
        <h4 className="business-tab__callout-title">{title}</h4>
        {children}
      </div>
    );
  }

  return (
    <div className="business-tab__block">
      <h4 className="business-tab__block-title">{title}</h4>
      {children}
    </div>
  );
}

function BusinessChapter({
  title,
  id,
  children,
}: {
  title: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="business-tab__chapter" aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className="business-tab__chapter-title">
        {title}
      </h3>
      <div className="business-tab__chapter-body">{children}</div>
    </section>
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
      <div className={cn("business-tab space-y-4", pageArticleClass)} aria-hidden>
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className={pageArticleClass}>
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!business) {
    return (
      <div className={cn("business-tab space-y-4", pageArticleClass)}>
        <BusinessPageHeader />
        <p className="text-sm text-muted">Business details are not available.</p>
      </div>
    );
  }

  const atAGlance = buildBusinessAtAGlance(business);
  const customersText = business.customersAndMarkets?.trim() ?? "";
  const competitiveText = business.competitiveLandscape?.trim() ?? "";
  const moatText = business.moatAndDifferentiators?.trim() ?? "";
  const hasEdge = competitiveText.length > 0 || moatText.length > 0;
  const hasModel = !!business.revenueNotes?.trim() || customersText.length > 0;

  return (
    <div className={cn("business-tab space-y-6", pageArticleClass)}>
      <BusinessPageHeader />

      <BusinessAtAGlance items={atAGlance} />

      <div className="business-tab__hook" aria-labelledby="business-hook">
        <h3 id="business-hook" className="business-tab__hook-title">
          What they do
        </h3>
        <BusinessExpandableProse text={business.whatTheyDo} />
      </div>

      <BusinessSegmentChips segments={business.segments} />

      {hasModel ? (
        <BusinessChapter title="The model" id="business-model">
          {business.revenueNotes?.trim() ? (
            <BusinessSubBlock title="How they make money">
              <BusinessExpandableProse
                text={business.revenueNotes}
                previewSentences={BUSINESS_REVENUE_PREVIEW_SENTENCES}
              />
            </BusinessSubBlock>
          ) : null}

          {customersText ? (
            <BusinessSubBlock title="Customers & markets">
              <BusinessExpandableProse text={customersText} />
            </BusinessSubBlock>
          ) : null}
        </BusinessChapter>
      ) : null}

      {hasEdge ? (
        <BusinessChapter title="The edge" id="business-edge">
          {competitiveText ? (
            <BusinessSubBlock title="Competitive landscape">
              <BusinessExpandableProse text={competitiveText} />
            </BusinessSubBlock>
          ) : null}

          {moatText ? (
            <BusinessSubBlock title="Moat & differentiators" callout>
              <BusinessExpandableProse text={moatText} />
            </BusinessSubBlock>
          ) : null}
        </BusinessChapter>
      ) : null}

      <section
        id="business-outlook"
        className="business-tab__outlook grid gap-6 lg:grid-cols-2 lg:items-start"
      >
        <ResearchBulletList
          title="Growth drivers"
          items={business.growthDrivers ?? []}
        />
        <ResearchBulletList
          title="Business risks"
          items={business.keyRisks ?? []}
          variant="risk"
        />
      </section>
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
            How the company works, competes, and grows
          </p>
        </div>
      </div>
    </header>
  );
}
