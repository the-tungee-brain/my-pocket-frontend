import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardSurface = "default" | "subtle" | "marketing" | "accent" | "accentSoft";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: "section" | "div" | "article";
  surface?: CardSurface;
  interactive?: boolean;
};

const surfaceClass: Record<CardSurface, string> = {
  default: "bg-secondary shadow-sm",
  subtle: "bg-secondary/60 shadow-sm",
  marketing: "bg-background/40 shadow-none",
  accent: "border-accent/30 bg-accent-muted/20 shadow-sm",
  accentSoft: "border-accent/20 bg-accent-muted/40 shadow-sm",
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
        "mx-auto w-full overflow-hidden rounded-2xl border border-border",
        surfaceClass[surface],
        interactive &&
          "transition-colors hover:border-accent/30 hover:bg-background/60",
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
  default: "border-border bg-surface-elevated/50",
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
        "flex items-start justify-between gap-3 px-4 py-3",
        bordered && cn("border-b", headerToneClass[tone]),
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
};

export function CardBody({ children, className, flush = false }: CardBodyProps) {
  return (
    <div className={cn(!flush && "px-4 py-3", className)}>{children}</div>
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
    <div className="flex min-w-0 flex-1 items-start gap-3">
      {icon}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Heading className="text-sm font-semibold text-foreground">{title}</Heading>
          {badge}
        </div>
        {description != null && description !== "" && (
          <div className="text-xs text-muted">{description}</div>
        )}
      </div>
    </div>
  );
}
