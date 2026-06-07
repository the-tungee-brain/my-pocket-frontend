import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { appIconBoxClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type ResearchSectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  titleHref?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

type ResearchSectionProps = {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ResearchSectionCard({
  title,
  description,
  icon: Icon,
  action,
  titleHref,
  children,
  className,
  bodyClassName,
}: ResearchSectionCardProps) {
  const titleNode = titleHref ? (
    <Link
      href={titleHref}
      className="text-foreground transition hover:text-accent-strong hover:underline"
    >
      {title}
    </Link>
  ) : (
    title
  );

  return (
    <Card surface="subtle" className={cn("w-full max-w-none", className)}>
      <CardHeader>
        <CardTitle
          title={titleNode}
          description={description}
          icon={
            Icon ? (
              <div className={appIconBoxClass}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            ) : undefined
          }
        />
        {action ? (
          <div className="flex shrink-0 items-center">{action}</div>
        ) : null}
      </CardHeader>
      <CardBody spacious className={bodyClassName}>
        {children}
      </CardBody>
    </Card>
  );
}

export function ResearchSection({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: ResearchSectionProps) {
  return (
    <section className={cn("w-full max-w-none", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-border/60 pb-2">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
