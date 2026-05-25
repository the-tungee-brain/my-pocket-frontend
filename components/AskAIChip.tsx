"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onClick: () => void;
  className?: string;
  label?: string;
};

export function AskAIChip({ onClick, className, label = "Ask AI" }: Props) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent-muted/50 px-2 py-0.5 text-[10px] font-semibold text-accent-strong transition hover:border-accent/50 hover:bg-accent-muted",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </button>
  );
}
