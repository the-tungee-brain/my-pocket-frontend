import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { TomcrestMark } from "@/components/brand/TomcrestMark";
import { MarketingCanvas } from "@/components/marketing/MarketingPrimitives";
import {
  pageNarrowStandaloneClass,
  pageShellStandaloneClass,
} from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export const SUPPORT_EMAIL = "support@tomcrest.com";

const publicNavLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function PublicNavLinks({
  className,
}: {
  className?: string;
}) {
  return (
    <nav
      className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs", className)}
      aria-label="Site"
    >
      {publicNavLinks.map(({ href, label }, index) => (
        <span key={href} className="inline-flex items-center gap-3">
          {index > 0 ? (
            <span className="text-border select-none" aria-hidden="true">
              ·
            </span>
          ) : null}
          <Link href={href} className="marketing-nav-link">
            {label}
          </Link>
        </span>
      ))}
    </nav>
  );
}

export function PublicMarketingHeader({
  backHref = "/",
  backLabel = "Home",
}: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div
        className={cn(
          pageShellStandaloneClass,
          "flex h-16 items-center justify-between gap-4",
        )}
      >
        <Link href="/" className="inline-flex">
          <TomcrestLogo size="sm" />
        </Link>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {backLabel}
        </Link>
      </div>
    </header>
  );
}

export function PublicMarketingFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <div
        className={cn(
          pageShellStandaloneClass,
          "flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start",
        )}
      >
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-accent-strong">
            <TomcrestMark className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span>Tomcrest — AI portfolio intelligence</span>
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-end">
          <PublicNavLinks />
          <p className="max-w-md text-center text-xs text-muted sm:text-right">
            Insights and recommendations only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PublicMarketingPageShell({ children }: { children: ReactNode }) {
  return (
    <MarketingCanvas className="flex min-h-screen flex-col">
      <PublicMarketingHeader />
      <main className={cn(pageNarrowStandaloneClass, "flex-1 py-12 sm:py-16")}>
        {children}
      </main>
      <PublicMarketingFooter />
    </MarketingCanvas>
  );
}

export function SupportEmailLink({
  subject,
  className,
}: {
  subject?: string;
  className?: string;
}) {
  const href = subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;

  return (
    <a
      href={href}
      className={cn(
        "inline font-medium text-accent-strong hover:underline",
        className,
      )}
    >
      <Mail
        className="mr-1 inline h-3.5 w-3.5 align-[-0.125em] text-accent-strong"
        aria-hidden="true"
      />
      {SUPPORT_EMAIL}
    </a>
  );
}
