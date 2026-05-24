"use client";

import { ArrowRight } from "lucide-react";
import type { ChatFollowUpSuggestion } from "@/lib/chatFollowUpSuggestions";

type ChatFollowUpChipsProps = {
  suggestions: ChatFollowUpSuggestion[];
  disabled?: boolean;
  onSelect: (prompt: string) => void;
};

export function ChatFollowUpChips({
  suggestions,
  disabled = false,
  onSelect,
}: ChatFollowUpChipsProps) {
  if (!suggestions.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
      <p className="w-full text-[11px] font-medium uppercase tracking-wide text-muted">
        Follow up
      </p>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion.prompt)}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted/40 px-3 py-1.5 text-[11px] font-medium text-accent-strong transition hover:border-accent/50 hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {suggestion.label}
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
