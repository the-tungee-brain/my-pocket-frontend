"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AccountPlan } from "@/app/types/account";
import {
  MarketingDisplayTitle,
  MarketingEyebrow,
  MarketingLead,
  MarketingSection,
} from "@/components/marketing/MarketingPrimitives";
import { pageProseClass, pageShellStandaloneClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type AccountPlanCardProps = {
  plan: AccountPlan | null;
  loading?: boolean;
  className?: string;
};

const FREE_FEATURES = [
  "Portfolio sync, morning brief, and strategy playbooks",
  "Research essentials: quotes, SEC filings, earnings history, news headlines",
  "Dividend history charts, allocation tools, and playbooks",
  "AI chat with Simple & Standard models",
] as const;

const PRO_FEATURES = [
  "AI earnings analysis (quarterly summaries & takeaways)",
  "AI news research (brief, sentiment, coverage analysis)",
  "Financial strength & fundamental AI on Research",
  "Income snowball (DRIP projections & contributions)",
  "Wheel backtest with trade log and PDF export",
  "Advanced AI models (gpt-5.1, gpt-4o, gpt-5.4, o3, and more)",
] as const;

export function AccountPlanCard({
  plan,
  loading = false,
  className,
}: AccountPlanCardProps) {
  if (loading && !plan) {
    return (
      <Card surface="subtle" className={cn("mx-0", className)}>
        <CardBody className="space-y-3 p-4 sm:p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </CardBody>
      </Card>
    );
  }

  const isPaid = plan?.isPaid ?? false;
  const freeModel = plan?.freeModel ?? "gpt-4.1-mini";

  return (
    <Card surface="subtle" className={cn("mx-0", className)}>
      <CardBody className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Tomcrest plan</p>
            <p className="mt-0.5 text-sm text-muted">
              {isPaid
                ? "You have access to every AI model in Tomcrest."
                : "Free includes Simple and Standard models; default is " +
                  `${freeModel}.`}
            </p>
          </div>
          <Badge variant={isPaid ? "accent" : "muted"}>
            {isPaid ? "Pro" : "Free"}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <PlanFeatureList
            title="Free"
            price="$0"
            active={!isPaid}
            features={FREE_FEATURES}
            footnote={`Simple & Standard models for chat and playbooks. Research headlines, filings, and earnings history are free; AI earnings, news, and financial strength are Pro. Defaults to ${freeModel}.`}
          />
          <PlanFeatureList
            title="Pro"
            price="Invite only"
            active={isPaid}
            features={PRO_FEATURES}
            footnote="Billing is not wired yet — we enable Pro manually for early users."
          />
        </div>

        {!isPaid && (
          <div className="rounded-xl border border-border bg-background/50 px-3 py-3 text-sm text-muted">
            <p className="font-medium text-foreground">Want Advanced models?</p>
            <p className="mt-1 text-xs leading-relaxed">
              Pro unlocks the Advanced tier (gpt-5.4, o3, and more). Reply from
              Settings or email support to request access while billing is in
              beta.
            </p>
            <a
              href="mailto:support@tomcrest.com?subject=Tomcrest%20Pro%20access"
              className="mt-2 inline-flex text-xs font-medium text-accent-strong hover:underline"
            >
              Request Pro access →
            </a>
          </div>
        )}

        {isPaid && (
          <p className="flex items-center gap-2 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent-strong" aria-hidden />
            Model picker includes Simple, Standard, and Advanced tiers.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function PlanFeatureList({
  title,
  price,
  active,
  features,
  footnote,
}: {
  title: string;
  price: string;
  active: boolean;
  features: readonly string[];
  footnote: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        active
          ? "border-accent/30 bg-accent-muted/20"
          : "border-border bg-background/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 text-sm font-semibold text-foreground">{title}</p>
        <p className="shrink-0 whitespace-nowrap text-xs font-medium text-muted">
          {price}
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-xs leading-relaxed text-muted"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
            {feature}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{footnote}</p>
    </div>
  );
}

export function LandingPricingSection() {
  return (
    <MarketingSection id="pricing">
      <div className={pageShellStandaloneClass}>
        <div className={cn(pageProseClass, "text-center")}>
          <MarketingEyebrow>Pricing</MarketingEyebrow>
          <MarketingDisplayTitle
            as="h2"
            className="mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]"
          >
            Start free. Upgrade when you need more depth.
          </MarketingDisplayTitle>
          <MarketingLead className="mx-auto mt-4">
            Free covers portfolio work and research essentials. Pro unlocks AI
            earnings, news, and financial analysis, plus snowball, wheel
            backtest, and Advanced AI models.
          </MarketingLead>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Card as="article" surface="marketing" className="h-full rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="mt-1 text-sm text-muted">
                  Portfolio, research essentials, playbooks, and Simple &
                  Standard AI.
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums">$0</p>
            </div>
            <ul className="mt-5 space-y-2">
              {FREE_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              AI: Simple & Standard tiers (e.g. gpt-4.1-mini, gpt-4o-mini) —
              portfolio-aware chat and analysis.
            </p>
          </Card>

          <Card
            as="article"
            surface="accentSoft"
            className="relative h-full overflow-visible rounded-2xl p-6"
          >
            <Badge variant="accent" className="absolute -top-2.5 right-4">
              Early access
            </Badge>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">Pro</h3>
                <p className="mt-1 text-sm text-muted">
                  Deep Research AI plus snowball, backtest, and Advanced chat
                  models.
                </p>
              </div>
              <p className="shrink-0 whitespace-nowrap text-sm font-medium text-muted">
                Invite only
              </p>
            </div>
            <ul className="mt-5 space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Billing launches later. Existing users can request access from
              Settings after sign-in.
            </p>
          </Card>
        </div>
      </div>
    </MarketingSection>
  );
}
