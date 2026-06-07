import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export const researchMemo = {
  pageGap: "space-y-9",
  sectionGap: "space-y-4",
  rowPadding: "py-3",
  sectionTitle: "text-[11px] font-semibold uppercase tracking-wide text-muted",
  decisionHeadline:
    "text-sm font-semibold leading-relaxed tracking-normal text-foreground",
  decisionConclusion: "text-sm font-medium leading-relaxed text-foreground",
  rowLabel: "text-[11px] font-semibold uppercase tracking-wide text-muted",
  rowStatus: "text-sm font-semibold text-foreground",
  rowBody: "text-sm leading-relaxed text-muted",
  meta: "text-xs font-medium uppercase tracking-wide text-muted",
  divider: "border-border/60",
};

type ResearchSectionProps = {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ResearchSection({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: ResearchSectionProps) {
  return (
    <section className={cn("w-full max-w-none", className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className={researchMemo.sectionTitle}>{title}</h2>
          {subtitle ? (
            <p className={cn("mt-1 max-w-3xl", researchMemo.rowBody)}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn(researchMemo.sectionGap, bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

type ResearchRowProps = {
  label: string;
  status?: ReactNode;
  body?: ReactNode;
  href?: string;
  loading?: boolean;
  error?: ReactNode;
  tone?: "default" | "positive" | "negative" | "muted";
  className?: string;
};

export function ResearchRow({
  label,
  status,
  body,
  href,
  loading = false,
  error,
  tone = "default",
  className,
}: ResearchRowProps) {
  const statusClass =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
        ? "text-danger"
        : tone === "muted"
          ? "text-muted"
          : "text-foreground";

  const row = (
    <div
      className={cn(
        "grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6",
        researchMemo.rowPadding,
        className,
      )}
    >
      <p className={researchMemo.rowLabel}>{label}</p>
      {loading ? (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-full max-w-lg" />
        </div>
      ) : error ? (
        <p className={researchMemo.rowBody}>{error}</p>
      ) : (
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {status ? (
              <p className={cn(researchMemo.rowStatus, statusClass)}>
                {status}
              </p>
            ) : null}
            {href ? (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-muted"
                aria-hidden
              />
            ) : null}
          </div>
          {body ? (
            <p className={cn("mt-1", researchMemo.rowBody)}>{body}</p>
          ) : null}
        </div>
      )}
    </div>
  );

  if (!href) return row;

  return (
    <Link href={href} className="block transition hover:bg-muted/20">
      {row}
    </Link>
  );
}

export type ResearchMetricListItem = {
  label: string;
  value: ReactNode;
  note?: ReactNode;
};

type ResearchMetricListProps = {
  items: ResearchMetricListItem[];
  columns?: 2 | 3 | 4;
  className?: string;
};

export function ResearchMetricList({
  items,
  columns = 3,
  className,
}: ResearchMetricListProps) {
  if (!items.length) return null;

  const columnClass =
    columns === 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : columns === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <dl className={cn("grid gap-x-8 gap-y-3", columnClass, className)}>
      {items.map((item) => (
        <div key={String(item.label)} className="min-w-0">
          <dt className={researchMemo.rowLabel}>{item.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-foreground">
            {item.value}
          </dd>
          {item.note ? (
            <dd className={cn("mt-1", researchMemo.rowBody)}>{item.note}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

type ResearchDecisionBlockProps = {
  headline: ReactNode;
  conclusion?: ReactNode;
  meta?: ReactNode;
  why?: string[];
  className?: string;
};

export function ResearchDecisionBlock({
  headline,
  conclusion,
  meta,
  why = [],
  className,
}: ResearchDecisionBlockProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <p className={researchMemo.decisionHeadline}>{headline}</p>
        {conclusion ? (
          <p className={cn("max-w-4xl", researchMemo.decisionConclusion)}>
            {conclusion}
          </p>
        ) : null}
        {meta ? <p className={researchMemo.meta}>{meta}</p> : null}
      </div>

      {why.length ? (
        <div className="border-t border-border/60 pt-4">
          <p className={researchMemo.rowLabel}>Why</p>
          <ul className="mt-2 max-w-4xl space-y-1.5 text-sm leading-relaxed text-foreground">
            {why.slice(0, 3).map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 bg-muted"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
