"use client";

import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { splitIntoParagraphs } from "@/lib/bigPictureArticle";
import {
  appEyebrowClass,
  appHighlightClass,
  appListClass,
  appListRowClass,
  appSectionLabelClass,
} from "@/lib/appUi";
import { cn } from "@/lib/utils";

export function ResearchAtAGlanceBox({
  title = "At a glance",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className={appHighlightClass}>
      <h3 className={cn("mb-2", appEyebrowClass)}>{title}</h3>
      {children}
    </div>
  );
}

export function ResearchProseText({ text }: { text: string }) {
  const paragraphs = splitIntoParagraphs(text.trim());
  if (paragraphs.length === 0) return null;

  return (
    <>
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
    </>
  );
}

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
          <h3 className={appSectionLabelClass}>{title}</h3>
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
        <h3 className={appSectionLabelClass}>{title}</h3>
      )}
      <ul className={appListClass}>
        {items.map((item) => (
          <li
            key={item}
            className={cn(appListRowClass, "text-foreground", itemClass)}
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
        "mx-0",
        tone === "watch" && "border-accent/20 bg-accent-muted/20",
        tone === "accent" && "border-accent/25 bg-accent-muted/30",
        className,
      )}
    >
      <CardHeader
        className={cn(
          tone === "accent"
            ? "border-accent/20"
            : tone === "watch"
              ? "border-accent/15"
              : undefined,
        )}
      >
        <h3
          className={cn(
            appSectionLabelClass,
            "mb-0",
            tone === "default" ? "text-muted" : "text-accent-strong",
          )}
        >
          {title}
        </h3>
      </CardHeader>
      <CardBody>{children}</CardBody>
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
      <h3 className={appSectionLabelClass}>{title}</h3>
      <div className="text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}
