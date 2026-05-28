import Link from "next/link";
import { Lock, ShieldCheck, Unplug } from "lucide-react";
import { PublicMarketingPageShell } from "@/components/PublicMarketingChrome";
import { SCHWAB_READ_ONLY_LINE } from "@/lib/schwabTrustCopy";

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
    <PublicMarketingPageShell>
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
        Questions?{" "}
        <Link href="/contact" className="font-medium text-accent-strong hover:underline">
          Contact us
        </Link>
        .
      </p>
    </PublicMarketingPageShell>
  );
}
