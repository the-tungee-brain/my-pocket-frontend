"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  Bookmark,
  BrainCircuit,
  BriefcaseBusiness,
  CircleDollarSign,
  LineChart,
  Loader2,
  PieChart,
  RefreshCw,
  Route,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { TomcrestMark } from "@/components/brand/TomcrestMark";
import { LandingPricingSection } from "@/components/AccountPlanCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";
import { pageProseClass, pageShellStandaloneClass } from "@/lib/pageLayout";
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

        <TopFeaturesSection />
        <HowItWorksSection />
        <ProductShowcase />
        <StrategySection />
        <LandingPricingSection />
        <AlsoIncludedSection />
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
      <div className={cn(pageShellStandaloneClass, "flex h-14 items-center justify-between gap-4")}>
        <TomcrestLogo size="sm" />

        <nav
          className="hidden flex-1 items-center justify-center gap-5 md:flex"
          aria-label="Page sections"
        >
          <LandingNavLink href="#features">Features</LandingNavLink>
          <LandingNavLink href="#how-it-works">How it works</LandingNavLink>
          <LandingNavLink href="#product">See it in action</LandingNavLink>
          <LandingNavLink href="#pricing">Pricing</LandingNavLink>
          <LandingNavLink href="#strategies">Strategies</LandingNavLink>
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
    <section className={cn(pageShellStandaloneClass, "relative pb-16 pt-12 lg:pb-24 lg:pt-16")}>
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
            Built for Charles Schwab investors
          </div>

          <h1 className="max-w-xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Know what to do with your{" "}
            <span className="text-accent-strong">Schwab portfolio</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Connect Schwab once. Tomcrest reads your live holdings, balances, and
            options alongside market data — then surfaces what changed and your
            best next step.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SignInWithGoogleButton
              onClick={onSignIn}
              signingIn={signingIn}
              size="lg"
            />
            <p className="text-xs text-muted sm:max-w-52">
              Free to start · read-only Schwab OAuth · no card required
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
            <TrustBadge icon={ShieldCheck} label="Read-only Schwab OAuth" />
            <TrustBadge icon={Zap} label="Live account & market data" />
            <TrustBadge icon={Target} label="Clear next-step guidance" />
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

const TOP_FEATURES = [
  {
    icon: BrainCircuit,
    tag: "Core",
    title: "AI that ends with a next step",
    description:
      "Analyze portfolio or any symbol with streaming answers that cite your weights, options legs, and available buying power — then a ranked recommendation, not a wall of metrics.",
    bullets: [
      "One-click Analyze with a primary move",
      "Deploy, trim, hold, and roll guidance",
      "Follow-up chat with smart chips",
    ],
  },
  {
    icon: BellRing,
    tag: "Daily habit",
    title: "Morning brief & alerts",
    description:
      "Start the day knowing what moved, what needs attention, and the one thing worth doing first.",
    bullets: [
      "Assignment & DTE warnings on short options",
      "Wash-sale and earnings reminders",
      "Attention items ranked by urgency",
    ],
  },
  {
    icon: Route,
    tag: "Options",
    title: "Options-aware decisions",
    description:
      "Built for wheelers and income traders: compare hold vs roll vs close, see premium math, and get playbook verdicts before selling a put.",
    bullets: ["Compare paths on open short puts/calls", "Strategy playbook with Ask AI", "Roll suggestions with cash picture"],
  },
  {
    icon: Search,
    tag: "Research",
    title: "Research without tab-hopping",
    description:
      "Everything for a ticker in one workspace — fundamentals, SEC filings, dividends, news, and ETF composition.",
    bullets: ["AI summaries on overview & business", "Dividend snowball with DRIP scenarios", "Street targets & watchlist"],
  },
] as const;

const ALSO_INCLUDED = [
  {
    icon: Target,
    title: "Strategy screener",
    description: "Preset screens aligned to wheel, dividend, and ETF core playbooks.",
  },
  {
    icon: PieChart,
    title: "Allocation & deploy plans",
    description: "Trim and deploy suggestions ranked by diversification impact.",
  },
  {
    icon: Scale,
    title: "Tax-aware prompts",
    description: "Wash-sale windows, lot context, and harvest angles in chat.",
  },
  {
    icon: Bookmark,
    title: "Watchlist & snapshots",
    description: "Track symbols and jump into research from anywhere.",
  },
  {
    icon: LineChart,
    title: "SEC + market data",
    description: "Filed financials, ratios, and live quotes alongside AI context.",
  },
  {
    icon: RefreshCw,
    title: "Guided strategy journeys",
    description: "Onboarding flows for wheel, CSP, covered call, dividend, and ETF core.",
  },
] as const;

function TopFeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-border bg-secondary/30 py-16 lg:py-20"
    >
      <div className={pageShellStandaloneClass}>
        <SectionHeading
          eyebrow="Why investors sign up"
          title="Four things you can't get from a generic chatbot"
          description="Tomcrest is opinionated for Schwab: your positions feed every insight — and every reply points toward a decision."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {TOP_FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <TopFeatureCard {...feature} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopFeatureCard({
  icon: Icon,
  tag,
  title,
  description,
  bullets,
}: {
  icon: typeof BrainCircuit;
  tag: string;
  title: string;
  description: string;
  bullets: readonly string[];
}) {
  return (
    <Card as="div" surface="marketing" interactive className="h-full p-6 hover:bg-background/70">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-muted text-accent-strong">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <span className="rounded-full border border-border bg-secondary/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          {tag}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <ul className="mt-4 space-y-1.5">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-start gap-2 text-xs leading-relaxed text-muted"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
            {bullet}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AlsoIncludedSection() {
  return (
    <section className="scroll-mt-20 border-t border-border py-14 lg:py-16">
      <div className={pageShellStandaloneClass}>
        <SectionHeading
          eyebrow="Also included"
          title="The full workspace, not a single feature"
          description="Everything below ships today — same account, same Schwab connection."
          centered
        />

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALSO_INCLUDED.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <FeatureCard {...item} />
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
      <div className={pageShellStandaloneClass}>
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
      label: "Portfolio · Today",
      title: "Wake up to what matters",
      description:
        "The Today view combines your morning brief, allocation snapshot, and attention items — assignment risk on short options, earnings dates, wash-sale windows, and concentration flags.",
    },
    {
      icon: Route,
      label: "Options · Compare paths",
      title: "Hold, roll, or close — with numbers",
      description:
        "For open short puts and calls, see side-by-side outcomes: keep premium, roll for credit, or buy to close — with strike, DTE, and cash impact spelled out.",
    },
    {
      icon: Target,
      label: "Strategy · Playbook",
      title: "Ask AI before your next wheel step",
      description:
        "Pick wheel, CSP, dividend, or ETF core — get a guided journey, stock screener presets, and one-click Ask AI verdicts like “Would I hold this if assigned on a put?”",
    },
  ];

  return (
    <section
      id="product"
      className="scroll-mt-20 border-t border-border bg-secondary/30 py-16 lg:py-20"
    >
      <div className={pageShellStandaloneClass}>
        <SectionHeading
          eyebrow="See it in action"
          title="From morning brief to your next move"
          description="Not just dashboards — Tomcrest ranks what matters and suggests what to do, whether that's rolling a put or trimming concentration."
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
    {
      name: "The Wheel",
      detail: "CSP → assignment → covered call — with playbook Ask AI",
    },
    {
      name: "CSP Income",
      detail: "Cash-secured puts with assignment comfort checks",
    },
    {
      name: "Covered Calls",
      detail: "Premium on shares you already own",
    },
    {
      name: "Dividend Growth",
      detail: "Snowball projections, payout ratio, and FCF coverage",
    },
    {
      name: "ETF Core",
      detail: "Long-term core targets with screener presets",
    },
  ];

  return (
    <section id="strategies" className="scroll-mt-20 py-16 lg:py-20">
      <div className={pageShellStandaloneClass}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading
            eyebrow="Investment strategies"
            title="Playbooks for how you actually invest"
            description="Choose a primary strategy at onboarding — Tomcrest tailors screener presets, journey steps, and Ask AI prompts to wheel income, dividends, or ETF core building."
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
      <div className={pageShellStandaloneClass}>
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
              Start with the portfolio you already have
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
              Sign in with Google, connect Schwab read-only, and get your first
              morning brief and AI analysis in minutes.
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
      <div className={cn(pageShellStandaloneClass, "flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start")}>
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
    <div className={cn(centered && cn(pageProseClass, "text-center"))}>
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
          !centered && pageProseClass,
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
    <Card as="div" surface="marketing" interactive className="h-full p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
    </Card>
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
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
            <span className="text-xs font-semibold">AAPL · Mar 21 $225 put</span>
          </div>
          <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[9px] font-medium text-accent-strong">
            12 DTE
          </span>
        </div>
        <div className="space-y-2">
          <ComparePathRow
            label="Hold to expiry"
            detail="Keep ~$420 premium if AAPL stays above $225"
            active
          />
          <ComparePathRow
            label="Roll out & down"
            detail="Apr $220 put · est. +$180 net credit"
          />
          <ComparePathRow
            label="Buy to close"
            detail="~$95 debit · free capital now"
          />
        </div>
      </div>
    );
  }

  if (variant === 2) {
    return (
      <div className="rounded-xl border border-border bg-secondary/80 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent-strong" aria-hidden="true" />
          <span className="text-xs font-semibold">Wheel playbook · SBUX</span>
        </div>
        <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
            Verdict
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-foreground">
            Cautious — comfortable on business, but premium is thin vs assignment risk.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Review risks", "Suggest put zone", "Check FCF"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] text-muted"
            >
              {chip}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-accent-muted px-3 py-2 text-[10px] font-semibold text-accent-strong"
          tabIndex={-1}
        >
          Ask AI · Research before selling a put
        </button>
      </div>
    );
  }

  return null;
}

function ComparePathRow({
  label,
  detail,
  active,
}: {
  label: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        active
          ? "border-accent/40 bg-accent-muted/30"
          : "border-border bg-background/50",
      )}
    >
      <p className="text-[11px] font-semibold">{label}</p>
      <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{detail}</p>
    </div>
  );
}

function BriefLine({
  label,
  accent,
  muted,
}: {
  label: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg px-3 py-2",
        accent
          ? "border border-accent/25 bg-accent-muted/25"
          : "bg-background/50",
        muted && "opacity-60",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
          accent ? "bg-accent-strong" : "bg-muted",
        )}
      />
      <p
        className={cn(
          "text-[11px] leading-relaxed",
          accent ? "font-medium text-foreground" : "text-muted",
        )}
      >
        {label}
      </p>
    </div>
  );
}

function AppPreview() {
  const briefLines = [
    {
      label: "Next: review NVDA size before Thu earnings",
      accent: true,
    },
    { label: "AAPL CSP expires Fri · 12 DTE", accent: false },
    { label: "Portfolio +0.8% pre-market · tech-led", accent: false },
  ] as const;

  const [activeBrief, setActiveBrief] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveBrief((current) => (current + 1) % briefLines.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [briefLines.length]);

  return (
    <Card
      as="div"
      surface="subtle"
      className="shadow-2xl shadow-black/25"
    >
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
            <PreviewNavItem icon={CircleDollarSign} label="NVDA" mono pulse />
            <PreviewNavItem icon={CircleDollarSign} label="AAPL" mono />
            <PreviewNavItem icon={CircleDollarSign} label="MSFT" mono />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="border-b border-border bg-surface-elevated/50 px-4 py-3">
            <p className="text-xs font-semibold">Portfolio · Today</p>
            <p className="text-[10px] text-muted">Morning brief · 3 attention items</p>
          </div>

          <div className="space-y-3 p-4">
            <div className="overflow-hidden rounded-xl border border-border bg-secondary/80">
              <div className="flex items-center gap-2 border-b border-border bg-surface-elevated/50 px-3 py-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted text-accent-strong">
                  <BellRing className="h-3 w-3" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">Morning brief</p>
                  <p className="text-[9px] text-muted">Updated pre-market</p>
                </div>
              </div>
              <div className="space-y-1.5 px-3 py-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeBrief}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.28 }}
                  >
                    <BriefLine
                      label={briefLines[activeBrief].label}
                      accent={briefLines[activeBrief].accent}
                    />
                  </motion.div>
                </AnimatePresence>
                {briefLines.map((line, index) =>
                  index === activeBrief ? null : (
                    <BriefLine key={line.label} label={line.label} muted />
                  ),
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <PortfolioRow
                symbol="NVDA"
                tag="32% weight"
                summary="Largest position — concentration above 20% target."
                highlight
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
            >
              <PortfolioRow
                symbol="AAPL"
                tag="Short put"
                summary="Mar $225 put · assignment risk low at current price."
              />
            </motion.div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function PreviewNavItem({
  icon: Icon,
  label,
  sublabel,
  mono,
  active,
  pulse,
}: {
  icon: typeof BriefcaseBusiness;
  label: string;
  sublabel?: string;
  mono?: boolean;
  active?: boolean;
  pulse?: boolean;
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
      {pulse && (
        <span className="relative ml-auto flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-strong/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-strong" />
        </span>
      )}
    </div>
  );
}

function PortfolioRow({
  symbol,
  tag,
  summary,
  highlight,
}: {
  symbol: string;
  tag: string;
  summary: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5",
        highlight
          ? "border-accent/25 bg-accent-muted/15"
          : "border-border bg-background/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-xs font-semibold">{symbol}</h3>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
            {summary}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted-bg px-2 py-0.5 text-[10px] font-medium text-muted">
          {tag}
        </span>
      </div>
    </div>
  );
}
