"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";
import {
  isLongConversationalContent,
  splitMarkdownSections,
  stripStreamingStatusPrefix,
  type MarkdownSection,
} from "@/lib/conversationalAnalysis";
import { getVisibleAssistantContent } from "@/lib/chatFollowUpSuggestions";
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
  const displayContent = useMemo(
    () => getVisibleAssistantContent(content, isStreaming),
    [content, isStreaming],
  );
  const trimmed = displayContent.trim();

  const sectionedLayout = useMemo(() => {
    if (!trimmed || isStreaming || !isLongConversationalContent(trimmed)) {
      return null;
    }
    const { preamble, sections } = splitMarkdownSections(trimmed);
    if (sections.length < 2) return null;
    return { preamble, sections };
  }, [trimmed, isStreaming]);

  if (isStreaming && !trimmed) {
    return (
      <ThinkingSpinner
        message="Thinking it through"
        className={cn("border-0 bg-transparent px-0 py-1", className)}
      />
    );
  }

  if (isStreaming) {
    return (
      <div className={cn("conversational-analysis", className)}>
        <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-foreground">
          {displayContent}
          <span
            className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse rounded-full bg-accent-strong align-[-0.12em]"
            aria-hidden
          />
        </p>
      </div>
    );
  }

  if (sectionedLayout) {
    return (
      <div className={cn("conversational-analysis space-y-4", className)}>
        {sectionedLayout.preamble && (
          <MarkdownRenderer
            content={sectionedLayout.preamble}
            variant="conversational"
          />
        )}
        <SectionAccordion sections={sectionedLayout.sections} />
      </div>
    );
  }

  return (
    <div className={cn("conversational-analysis", className)}>
      <MarkdownRenderer content={displayContent} variant="conversational" />
    </div>
  );
}
