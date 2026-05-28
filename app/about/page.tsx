import Link from "next/link";
import type { Metadata } from "next";
import { PublicMarketingPageShell } from "@/components/PublicMarketingChrome";

export const metadata: Metadata = {
  title: "About — Tomcrest",
  description: "What Tomcrest is and who it is for.",
};

export default function AboutPage() {
  return (
    <PublicMarketingPageShell>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
        About
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        AI portfolio intelligence for individual investors
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        Tomcrest connects to your brokerage (read-only via Schwab OAuth), builds
        a picture of your holdings, and helps you research positions, track
        dividends, and ask questions grounded in your actual portfolio — not
        generic market chatter.
      </p>

      <section className="mt-10 space-y-6">
        <div className="rounded-2xl border border-border bg-secondary/40 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">What we do</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>Morning brief and portfolio-aware alerts</li>
            <li>Company research, fundamentals, and news in one place</li>
            <li>AI chat that knows your positions and watchlist context</li>
            <li>Dividend and allocation views tied to your holdings</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-background/60 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">What we don&apos;t do</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>Place trades or move money — read-only access only</li>
            <li>Provide personalized financial, tax, or legal advice</li>
            <li>Guarantee accuracy of third-party market or company data</li>
          </ul>
        </div>
      </section>

      <p className="mt-8 text-sm text-muted">
        <Link href="/contact" className="font-medium text-accent-strong hover:underline">
          Contact us
        </Link>{" "}
        with questions, or read{" "}
        <Link href="/security" className="font-medium text-accent-strong hover:underline">
          security & privacy
        </Link>
        .{" "}
        <Link href="/" className="font-medium text-accent-strong hover:underline">
          Sign in
        </Link>{" "}
        to open the app.
      </p>
    </PublicMarketingPageShell>
  );
}
