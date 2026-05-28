"use client";

import Link from "next/link";
import { Clock3, Mail } from "lucide-react";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { PublicMarketingFooter } from "@/components/PublicMarketingChrome";
import { pageContentClass, pageShellStandaloneClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-130 w-180 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className={cn(pageShellStandaloneClass, "flex items-center justify-between py-4")}>
          <Link href="/" className="inline-flex items-center gap-2">
            <TomcrestLogo className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      <main
        className={cn(
          pageShellStandaloneClass,
          "relative z-10 flex min-h-[calc(100vh-4.5rem)] items-center py-12",
        )}
      >
        <div className={cn(pageContentClass, "w-full")}>
          <div className="rounded-2xl border border-border bg-secondary/60 p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-muted text-accent-strong">
              <Clock3 className="h-6 w-6" aria-hidden="true" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              You&apos;re on the waitlist
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Tomcrest is in a small private beta with room for 5 active users
              right now. We saved your Google account and will email you when a
              spot opens.
            </p>

            <div className="mt-6 space-y-3 rounded-xl border border-border/80 bg-background/50 px-4 py-3 text-sm text-muted">
              <div className="flex items-start gap-3">
                <Mail
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                  aria-hidden="true"
                />
                <p>
                  No action needed. Try signing in again later — if a spot is
                  open, you&apos;ll go straight to the app.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-semibold transition-colors hover:bg-muted-bg hover:text-foreground"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <PublicMarketingFooter />
    </div>
  );
}
