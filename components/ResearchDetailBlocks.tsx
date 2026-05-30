"use client";

import type { ReactNode } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { splitIntoParagraphs } from "@/lib/bigPictureArticle";
import {
  appCalloutClass,
  appCalloutLabelClass,
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
    <div className={appCalloutClass}>
      <p className={appCalloutLabelClass}>{title}</p>
      <div className="mt-1">{children}</div>
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

type BulletTone = "default" | "risk" | "watch";

type ResearchBulletListProps = {
  title?: string;
  items: string[];
  variant?: BulletTone;
  /** Bullet color only; row styling follows `variant`. */
  bulletTone?: BulletTone;
  emptyMessage?: string;
  hideTitle?: boolean;
};

function bulletDotClass(tone: BulletTone) {
  return tone === "risk"
    ? "bg-danger"
    : tone === "watch"
      ? "bg-accent-strong"
      : "bg-accent-strong";
}

function bulletItemClass(tone: BulletTone) {
  return tone === "risk"
    ? "border-danger/20 bg-surface-elevated/40"
    : tone === "watch"
      ? "border-accent/20 bg-surface-elevated/40"
      : "border-border bg-surface-elevated/40";
}

function ResearchBulletListItem({
  item,
  variant = "default",
  bulletTone,
  className,
}: {
  item: string;
  variant?: BulletTone;
  bulletTone?: BulletTone;
  className?: string;
}) {
  const dotClass = bulletDotClass(bulletTone ?? variant);
  const itemClass = bulletItemClass(variant);

  return (
    <div
      className={cn(
        appListRowClass,
        "h-full text-foreground",
        itemClass,
        className,
      )}
    >
      <span
        className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dotClass)}
      />
      <span>{item}</span>
    </div>
  );
}

type PairedBulletColumn = {
  title: string;
  items: string[];
  variant?: BulletTone;
  bulletTone?: BulletTone;
};

export function ResearchPairedBulletLists({
  left,
  right,
}: {
  left: PairedBulletColumn;
  right: PairedBulletColumn;
}) {
  if (left.items.length === 0 && right.items.length === 0) {
    return null;
  }

  if (left.items.length === 0) {
    return (
      <ResearchBulletList
        title={right.title}
        items={right.items}
        variant={right.variant}
        bulletTone={right.bulletTone}
      />
    );
  }

  if (right.items.length === 0) {
    return (
      <ResearchBulletList
        title={left.title}
        items={left.items}
        variant={left.variant}
        bulletTone={left.bulletTone}
      />
    );
  }

  const rowCount = Math.max(left.items.length, right.items.length);

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <h3 className={appSectionLabelClass}>{left.title}</h3>
        <h3 className={appSectionLabelClass}>{right.title}</h3>
      </div>
      <div className={cn(appListClass, "mt-3")}>
        {Array.from({ length: rowCount }, (_, index) => {
          const leftItem = left.items[index];
          const rightItem = right.items[index];

          return (
            <div
              key={`${leftItem ?? "left-empty"}-${rightItem ?? "right-empty"}-${index}`}
              className="grid gap-5 sm:grid-cols-2 sm:items-stretch"
            >
              {leftItem ? (
                <ResearchBulletListItem item={leftItem} variant={left.variant} />
              ) : (
                <div aria-hidden className="hidden sm:block" />
              )}
              {rightItem ? (
                <ResearchBulletListItem
                  item={rightItem}
                  variant={right.variant}
                  bulletTone={right.bulletTone}
                />
              ) : (
                <div aria-hidden className="hidden sm:block" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ResearchBulletList({
  title,
  items,
  variant = "default",
  bulletTone,
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

  return (
    <div>
      {!hideTitle && title && (
        <h3 className={appSectionLabelClass}>{title}</h3>
      )}
      <ul className={appListClass}>
        {items.map((item) => (
          <li key={item}>
            <ResearchBulletListItem
              item={item}
              variant={variant}
              bulletTone={bulletTone}
            />
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
