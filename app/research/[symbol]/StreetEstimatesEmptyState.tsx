"use client";

import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { RESEARCH_CARD_EMPTY_STATE_CLASS } from "./StreetAnalysisEmptyState";

export function StreetEstimatesEmptyState() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Analyst estimates unavailable"
      description="Next-quarter EPS and revenue consensus aren't available for this symbol on Yahoo Finance right now."
      variant="solid"
      className={RESEARCH_CARD_EMPTY_STATE_CLASS}
    />
  );
}
