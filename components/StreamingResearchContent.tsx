"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

type StreamingResearchContentProps = {
  markdown: string;
  isStreaming: boolean;
  statusLabel?: string;
};

export function StreamingResearchContent({
  markdown,
  isStreaming,
  statusLabel = "Generating…",
}: StreamingResearchContentProps) {
  return (
    <div className="space-y-3">
      <MarkdownRenderer content={markdown} />
      {isStreaming && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          {statusLabel}
        </p>
      )}
    </div>
  );
}
