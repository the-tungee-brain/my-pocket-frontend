"use client";

import { ConversationalMarkdown } from "@/components/ui/ConversationalMarkdown";

type StreamingResearchContentProps = {
  markdown: string;
  isStreaming: boolean;
  statusLabel?: string;
};

export function StreamingResearchContent({
  markdown,
  isStreaming,
  statusLabel = "Still writing…",
}: StreamingResearchContentProps) {
  return (
    <div className="space-y-3">
      <ConversationalMarkdown content={markdown} isStreaming={isStreaming} />
      {isStreaming && markdown.trim().length > 0 && (
        <p className="text-xs text-muted">{statusLabel}</p>
      )}
    </div>
  );
}
