"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  variant?: "dashed" | "solid";
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "dashed",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl px-6 py-10 text-center",
        variant === "dashed"
          ? "border border-dashed border-border bg-muted-bg/30"
          : "border border-border bg-secondary/60",
        className,
      )}
    >
      <Icon className="mx-auto mb-3 h-8 w-8 text-muted" aria-hidden="true" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
