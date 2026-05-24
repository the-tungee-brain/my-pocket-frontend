"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestResearchSearchFocus } from "@/lib/researchSearchFocus";

type Options = {
  onFocus?: () => void;
  enabled?: boolean;
};

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el?.isContentEditable === true
  );
}

export function useResearchSearchShortcut({
  onFocus,
  enabled = true,
}: Options = {}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      const openSearch =
        event.key === "/" ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k");

      if (!openSearch) return;

      event.preventDefault();

      if (onFocus) {
        onFocus();
        return;
      }

      requestResearchSearchFocus();
      router.push("/research");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onFocus, router]);
}
