"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CircleDollarSign,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";

function getAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;

  switch (code) {
    case "AccessDenied":
      return "Sign in was cancelled or denied. Please try again.";
    case "Configuration":
      return "Sign in is not configured correctly. Please contact support.";
    case "Verification":
      return "The sign-in link expired or is invalid. Please try again.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Could not complete Google sign in. Please try again.";
    default:
      return "Sign in failed. Please try again.";
  }
}

export default function AuthPage() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    const message = getAuthErrorMessage(callbackError);
    if (message) setSignInError(message);
  }, [callbackError]);

  const handleSignIn = useCallback(async () => {
    setSignInError(null);
    setSigningIn(true);

    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/portfolio",
      });

      if (result?.error) {
        setSignInError(
          getAuthErrorMessage(result.error) ?? "Sign in failed. Please try again.",
        );
        setSigningIn(false);
        return;
      }

      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      setSigningIn(false);
    } catch {
      setSignInError("Something went wrong while starting sign in. Please try again.");
      setSigningIn(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-6 lg:flex-row lg:gap-16 lg:py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted">
            <Sparkles
              className="h-3.5 w-3.5 text-accent-strong"
              aria-hidden="true"
            />
            AI-powered portfolio intelligence
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Analyze your portfolio with{" "}
            <span className="text-accent-strong">AI insights</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            PowerPocket combines real-time brokerage data, market news,
            financial fundamentals, and AI analysis to help you make smarter
            portfolio decisions.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <FeatureCard
              icon={TrendingUp}
              title="Real-time tracking"
              description="Connect Schwab to monitor holdings, positions, and performance."
            />
            <FeatureCard
              icon={BrainCircuit}
              title="AI analysis"
              description="Get buy, hold, sell, and risk-management recommendations."
            />
            <FeatureCard
              icon={BarChart3}
              title="Market insights"
              description="Analyze fundamentals, earnings, trends, and financial news."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Secure integration"
              description="Brokerage APIs connected securely for real-time intelligence."
            />
          </div>

          <div className="mt-8">
            {signInError && (
              <ErrorBanner
                message={signInError}
                onRetry={() => void handleSignIn()}
                className="mb-4 max-w-md"
              />
            )}

            <Button
              onClick={() => void handleSignIn()}
              disabled={signingIn}
              aria-busy={signingIn}
              size="lg"
              className="rounded-xl px-8"
            >
              {signingIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in with Google"
              )}
            </Button>
            <p className="mt-3 text-xs text-muted">
              Connect your Schwab account after signing in.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-md flex-1 lg:max-w-lg"
        >
          <AppPreview />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof TrendingUp;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/60 p-4 transition-colors hover:bg-secondary">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function AppPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-lg shadow-black/10">
      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-border bg-secondary p-3 sm:block">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-background/60 px-2.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
              <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold">
                PowerPocket
              </div>
              <div className="truncate text-[9px] text-muted">
                Portfolio workspace
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <PreviewNavItem
              icon={BriefcaseBusiness}
              label="My portfolio"
              sublabel="Overview"
              active
            />
            <PreviewNavItem
              icon={Search}
              label="Research"
              sublabel="Snapshots"
            />
            <div className="my-2 h-px bg-border" />
            <p className="px-1 text-[9px] font-semibold uppercase tracking-wide text-muted">
              Positions
            </p>
            <PreviewNavItem icon={CircleDollarSign} label="NVDA" mono />
            <PreviewNavItem icon={CircleDollarSign} label="AAPL" mono />
            <PreviewNavItem icon={CircleDollarSign} label="MSFT" mono />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border bg-surface-elevated/50 px-4 py-3">
            <p className="text-xs font-semibold">Portfolio</p>
            <p className="text-[10px] text-muted">3 tracked symbols</p>
          </div>

          <div className="space-y-3 p-4">
            <div className="overflow-hidden rounded-xl border border-border bg-secondary/80">
              <div className="flex items-center gap-2 border-b border-border bg-surface-elevated/50 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted text-accent-strong">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">
                    Portfolio insights
                  </p>
                  <p className="text-[9px] text-muted">AI-generated analysis</p>
                </div>
              </div>
              <div className="space-y-2 px-3 py-3">
                <div className="h-2 w-full rounded-full bg-muted-bg" />
                <div className="h-2 w-4/5 rounded-full bg-muted-bg" />
                <div className="h-2 w-3/5 rounded-full bg-muted-bg" />
              </div>
            </div>

            <PortfolioRow
              symbol="NVDA"
              action="BUY"
              summary="Strong AI growth momentum and positive earnings outlook."
            />
            <PortfolioRow
              symbol="AAPL"
              action="HOLD"
              summary="Stable cash flow with moderate upside potential."
            />
            <PortfolioRow
              symbol="TSLA"
              action="REDUCE"
              summary="High volatility and elevated valuation risk detected."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewNavItem({
  icon: Icon,
  label,
  sublabel,
  mono,
  active,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  sublabel?: string;
  mono?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5",
        active ? "bg-muted-bg" : "",
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3 shrink-0",
          active ? "text-accent-strong" : "text-muted",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className={cn("truncate text-[10px]", mono && "font-mono")}>
          {label}
        </p>
        {sublabel && (
          <p className="truncate text-[9px] text-muted">{sublabel}</p>
        )}
      </div>
      {active && (
        <span className="ml-auto h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
      )}
    </div>
  );
}

function PortfolioRow({
  symbol,
  action,
  summary,
}: {
  symbol: string;
  action: "BUY" | "HOLD" | "REDUCE";
  summary: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-xs font-semibold">{symbol}</h3>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
            {summary}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
            action === "BUY" && "bg-accent-muted text-accent-strong",
            action === "HOLD" && "bg-muted-bg text-muted",
            action === "REDUCE" && "bg-danger/10 text-danger",
          )}
        >
          {action}
        </span>
      </div>
    </div>
  );
}
