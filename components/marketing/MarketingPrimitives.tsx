import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { pageProseClass } from "@/lib/pageLayout";

export function MarketingCanvas({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("marketing-canvas min-h-screen text-foreground", className)}>
      {children}
    </div>
  );
}

export function MarketingEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("marketing-eyebrow", className)}>{children}</p>;
}

export function MarketingDisplayTitle({
  children,
  className,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return <Tag className={cn("marketing-display", className)}>{children}</Tag>;
}

export function MarketingLead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("marketing-lead", className)}>{children}</p>;
}

export function MarketingSection({
  id,
  children,
  className,
  band = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Subtle band background like Mistral feature blocks */
  band?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "marketing-section",
        band && "marketing-section--band",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  centered = false,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  centered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(centered && cn(pageProseClass, "text-center"), className)}
    >
      <MarketingEyebrow>{eyebrow}</MarketingEyebrow>
      <MarketingDisplayTitle
        as="h2"
        className={cn(
          "mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]",
          centered && "mx-auto",
        )}
      >
        {title}
      </MarketingDisplayTitle>
      <MarketingLead
        className={cn("mt-4 max-w-2xl", centered && "mx-auto")}
      >
        {description}
      </MarketingLead>
    </div>
  );
}

export function MarketingBentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** First tile is hero-sized on large screens (Mistral-style bento). */
export function MarketingBentoCell({
  children,
  className,
  featured = false,
}: {
  children: ReactNode;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        featured && "md:col-span-2 lg:col-span-7 lg:row-span-2",
        !featured && "lg:col-span-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MarketingBentoCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("marketing-bento-card", className)}>{children}</div>;
}

/** Bottom-of-page sign-in CTA — matches bento cards + teal marketing glow. */
export function MarketingCTACard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("marketing-cta-card text-center", className)}>
      {children}
    </div>
  );
}
