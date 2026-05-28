"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type ResearchBulletListProps = {
  title?: string;
  items: string[];
  variant?: "default" | "risk" | "watch";
  emptyMessage?: string;
  hideTitle?: boolean;
};

export function ResearchBulletList({
  title,
  items,
  variant = "default",
  emptyMessage,
  hideTitle = false,
}: ResearchBulletListProps) {
  if (items.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div>
        {!hideTitle && title && (
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {title}
          </h3>
        )}
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
      {!hideTitle && title && (
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
      )}
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

export function ResearchAsideCard({
  title,
  children,
  tone = "default",
  className,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "accent" | "watch";
  className?: string;
}) {
  return (
    <Card
      as="div"
      surface={tone === "default" ? "subtle" : "accent"}
      className={cn(
        "mx-0 rounded-xl shadow-sm",
        tone === "watch" && "border-accent/20 bg-accent-muted/20",
        tone === "accent" && "border-accent/25 bg-accent-muted/30",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "px-4 py-2.5",
          tone === "accent"
            ? "border-accent/20"
            : tone === "watch"
              ? "border-accent/15"
              : undefined,
        )}
      >
        <h3
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            tone === "default" ? "text-muted" : "text-accent-strong",
          )}
        >
          {title}
        </h3>
      </CardHeader>
      <CardBody className="px-4 py-3">{children}</CardBody>
    </Card>
  );
}

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
