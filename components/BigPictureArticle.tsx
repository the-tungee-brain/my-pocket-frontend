"use client";

import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildBigPictureSections,
  buildKeyTakeaways,
  type BigPictureSection,
} from "@/lib/bigPictureArticle";
import type { StockSummary } from "@/app/hooks/useStockSummary";

type BigPictureArticleProps = {
  summary: StockSummary;
  symbol: string;
  className?: string;
};

function sentimentClasses(sentiment: StockSummary["sentiment"]) {
  return sentiment === "Bullish"
    ? "border-accent/30 bg-accent-muted text-accent-strong"
    : sentiment === "Bearish"
      ? "border-danger/30 bg-danger/10 text-danger"
      : "border-border bg-muted-bg text-muted";
}

function ArticleBullets({ items }: { items: string[] }) {
  return (
    <ul className="big-picture-article__bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function ArticleSection({ section }: { section: BigPictureSection }) {
  return (
    <section
      id={section.id}
      className="big-picture-article__section scroll-mt-28"
      aria-labelledby={`${section.id}-heading`}
    >
      <h2 id={`${section.id}-heading`} className="big-picture-article__h2">
        {section.title}
      </h2>

      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="big-picture-article__p">
          {paragraph}
        </p>
      ))}

      {section.bullets && section.bullets.length > 0 ? (
        <ArticleBullets items={section.bullets} />
      ) : null}

      {section.callout ? (
        <blockquote className="big-picture-article__callout">
          {section.callout}
        </blockquote>
      ) : null}
    </section>
  );
}

export function BigPictureArticle({
  summary,
  symbol,
  className,
}: BigPictureArticleProps) {
  const keyTakeaways = buildKeyTakeaways(summary);
  const sections = buildBigPictureSections(summary);
  const showToc = sections.length >= 4;

  return (
    <article
      className={cn("big-picture-article", className)}
      aria-label={`${symbol} big picture`}
    >
      <header className="big-picture-article__header">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <Info className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Big picture</h2>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
                sentimentClasses(summary.sentiment),
              )}
            >
              {summary.sentiment}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            AI overview — thesis, valuation, strengths, and risks
          </p>
        </div>
      </header>

      <div className="big-picture-article__summary" aria-labelledby="key-takeaways">
        <h3 id="key-takeaways" className="big-picture-article__summary-title">
          Key takeaways
        </h3>
        <ul className="big-picture-article__takeaways">
          {keyTakeaways.map((point) => (
            <li key={point}>
              <span className="big-picture-article__check" aria-hidden>
                ✓
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {showToc ? (
        <nav className="big-picture-article__toc" aria-label="Article contents">
          <p className="big-picture-article__toc-label">On this page</p>
          <ul>
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {sections.map((section) => (
        <ArticleSection key={section.id} section={section} />
      ))}
    </article>
  );
}
