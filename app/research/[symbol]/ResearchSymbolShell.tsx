"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { CompanySnapshot } from "./CompanySnapshot";
import { ResearchTabBar } from "@/components/ResearchTabBar";
import { addRecentSymbol } from "@/lib/recentSymbols";
import { useResearchSearchShortcut } from "@/app/hooks/useResearchSearchShortcut";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  children: React.ReactNode;
};

export function ResearchSymbolShell({ symbol, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useResearchSearchShortcut();

  useEffect(() => {
    addRecentSymbol(symbol);
  }, [symbol]);

  useEffect(() => {
    const root = document.getElementById("main-content");
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCollapsed(!entry.isIntersecting),
      { root, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl pb-2">
      <div
        ref={sentinelRef}
        className="pointer-events-none h-px"
        aria-hidden="true"
      />

      <div
        className={cn(
          "sticky top-0 z-20 -mx-4 bg-background/95 px-4 backdrop-blur-md transition-[padding] duration-200",
          collapsed ? "pb-2 pt-1.5" : "pb-3 pt-2",
        )}
      >
        {!collapsed && (
          <Link
            href="/research"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to search
          </Link>
        )}

        <div className={cn("space-y-3", collapsed && "space-y-2")}>
          <CompanySnapshot symbol={symbol} compact={collapsed} />
          <ResearchTabBar symbol={symbol} />
        </div>
      </div>

      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}
