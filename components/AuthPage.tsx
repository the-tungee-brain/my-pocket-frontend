"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Bookmark,
  BrainCircuit,
  BriefcaseBusiness,
  CircleDollarSign,
  LineChart,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { TomcrestMark } from "@/components/brand/TomcrestMark";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

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

function useGoogleSignIn() {
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
    track("sign_in_clicked", { provider: "google" });

    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/portfolio",
      });

      if (result?.error) {
        setSignInError(
          getAuthErrorMessage(result.error) ??
            "Sign in failed. Please try again.",
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
      setSignInError(
        "Something went wrong while starting sign in. Please try again.",
      );
      setSigningIn(false);
    }
  }, []);

  return { handleSignIn, signingIn, signInError };
}

export default function AuthPage() {
  const { handleSignIn, signingIn, signInError } = useGoogleSignIn();

  return (
    <div className="min-h-screen scroll-smooth bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-130 w-180 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-80 w-80 rounded-full bg-accent-strong/5 blur-3xl" />
      </div>

      <LandingHeader
        onSignIn={() => void handleSignIn()}
        signingIn={signingIn}
      />

      <main>
        <HeroSection
          onSignIn={() => void handleSignIn()}
          signingIn={signingIn}
          signInError={signInError}
        />

        <FeaturesSection />
        <HowItWorksSection />
        <ProductShowcase />
        <StrategySection />
        <FinalCTASection
          onSignIn={() => void handleSignIn()}
          signingIn={signingIn}
          signInError={signInError}
        />
      </main>

      <LandingFooter />
    </div>
  );
}

function LandingHeader({
  onSignIn,
  signingIn,
}: {
  onSignIn: () => void;
  signingIn: boolean;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
        <TomcrestLogo size="sm" />

        <nav
          className="hidden flex-1 items-center justify-center gap-5 md:flex"
          aria-label="Page sections"
        >
          <LandingNavLink href="#features">Features</LandingNavLink>
          <LandingNavLink href="#how-it-works">How it works</LandingNavLink>
          <LandingNavLink href="#product">Product</LandingNavLink>
        </nav>

        <SignInWithGoogleButton
          onClick={onSignIn}
          signingIn={signingIn}
          size="sm"
          variant="outline"
        />
      </div>
    </header>
  );
}

function HeroSection({
  onSignIn,
  signingIn,
  signInError,
}: {
  onSignIn: () => void;
  signingIn: boolean;
  signInError: string | null;
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-12 lg:pb-24 lg:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted">
            <Sparkles
              className="h-3.5 w-3.5 text-accent-strong"
              aria-hidden="true"
            />
            AI portfolio intelligence for Schwab investors
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Your portfolio,{" "}
            <span className="text-accent-strong">understood by AI</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Tomcrest connects to your Charles Schwab account and turns live
            holdings, market data, and fundamentals into actionable insights —
            from morning briefs and dividend projections to per-symbol research
            and strategy guidance.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SignInWithGoogleButton
              onClick={onSignIn}
              signingIn={signingIn}
              size="lg"
            />
            <p className="text-xs text-muted sm:max-w-48">
              Free to start. Connect Schwab after sign-in.
            </p>
          </div>

          {signInError && (
            <ErrorBanner
              message={signInError}
              onRetry={onSignIn}
              className="mt-4 max-w-md"
            />
          )}

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
            <TrustBadge icon={ShieldCheck} label="Secure OAuth connection" />
            <TrustBadge icon={Zap} label="Real-time Schwab sync" />
            <TrustBadge icon={BrainCircuit} label="Context-aware AI chat" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="lg:justify-self-end"
        >
          <AppPreview />
        </motion.div>
      </div>
    </section>
  );
}

function TrustBadge({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-accent-strong/80" aria-hidden="true" />
      {label}
    </span>
  );
}

function LandingNavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-xs font-medium text-muted transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: BriefcaseBusiness,
      title: "Live portfolio snapshot",
      description:
        "See holdings, allocation, cash reserves, and options exposure pulled directly from Schwab.",
    },
    {
      icon: BellRing,
      title: "Morning brief & alerts",
      description:
        "Start each day with portfolio intelligence, proactive alerts, and items that need attention.",
    },
    {
      icon: BrainCircuit,
      title: "AI analysis on your book",
      description:
        "Streaming portfolio and position analysis with buy, hold, and reduce signals grounded in your data.",
    },
    {
      icon: MessageSquareText,
      title: "Always-on AI chat",
      description:
        "Ask follow-up questions from anywhere — the assistant knows your positions and research context.",
    },
    {
      icon: Search,
      title: "Deep symbol research",
      description:
        "Fundamentals, earnings, dividends, ETF composition, news, SEC filings, and charts — with a watchlist to track names you care about.",
    },
    {
      icon: CircleDollarSign,
      title: "Dividend snowball",
      description:
        "Project income forward with historic payout growth, DRIP scenarios, and portfolio value estimates using price and dividend CAGR.",
    },
    {
      icon: Target,
      title: "Strategy-guided investing",
      description:
        "Follow guided journeys for the wheel, CSP income, covered calls, dividends, and ETF core.",
    },
  ];

  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border bg-secondary/30 py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Everything in one workspace"
          title="Built for investors who want clarity, not noise"
          description="Tomcrest combines brokerage data, market research, and AI so you spend less time tab-hopping and more time making informed decisions."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <FeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: ShieldCheck,
      title: "Sign in with Google",
      description:
        "Create your Tomcrest account in seconds with your Google identity. No passwords to manage.",
    },
    {
      step: "02",
      icon: RefreshCw,
      title: "Connect Charles Schwab",
      description:
        "Link your brokerage via secure OAuth so Tomcrest can read positions, balances, and activity.",
    },
    {
      step: "03",
      icon: Sparkles,
      title: "Get AI-powered insights",
      description:
        "Review your morning brief, model dividend income, explore research, and chat with AI about your actual portfolio.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From sign-in to insights in minutes"
          description="Three steps to turn your Schwab account into an intelligent portfolio workspace."
          centered
        />

        <div className="mt-12 flex flex-col gap-6 md:flex-row md:items-center">
          {steps.flatMap((item, index) => {
            const card = (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="flex-1 rounded-2xl border border-border bg-secondary/60 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                  Step {item.step}
                </p>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent-strong">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </motion.div>
            );

            if (index === steps.length - 1) return [card];

            return [
              card,
              <div
                key={`arrow-${item.step}`}
                className="hidden shrink-0 items-center justify-center self-center px-1 md:flex lg:px-2"
                aria-hidden="true"
              >
                <ArrowRight className="h-5 w-5 text-muted" />
              </div>,
            ];
          })}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  const highlights = [
    {
      icon: TrendingUp,
      label: "Portfolio Today",
      title: "Know what changed overnight",
      description:
        "The Today tab surfaces allocation shifts, attention items, assignment risk for options, and tax-aware alerts like wash-sale warnings.",
    },
    {
      icon: LineChart,
      label: "Research hub",
      title: "Go deep on any symbol",
      description:
        "Overview, fundamentals, earnings, dividends, ETF composition, news, and SEC financials — with AI intelligence tailored to each ticker.",
    },
    {
      icon: CircleDollarSign,
      label: "Dividend snowball",
      title: "Model income years ahead",
      description:
        "Use historic payout growth and optional DRIP to project annual cash, share count, and portfolio value with automatic price CAGR.",
    },
    {
      icon: MessageSquareText,
      label: "AI sidebar",
      title: "Ask questions in context",
      description:
        "Quick actions like “analyze portfolio” or “review NVDA” kick off streaming analysis. Follow up naturally in the same conversation.",
    },
  ];

  return (
    <section
      id="product"
      className="scroll-mt-20 border-t border-border bg-secondary/30 py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Inside the workspace"
          title="Portfolio, research, and AI — side by side"
          description="The same layout you will use every day: navigate holdings, drill into symbols, and chat with AI without losing context."
        />

        <div className="mt-10 space-y-6">
          {highlights.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className={cn(
                "grid items-center gap-6 rounded-2xl border border-border bg-background/40 p-6 lg:grid-cols-[1fr_1.2fr] lg:p-8",
                index % 2 === 1 && "lg:[&>*:first-child]:order-2",
              )}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                  {item.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>

              <ShowcasePanel icon={item.icon} variant={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StrategySection() {
  const strategies = [
    { name: "The Wheel", detail: "CSP → assignment → covered call cycles" },
    { name: "CSP Income", detail: "Cash-secured puts with risk guardrails" },
    { name: "Covered Calls", detail: "Income on existing share positions" },
    {
      name: "Dividend Growth",
      detail: "Snowball projections, yield, and payout history",
    },
    { name: "ETF Core", detail: "Long-term diversified core holdings" },
  ];

  return (
    <section id="strategies" className="scroll-mt-20 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Investment strategies"
            title="Guidance that matches how you invest"
            description="Choose a primary strategy during onboarding and get a guided journey with recommendations aligned to your goals — whether you run the wheel or build a dividend portfolio."
          />

          <div className="space-y-2">
            {strategies.map((strategy, index) => (
              <motion.div
                key={strategy.name}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary/60 px-4 py-3.5 transition-colors hover:bg-secondary"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
                  <Target className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{strategy.name}</p>
                  <p className="text-xs text-muted">{strategy.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection({
  onSignIn,
  signingIn,
  signInError,
}: {
  onSignIn: () => void;
  signingIn: boolean;
  signInError: string | null;
}) {
  return (
    <section className="border-t border-border bg-secondary/30 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-background/60 px-6 py-12 text-center sm:px-12 sm:py-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_60%)]" />

          <div className="relative">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to understand your portfolio?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Join Tomcrest with Google, connect Schwab, and start getting
              AI-powered insights on the holdings you already own.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <SignInWithGoogleButton
                onClick={onSignIn}
                signingIn={signingIn}
                size="lg"
              />
              {signInError && (
                <ErrorBanner
                  message={signInError}
                  onRetry={onSignIn}
                  className="max-w-md text-left"
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row sm:items-start">
        <div className="flex items-center gap-2.5 text-sm text-muted">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-muted text-accent-strong">
            <TomcrestMark className="h-3.5 w-3.5" />
          </div>
          <span>Tomcrest — AI portfolio intelligence</span>
        </div>
        <div className="max-w-md text-center sm:text-right">
          <p className="text-xs text-muted">
            Insights and recommendations only. Not financial advice.
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            Read-only Schwab access via OAuth.{" "}
            <a
              href="/security"
              className="font-medium text-accent-strong hover:underline"
            >
              Security & privacy
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={cn(centered && "mx-auto max-w-2xl text-center")}>
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p
        className={cn(
          "mt-3 text-sm leading-relaxed text-muted sm:text-base",
          centered && "mx-auto",
          !centered && "max-w-2xl",
        )}
      >
        {description}
      </p>
    </div>
  );
}

function SignInWithGoogleButton({
  onClick,
  signingIn,
  size = "lg",
  variant = "default",
}: {
  onClick: () => void;
  signingIn: boolean;
  size?: "sm" | "lg";
  variant?: "default" | "outline";
}) {
  return (
    <Button
      onClick={onClick}
      disabled={signingIn}
      aria-busy={signingIn}
      size={size}
      variant={variant}
      className={cn(
        size === "lg" && "min-w-55 rounded-xl px-8",
        variant === "default" && "shadow-lg shadow-black/20",
      )}
    >
      {signingIn ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Signing in…
        </>
      ) : (
        <>
          <GoogleIcon variant={variant} />
          Sign in with Google
        </>
      )}
    </Button>
  );
}

function GoogleIcon({
  variant = "default",
  className,
}: {
  variant?: "default" | "outline";
  className?: string;
}) {
  return (
    <svg
      className={cn(
        "h-4 w-4 shrink-0",
        variant === "outline" ? "text-accent-strong" : "text-inherit",
        className,
      )}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
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
    <div className="h-full rounded-2xl border border-border bg-background/40 p-5 transition-colors hover:bg-background/60">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function ShowcasePanel({
  icon: Icon,
  variant,
}: {
  icon: typeof TrendingUp;
  variant: number;
}) {
  if (variant === 0) {
    return (
      <div className="rounded-xl border border-border bg-secondary/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
          <span className="text-xs font-semibold">Morning brief</span>
        </div>
        <div className="space-y-2">
          <BriefLine label="Portfolio up 1.2% pre-market" accent />
          <BriefLine label="NVDA earnings in 3 days — review position" />
          <BriefLine label="CSP on AAPL expires Friday — assignment risk low" />
          <BriefLine label="Wash-sale window on TSLA — hold 12 more days" />
        </div>
      </div>
    );
  }

  if (variant === 1) {
    return (
      <div className="rounded-xl border border-border bg-secondary/80 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {["Overview", "Dividends", "Fundamentals", "News"].map((tab, i) => (
            <span
              key={tab}
              className={cn(
                "rounded-md px-2 py-1 text-[10px] font-medium",
                i === 1 ? "bg-accent-muted text-accent-strong" : "text-muted",
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="Dividend streak" value="14 yrs" accent />
          <MetricTile label="Current yield" value="3.4%" />
          <MetricTile label="5Y dividend CAGR" value="9.2%" />
          <MetricTile label="Expense ratio" value="0.06%" />
        </div>
        <div className="mt-3 flex items-end gap-0.5">
          {[40, 55, 48, 62, 58, 72, 68, 80, 75, 88].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-accent/30"
              style={{ height: `${h * 0.4}px` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 2) {
    return (
      <div className="rounded-xl border border-border bg-secondary/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
          <span className="text-xs font-semibold">Income snowball · SCHD</span>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <MetricTile label="5Y dividend CAGR" value="9.2%" accent />
          <MetricTile label="5Y price growth" value="8.8%" />
          <MetricTile label="10-yr total" value="$18.4k" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
            <p className="text-[9px] uppercase tracking-wide text-muted">
              Est. annual dividend · 2036
            </p>
            <p className="mt-1 text-sm font-semibold text-accent-strong">
              $768
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
            <p className="text-[9px] uppercase tracking-wide text-muted">
              Portfolio value
            </p>
            <p className="mt-1 text-sm font-semibold">$31,999</p>
            <p className="mt-0.5 text-[9px] text-muted">After DRIP + growth</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/80 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
        <span className="text-xs font-semibold">AI chat</span>
      </div>
      <div className="space-y-2.5">
        <ChatBubble role="user" text="Analyze my portfolio risk exposure" />
        <ChatBubble
          role="assistant"
          text="Tech is 62% of your portfolio. NVDA and MSFT drive most of the concentration. Consider…"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Analyze NVDA", "Review options", "Tax lots"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-muted"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function BriefLine({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-background/50 px-3 py-2">
      <span
        className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          accent ? "bg-accent-strong" : "bg-muted",
        )}
      />
      <p className="text-[11px] leading-relaxed text-muted">{label}</p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 px-3 py-2">
      <p className="text-[9px] text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-xs font-semibold",
          accent && "text-accent-strong",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ChatBubble({
  role,
  text,
}: {
  role: "user" | "assistant";
  text: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-[11px] leading-relaxed",
        role === "user"
          ? "ml-6 bg-muted-bg text-foreground"
          : "mr-4 border border-border bg-background/60 text-muted",
      )}
    >
      {text}
    </div>
  );
}

function AppPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-2xl shadow-black/25">
      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-border bg-secondary p-3 sm:block">
          <div className="mb-3 rounded-xl border border-border bg-background/60 px-2.5 py-2">
            <TomcrestLogo size="sm" showSubtitle />
          </div>

          <div className="space-y-1">
            <PreviewNavItem
              icon={BriefcaseBusiness}
              label="My portfolio"
              sublabel="Today"
              active
            />
            <PreviewNavItem
              icon={Search}
              label="Research"
              sublabel="Snapshots"
            />
            <PreviewNavItem
              icon={Bookmark}
              label="Watchlist"
              sublabel="5 symbols"
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
            <p className="text-[10px] text-muted">Morning brief · 3 symbols</p>
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
