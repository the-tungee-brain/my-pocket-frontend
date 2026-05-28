import Link from "next/link";
import type { Metadata } from "next";
import {
  PublicMarketingPageShell,
  SupportEmailLink,
} from "@/components/PublicMarketingChrome";
import { SCHWAB_READ_ONLY_LINE } from "@/lib/schwabTrustCopy";

export const metadata: Metadata = {
  title: "Contact — Tomcrest",
  description: "Get in touch with the Tomcrest team.",
};

export default function ContactPage() {
  return (
    <PublicMarketingPageShell>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
        Contact
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        We&apos;d like to hear from you
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
        Questions about sign-in, Schwab connection, billing, or how Tomcrest
        works? Email us and we&apos;ll get back to you as soon as we can.
      </p>

      <section className="mt-10 rounded-2xl border border-border bg-secondary/40 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">Email</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <SupportEmailLink subject="Tomcrest support" />
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          For Pro access or account issues, include the Google email you use to
          sign in so we can find your account faster.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-background/60 p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-foreground">
          Before you write
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <Link href="/security" className="font-medium text-accent-strong hover:underline">
              Security & privacy
            </Link>{" "}
            — how Schwab OAuth works, what we read, and how to disconnect.
          </li>
          <li>
            Tomcrest provides portfolio insights and AI answers for
            informational purposes only — not financial advice.
          </li>
          <li>{SCHWAB_READ_ONLY_LINE}</li>
        </ul>
      </section>

      <p className="mt-8 text-sm text-muted">
        Ready to try the app?{" "}
        <Link href="/" className="font-medium text-accent-strong hover:underline">
          Sign in on the home page
        </Link>
        .
      </p>
    </PublicMarketingPageShell>
  );
}
