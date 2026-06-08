import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LegalSection({
  title,
  children,
  id,
}: {
  title: string;
  children: ReactNode;
  id?: string;
}) {
  const sectionId =
    id ??
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <section
      id={sectionId}
      className="border border-border bg-secondary/40 p-5 sm:p-6"
    >
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}

export function LegalDocumentIntro({
  lastUpdated,
  summary,
  className,
}: {
  lastUpdated: string;
  summary: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs text-muted">Last updated: {lastUpdated}</p>
      <p className="text-sm leading-relaxed text-muted sm:text-base">
        {summary}
      </p>
      <p className="border border-dashed border-border bg-background/60 px-3 py-2.5 text-xs leading-relaxed text-muted">
        These documents describe how Tomcrest works today. They are not legal
        advice; consider having qualified counsel review them before you rely on
        them for regulatory or commercial obligations.
      </p>
    </div>
  );
}
