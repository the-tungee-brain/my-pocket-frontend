"use client";

import { cn } from "@/lib/utils";

type ResearchBulletListProps = {
  title: string;
  items: string[];
  variant?: "default" | "risk" | "watch";
  emptyMessage?: string;
};

export function ResearchBulletList({
  title,
  items,
  variant = "default",
  emptyMessage,
}: ResearchBulletListProps) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  const dotClass =
    variant === "risk"
      ? "bg-danger"
      : variant === "watch"
        ? "bg-accent-strong"
        : "bg-accent-strong";

  const itemClass =
    variant === "risk"
      ? "border-danger/20 bg-danger/5"
      : variant === "watch"
        ? "border-accent/20 bg-accent-muted/40"
        : "border-border bg-surface-elevated/40";

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm leading-relaxed text-foreground",
              itemClass,
            )}
          >
            <span
              className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ResearchTextBlockProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ResearchTextBlock({
  title,
  children,
  className,
}: ResearchTextBlockProps) {
  return (
    <div className={className}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}
