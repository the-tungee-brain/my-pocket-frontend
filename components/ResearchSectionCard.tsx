import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ResearchSectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  titleHref?: string;
  children: React.ReactNode;
  className?: string;
};

export function ResearchSectionCard({
  title,
  description,
  icon: Icon,
  action,
  titleHref,
  children,
  className,
}: ResearchSectionCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold">
              {titleHref ? (
                <Link
                  href={titleHref}
                  className="text-foreground transition hover:text-accent-strong hover:underline"
                >
                  {title}
                </Link>
              ) : (
                <span className="text-foreground">{title}</span>
              )}
            </h2>
            {description && (
              <p className="text-[11px] text-muted">{description}</p>
            )}
          </div>
        </div>
        {action ? (
          <div className="flex shrink-0 items-center">{action}</div>
        ) : null}
      </div>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}
