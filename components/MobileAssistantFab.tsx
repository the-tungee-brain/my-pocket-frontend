"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { openAssistantChat, scrollToChat } from "@/lib/scrollToChat";

type MobileAssistantFabProps = {
  visible?: boolean;
  className?: string;
};

export function MobileAssistantFab({
  visible = true,
  className,
}: MobileAssistantFabProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Open AI assistant"
      onClick={() => {
        openAssistantChat();
        scrollToChat();
      }}
      className={cn(
        "fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 flex h-12 w-12 -translate-x-1/2 items-center justify-center border border-accent/40 bg-accent-strong text-background shadow-lg shadow-black/25 transition hover:scale-105 hover:opacity-95 active:scale-95 md:hidden",
        className,
      )}
    >
      <Sparkles className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
