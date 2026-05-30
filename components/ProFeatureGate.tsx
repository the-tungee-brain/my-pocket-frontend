"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import type { ProFeatureId } from "@/lib/planFeatures";
import { PRO_FEATURE_LABELS } from "@/lib/planFeatures";
import { cn } from "@/lib/utils";

type Props = {
  feature: ProFeatureId;
  allowed: boolean;
  /** Shown when allowed; omit for upsell-only (aside) placements. */
  children?: ReactNode;
  className?: string;
  /** Override default title from PRO_FEATURE_LABELS */
  title?: string;
  description?: string;
};

export function ProFeatureGate({
  feature,
  allowed,
  children,
  className,
  title,
  description,
}: Props) {
  if (allowed) {
    return children ? <>{children}</> : null;
  }

  const meta = PRO_FEATURE_LABELS[feature];

  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-muted-bg/40 px-4 py-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted/50 text-accent-strong">
          <Lock className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {title ?? meta.title}
            <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
              Pro
            </span>
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {description ?? meta.description}
          </p>
          <p className="mt-2 text-xs text-muted">
            Free includes portfolio analysis, research data, assistant chat on
            free-tier models, and strategy playbooks. AI earnings, news, and
            financial synthesis require Pro.
          </p>
          <Link
            href="/settings?tab=account"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Upgrade in Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
