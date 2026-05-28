"use client";

import { cn } from "@/lib/utils";
import { resolveResearchLogoUrl } from "@/lib/logoUrl";

type CompanyLogoProps = {
  symbol: string;
  logo?: string | null;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-7 w-7 rounded-md p-1",
  md: "h-10 w-10 rounded-lg p-1.5",
};

export function CompanyLogo({
  symbol,
  logo,
  size = "md",
  className,
}: CompanyLogoProps) {
  const src = resolveResearchLogoUrl(symbol, logo);

  return (
    <div
      className={cn(
        "shrink-0 overflow-hidden border border-border bg-surface-elevated ring-1 ring-border/40",
        sizeClasses[size],
        className,
      )}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain"
        onError={(event) => {
          const fallback = resolveResearchLogoUrl(symbol);
          if (!event.currentTarget.src.includes("finnhubimage/stock_logo")) {
            event.currentTarget.src = fallback;
          }
        }}
      />
    </div>
  );
}
