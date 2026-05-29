import type { HTMLAttributes, ReactNode } from "react";
import {
  appPanelBodyClass,
  appPanelBodyLgClass,
  appPanelClass,
  appPanelHeaderClass,
  appPanelSubtleClass,
} from "@/lib/appUi";
import { cn } from "@/lib/utils";

type CardSurface = "default" | "subtle" | "marketing" | "accent" | "accentSoft";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "div" | "article";
  surface?: CardSurface;
  interactive?: boolean;
};

const surfaceClass: Record<CardSurface, string> = {
  default: appPanelClass,
  subtle: appPanelSubtleClass,
  marketing:
    "w-full max-w-none overflow-hidden rounded-2xl border border-border bg-background/40 shadow-none",
  accent:
    "w-full max-w-none overflow-hidden rounded-lg border border-accent/30 bg-accent-muted/20 shadow-sm",
  accentSoft:
    "w-full max-w-none overflow-hidden rounded-lg border border-accent/20 bg-accent-muted/40 shadow-sm",
};

export function Card({
  children,
  className,
  as: Tag = "section",
  surface = "default",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        surfaceClass[surface],
        interactive &&
          "transition-colors hover:border-accent/35 hover:bg-surface-elevated/80",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "danger" | "warning";
  bordered?: boolean;
};

const headerToneClass = {
  default: "",
  danger: "border-danger/30 bg-danger/5",
  warning: "border-warning/20 bg-warning-muted",
};

export function CardHeader({
  children,
  className,
  tone = "default",
  bordered = true,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        appPanelHeaderClass,
        bordered && "border-b",
        bordered && tone === "default" && "border-border/50",
        tone !== "default" && headerToneClass[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardBodyProps = {
  children: ReactNode;
  className?: string;
  flush?: boolean;
  spacious?: boolean;
};

export function CardBody({
  children,
  className,
  flush = false,
  spacious = false,
}: CardBodyProps) {
  return (
    <div
      className={cn(
        !flush && (spacious ? appPanelBodyLgClass : appPanelBodyClass),
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  title,
  description,
  icon,
  badge,
  headingLevel = 2,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  headingLevel?: 1 | 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {icon}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
            {title}
          </Heading>
          {badge}
        </div>
        {description != null && description !== "" && (
          <p className="mt-0.5 text-xs leading-snug text-muted">{description}</p>
        )}
      </div>
    </div>
  );
}
