"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  bodyWithoutQuickTakeDuplicate,
  extractQuickTake,
  isLongConversationalContent,
  splitMarkdownSections,
  type MarkdownSection,
} from "@/lib/conversationalAnalysis";
import { cn } from "@/lib/utils";

type ConversationalMarkdownProps = {
  content: string;
  /** True while the assistant is still streaming tokens. */
  isStreaming?: boolean;
  className?: string;
};

function SectionAccordion({
  sections,
  defaultExpandedIndex = 0,
}: {
  sections: MarkdownSection[];
  defaultExpandedIndex?: number;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(sections.length > 0 ? [defaultExpandedIndex] : []),
  );

  const toggle = (index: number) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted">More detail</p>
      {sections.map((section, index) => {
        const isOpen = expanded.has(index);
        return (
          <div
            key={`${section.id}-${index}`}
            className="overflow-hidden rounded-xl border border-border/80 bg-background/40"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition hover:bg-muted-bg/30"
            >
              <span className="text-sm font-medium text-foreground">
                {section.title}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted transition-transform",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {isOpen && section.body && (
              <div className="border-t border-border/60 px-3.5 py-3">
                <MarkdownRenderer
                  content={section.body}
                  variant="conversational"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ConversationalMarkdown({
  content,
  isStreaming = false,
  className,
}: ConversationalMarkdownProps) {
  const trimmed = content.trim();

  const layout = useMemo(() => {
    if (!trimmed || isStreaming) {
      return {
        mode: "stream" as const,
        quickTake: null,
        preamble: trimmed,
        sections: [] as MarkdownSection[],
      };
    }

    const long = isLongConversationalContent(trimmed);
    const quickTake = long ? extractQuickTake(trimmed) : null;
    const { preamble, sections } = splitMarkdownSections(trimmed);
    const body = bodyWithoutQuickTakeDuplicate(
      sections.length > 0 ? preamble : trimmed,
      quickTake,
    );

    if (!long) {
      return {
        mode: "compact" as const,
        quickTake: null,
        preamble: trimmed,
        sections: [],
      };
    }

    if (sections.length >= 2) {
      return {
        mode: "sectioned" as const,
        quickTake,
        preamble: bodyWithoutQuickTakeDuplicate(preamble, quickTake),
        sections,
      };
    }

    return {
      mode: "long-prose" as const,
      quickTake,
      preamble: body,
      sections: [],
    };
  }, [trimmed, isStreaming]);

  if (!trimmed && isStreaming) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Thinking it through…
      </p>
    );
  }

  if (layout.mode === "stream" || layout.mode === "compact") {
    return (
      <div className={cn("conversational-analysis", className)}>
        <MarkdownRenderer content={content} variant="conversational" />
        {isStreaming && (
          <span
            className="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse rounded-full bg-accent align-[-0.15em]"
            aria-hidden
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("conversational-analysis space-y-4", className)}>
      {layout.quickTake && (
        <div className="rounded-xl border border-accent/25 bg-accent-muted/15 px-4 py-3">
          <div className="flex items-start gap-2">
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-accent-strong">
                Quick take
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">
                {layout.quickTake}
              </p>
            </div>
          </div>
        </div>
      )}

      {layout.preamble && (
        <MarkdownRenderer
          content={layout.preamble}
          variant="conversational"
        />
      )}

      {layout.mode === "sectioned" && layout.sections.length > 0 && (
        <SectionAccordion sections={layout.sections} />
      )}
    </div>
  );
}
