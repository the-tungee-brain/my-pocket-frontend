"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LoadingRegionProps = {
  label?: string;
  children: ReactNode;
  className?: string;
};

/** Wraps loading placeholders with screen-reader announcements. */
export function LoadingRegion({
  label = "Loading",
  children,
  className,
}: LoadingRegionProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={cn(className)}
    >
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}
