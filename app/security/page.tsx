import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Unplug } from "lucide-react";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { SCHWAB_READ_ONLY_LINE } from "@/lib/schwabTrustCopy";
import {
  pageNarrowStandaloneClass,
} from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

const sections = [
  {
    icon: ShieldCheck,
    title: "Read-only brokerage access",
    body: "Tomcrest connects to Charles Schwab through OAuth. You sign in on Schwab’s site; Tomcrest does not receive or store your Schwab credentials. The connection is read-only: we can view positions, balances, and order history to power portfolio insights, but we cannot place trades, move money, or change your account.",
  },
  {
    icon: Lock,
    title: "What we access",
    body: "When you connect Schwab, Tomcrest reads account holdings, cash balances, open options, and recent orders. This data is used for portfolio snapshots, morning briefs, dividend projections, and AI answers grounded in your actual positions. We do not sell your brokerage data.",
  },
  {
    icon: Unplug,
    title: "Disconnect anytime",
    body: "Remove access from Settings in Tomcrest, or revoke Tomcrest from your Schwab account settings. After disconnect, we stop syncing new data. Historical chat and preferences in Tomcrest may remain until you delete your account.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div
          className={cn(
            pageNarrowStandaloneClass,
            "flex h-14 items-center justify-between gap-4",
          )}
        >
          <Link href="/" className="inline-flex">
            <TomcrestLogo size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </header>

      <main className={cn(pageNarrowStandaloneClass, "py-10 sm:py-14")}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
          Security & privacy
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          How Tomcrest handles your data
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          {SCHWAB_READ_ONLY_LINE} This page explains what we access, what we
          never do, and how to disconnect.
        </p>

        <div className="mt-10 space-y-6">
          {sections.map(({ icon: Icon, title, body }) => (
            <section
              key={title}
              className="rounded-2xl border border-border bg-secondary/40 p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-muted text-accent-strong">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {body}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-background/60 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Sign-in & AI features
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
            <li>
              You sign in to Tomcrest with Google. We use your account to save
              preferences, watchlists, and chat history.
            </li>
            <li>
              AI responses are generated from your portfolio and research context.
              They are for informational purposes only — not financial advice.
            </li>
            <li>
              Market and company data come from third-party providers; accuracy
              is not guaranteed.
            </li>
          </ul>
        </section>

        <p className="mt-8 text-xs text-muted">
          Questions? Contact us through the support channel listed on tomcrest.com
          when available.
        </p>
      </main>
    </div>
  );
}
