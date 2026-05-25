"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onClick: () => void;
  className?: string;
  label?: string;
  disabled?: boolean;
};

export function AskAIChip({
  onClick,
  className,
  label = "Ask AI",
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        onClick();
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent-muted/50 px-2 py-0.5 text-[10px] font-semibold text-accent-strong transition hover:border-accent/50 hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </button>
  );
}
