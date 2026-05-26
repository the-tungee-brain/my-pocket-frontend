"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { StructuredAnalysis } from "@/app/types/analysis";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { cn } from "@/lib/utils";

type Props = {
  analysis: StructuredAnalysis;
  loading?: boolean;
  className?: string;
  /** When true, sections are supplementary (e.g. money map card is shown above). */
  hideDetailLabel?: boolean;
};

export function StructuredAnalysisView({
  analysis,
  loading = false,
  className,
  hideDetailLabel = false,
}: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    () => new Set(analysis.sections.length > 0 ? [0] : []),
  );

  const toggleSection = (index: number) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
        <p className="text-[11px] font-medium text-muted">Overview</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {analysis.summary}
        </p>
      </div>

      {analysis.recommendedAction && (
        <div className="rounded-xl border border-accent/30 bg-accent-muted/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-accent-strong">
                What I&apos;d do next
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {analysis.recommendedAction.title}
                {analysis.recommendedAction.symbol && (
                  <span className="ml-1.5 font-mono text-accent-strong">
                    {analysis.recommendedAction.symbol}
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {analysis.recommendedAction.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {analysis.sections.length > 0 && (
        <div className="space-y-2">
          {!hideDetailLabel && (
            <p className="text-[11px] font-medium text-muted">More detail</p>
          )}
          {analysis.sections.map((section, index) => {
            const expanded = expandedSections.has(index);

            return (
              <div
                key={`${section.id ?? section.title}-${index}`}
                className="overflow-hidden rounded-xl border border-border bg-background/50"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleSection(index)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted-bg/40"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted transition-transform",
                      expanded && "rotate-180",
                    )}
                    aria-hidden
                  />
                </button>

                {expanded && (
                  <div className="border-t border-border/70 px-4 py-3">
                    {section.body && (
                      <div className="text-sm leading-relaxed text-muted">
                        <MarkdownRenderer
                          content={section.body}
                          variant="conversational"
                        />
                      </div>
                    )}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul
                        className={cn(
                          "space-y-1.5 text-sm leading-relaxed text-muted",
                          section.body && "mt-3",
                        )}
                      >
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span
                              className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-strong"
                              aria-hidden
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <p className="text-[11px] text-muted">Still writing…</p>
      )}
    </div>
  );
}
