"use client";

import { Target } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/** Padding for empty states rendered inside ResearchSectionCard body. */
export const RESEARCH_CARD_EMPTY_STATE_CLASS =
  "border-0 bg-transparent px-0 py-4";

export function StreetAnalysisEmptyState() {
  return (
    <EmptyState
      icon={Target}
      title="Wall Street data unavailable"
      description="Analyst ratings, price targets, and estimates aren't available for this symbol on Yahoo Finance right now."
      variant="solid"
      className={RESEARCH_CARD_EMPTY_STATE_CLASS}
    />
  );
}
