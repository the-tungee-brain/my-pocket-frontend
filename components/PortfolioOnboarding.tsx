"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  Link2,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { usePositionsContext } from "@/app/Providers";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  dismissOnboarding,
  isOnboardingDismissed,
} from "@/lib/onboardingStorage";

type Step = {
  id: string;
  label: string;
  description: string;
  done: boolean;
};

export function PortfolioOnboarding() {
  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();
  const { allPositions, chatBySymbol, loading: positionsLoading } =
    usePositionsContext();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isOnboardingDismissed());
  }, []);

  const hasPortfolioChat =
    (chatBySymbol["__PORTFOLIO_CHAT__"]?.messages.length ?? 0) > 0;

  const steps: Step[] = useMemo(
    () => [
      {
        id: "connect",
        label: "Connect Schwab",
        description: "Link your account from the sidebar to import holdings.",
        done: schwabAuthorized === true,
      },
      {
        id: "holdings",
        label: "Review your holdings",
        description: "Your positions appear here once Schwab is connected.",
        done: allPositions.length > 0,
      },
      {
        id: "assistant",
        label: "Ask the assistant",
        description: "Use quick prompts or type a question in the chat bar below.",
        done: hasPortfolioChat,
      },
    ],
    [schwabAuthorized, allPositions.length, hasPortfolioChat],
  );

  const completedCount = steps.filter((step) => step.done).length;
  const allDone = completedCount === steps.length;

  if (dismissed || schwabLoading || positionsLoading || allDone) {
    return null;
  }

  const handleDismiss = () => {
    dismissOnboarding();
    setDismissed(true);
  };

  return (
    <section className="mx-auto mb-4 w-full max-w-3xl">
      <div className="rounded-2xl border border-accent/30 bg-accent-muted/40 p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
              Getting started
            </p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">
              Set up PowerPocket in 3 steps
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {completedCount} of {steps.length} complete
            </p>
          </div>
          <Button
            size="xs"
            variant="ghost"
            aria-label="Dismiss getting started guide"
            className="shrink-0 text-muted hover:text-foreground"
            onClick={handleDismiss}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <ol className="space-y-3">
          {steps.map((step, index) => {
            const StepIcon =
              step.id === "connect"
                ? Link2
                : step.id === "holdings"
                  ? BriefcaseBusiness
                  : MessageSquare;

            return (
              <li
                key={step.id}
                className={cn(
                  "flex gap-3 rounded-xl border px-3 py-2.5",
                  step.done
                    ? "border-accent/30 bg-background/60"
                    : "border-border bg-background/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                    step.done
                      ? "bg-accent-muted text-accent-strong"
                      : "bg-muted-bg text-muted",
                  )}
                >
                  {step.done ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StepIcon
                      className="h-3.5 w-3.5 text-muted"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-foreground">
                      {step.label}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{step.description}</p>
                  {step.id === "connect" && !step.done && (
                    <p className="mt-1.5 text-[11px] text-muted">
                      On mobile, open the menu — Connect is at the bottom of the
                      sidebar.
                    </p>
                  )}
                  {step.id === "assistant" && step.done === false && allPositions.length > 0 && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] text-accent-strong">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Try a quick prompt in the chat bar below
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
