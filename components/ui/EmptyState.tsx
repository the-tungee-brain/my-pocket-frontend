"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { appIconBoxClass } from "@/lib/appUi";

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
        "rounded-lg px-6 py-10 text-center",
        variant === "dashed"
          ? "border border-dashed border-border bg-muted-bg/30"
          : "border border-border bg-secondary/60",
        className,
      )}
    >
      <div
        className={cn(
          appIconBoxClass,
          "mx-auto mb-3 h-10 w-10 rounded-lg text-muted",
        )}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
