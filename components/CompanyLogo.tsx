"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveResearchLogoUrl } from "@/lib/logoUrl";

type CompanyLogoProps = {
  symbol: string;
  logo?: string | null;
  size?: "sm" | "md";
  className?: string;
  /** ETFs rarely have issuer logos — show a themed icon instead of a broken image. */
  isEtf?: boolean;
};

const sizeClasses: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-7 w-7 rounded-md p-1",
  md: "h-10 w-10 rounded-lg p-1.5",
};

const iconSizeClasses: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
};

export function CompanyLogo({
  symbol,
  logo,
  size = "md",
  className,
  isEtf = false,
}: CompanyLogoProps) {
  if (isEtf) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-accent/25 bg-accent-muted text-accent-strong ring-1 ring-accent/15",
          sizeClasses[size],
          className,
        )}
        title={`${symbol} ETF`}
      >
        <Layers className={iconSizeClasses[size]} aria-hidden />
        <span className="sr-only">{symbol} ETF</span>
      </div>
    );
  }

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
