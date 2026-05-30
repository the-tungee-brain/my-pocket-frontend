"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { appTabBarSurfaceClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { finnhubStockLogoUrl, resolveResearchLogoUrl } from "@/lib/logoUrl";

type CompanyLogoProps = {
  symbol: string;
  logo?: string | null;
  size?: "sm" | "md";
  className?: string;
  /** ETFs rarely have issuer logos — show a themed icon instead of a broken image. */
  isEtf?: boolean;
};

const etfContainerClasses: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-7 w-7 rounded-md p-1",
  md: "h-10 w-10 rounded-lg p-1.5",
};

const stockTileClasses: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-7 w-7 rounded-md p-1",
  md: "h-10 w-10 rounded-lg p-1.5",
};

const iconSizeClasses: Record<NonNullable<CompanyLogoProps["size"]>, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
};

function stockLogoTileClassName(
  size: NonNullable<CompanyLogoProps["size"]>,
  className?: string,
) {
  return cn(
    "flex shrink-0 items-center justify-center",
    appTabBarSurfaceClass,
    stockTileClasses[size],
    className,
  );
}

function StockLogoFallback({
  symbol,
  size,
  className,
}: {
  symbol: string;
  size: NonNullable<CompanyLogoProps["size"]>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        stockLogoTileClassName(size, className),
        "font-semibold uppercase text-muted",
        size === "sm" ? "text-[10px]" : "text-xs",
      )}
      aria-hidden
    >
      {symbol.trim().slice(0, 1) || "?"}
    </div>
  );
}

export function CompanyLogo({
  symbol,
  logo,
  size = "md",
  className,
  isEtf = false,
}: CompanyLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = resolveResearchLogoUrl(symbol, logo);
  const finnhubFallback = finnhubStockLogoUrl(symbol);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (isEtf) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-accent/25 bg-accent-muted text-accent-strong ring-1 ring-accent/15",
          etfContainerClasses[size],
          className,
        )}
        title={`${symbol} ETF`}
      >
        <Layers className={iconSizeClasses[size]} aria-hidden />
        <span className="sr-only">{symbol} ETF</span>
      </div>
    );
  }

  if (imageFailed) {
    return <StockLogoFallback symbol={symbol} size={size} className={className} />;
  }

  return (
    <div className={stockLogoTileClassName(size, className)}>
      <img
        src={src}
        alt=""
        className="h-full w-full object-contain drop-shadow-[0_0_1px_rgba(255,255,255,0.35)]"
        onError={(event) => {
          if (event.currentTarget.src !== finnhubFallback) {
            event.currentTarget.src = finnhubFallback;
            return;
          }
          setImageFailed(true);
        }}
      />
    </div>
  );
}
