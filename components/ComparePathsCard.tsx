"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowRightLeft,
  CircleDollarSign,
  Sparkles,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ComparePathOption,
  HeldOptionOutcomes,
  OptionRollSuggestion,
  RollPathOutcome,
} from "@/app/types/symbolAnalysis";
import { formatUsd } from "@/lib/formatCurrency";
import {
  sortComparePaths,
  type ComparePathKind,
} from "@/lib/inferRecommendedComparePath";
import { cn } from "@/lib/utils";

type Props = {
  outcome: HeldOptionOutcomes;
  symbol: string;
  recommendedPath?: ComparePathKind | null;
  rollSuggestions?: OptionRollSuggestion[];
  className?: string;
};

function findMatchingRollSuggestion(
  outcome: HeldOptionOutcomes,
  rollSuggestions?: OptionRollSuggestion[],
): OptionRollSuggestion | undefined {
  if (!rollSuggestions?.length) return undefined;

  const leg = outcome.currentLeg;
  const side = leg.side ?? (leg.putCall === "CALL" ? "call" : "put");
  const exp = leg.expiration.slice(0, 10);

  const strict = rollSuggestions.find(
    (suggestion) =>
      suggestion.side === side &&
      Math.abs(suggestion.currentStrike - leg.strike) < 0.01 &&
      suggestion.currentExpiration.slice(0, 10) === exp,
  );
  if (strict) return strict;

  const byStrike = rollSuggestions.find(
    (suggestion) =>
      suggestion.side === side &&
      Math.abs(suggestion.currentStrike - leg.strike) < 0.01,
  );
  if (byStrike) return byStrike;

  const bySide = rollSuggestions.filter((suggestion) => suggestion.side === side);
  if (bySide.length === 1) return bySide[0];
  if (rollSuggestions.length === 1) return rollSuggestions[0];
  return undefined;
}

function resolveDisplayPaths(
  outcome: HeldOptionOutcomes,
  rollSuggestions: OptionRollSuggestion[] | undefined,
  recommendedPath: ComparePathKind | null,
): ComparePathOption[] {
  const paths = [...outcome.comparePaths];
  const hasRoll = paths.some((path) => path.path === "roll");
  if (
    !hasRoll &&
    (outcome.roll || findMatchingRollSuggestion(outcome, rollSuggestions))
  ) {
    paths.push({ path: "roll", title: "Roll", lines: [] });
  }
  return sortComparePaths(paths, recommendedPath);
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-1.5 py-0.5 text-[10px] text-muted">
      <span className="font-medium text-foreground/80">{label}</span>
      <span>{value}</span>
    </span>
  );
}

function PathShell({
  title,
  icon: Icon,
  accent,
  recommended = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: string;
  recommended?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border px-3 py-3",
        accent,
        recommended && "ring-2 ring-accent/50 shadow-sm",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {recommended && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-muted/30 px-2 py-0.5 text-[10px] font-medium text-accent-strong">
            <Sparkles className="h-3 w-3" aria-hidden />
            Recommended
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

function PriceVsStrikeSummary({
  symbol,
  price,
  strike,
  side,
}: {
  symbol: string;
  price: number;
  strike: number;
  side: "put" | "call";
}) {
  const diff = price - strike;
  const diffAbs = Math.abs(diff);
  const diffLabel = formatUsd(diffAbs, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const isPut = side === "put";
  const priceAboveStrike = diff > 0;

  let contextLine: string;
  if (isPut) {
    contextLine = priceAboveStrike
      ? `${diffLabel} above your put strike — assignment only if ${symbol} falls below ${formatUsd(strike, { maximumFractionDigits: 2 })} by expiry.`
      : `${diffLabel} below your put strike — assignment likely if still there at expiry.`;
  } else {
    contextLine = priceAboveStrike
      ? `${diffLabel} above your call strike — shares may be called away if still there at expiry.`
      : `${diffLabel} below your call strike — keep premium if still below at expiry.`;
  }

  return (
    <div className="rounded-lg border border-border/80 bg-background/40 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        Today vs strike
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-muted">{symbol} now</p>
          <p className="text-sm font-semibold text-foreground">
            {formatUsd(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted">
            {isPut ? "Put strike" : "Call strike"}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatUsd(strike, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">{contextLine}</p>
    </div>
  );
}

function ScenarioTile({
  tone,
  title,
  headline,
  detail,
}: {
  tone: "positive" | "neutral" | "warning";
  title: string;
  headline: string;
  detail?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/25 bg-emerald-500/5"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/5"
        : "border-border/80 bg-background/40";

  return (
    <div className={cn("rounded-lg border px-2.5 py-2", toneClass)}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
        {headline}
      </p>
      {detail && (
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{detail}</p>
      )}
    </div>
  );
}

function HoldPathView({
  outcome,
  symbol,
  recommended,
}: {
  outcome: HeldOptionOutcomes;
  symbol: string;
  recommended: boolean;
}) {
  const { hold, currentLeg, drivers } = outcome;
  const side = currentLeg.side ?? (currentLeg.putCall === "CALL" ? "call" : "put");
  const putOrCall = side === "put" ? "put" : "call";
  const strike = currentLeg.strike;
  const price = hold.underlyingPrice;
  const premiumPerShare = drivers.entryPremiumPerShare;
  const premiumPerContract = drivers.entryPremiumPerContract;
  const effectiveCost =
    premiumPerShare != null && premiumPerShare > 0
      ? strike - premiumPerShare
      : null;

  const premiumLabel =
    premiumPerContract != null
      ? formatUsd(premiumPerContract, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : premiumPerShare != null
        ? formatUsd(premiumPerShare * 100, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        : null;

  const isPut = side === "put";
  const strikeLabel = formatUsd(strike, { maximumFractionDigits: 2 });

  return (
    <PathShell
      title="Hold to expiration"
      icon={Timer}
      accent="border-border bg-background/60"
      recommended={recommended}
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {hold.daysToExpiration != null && (
          <MetricChip label="DTE" value={String(hold.daysToExpiration)} />
        )}
        {hold.delta != null && (
          <MetricChip label="Delta" value={hold.delta.toFixed(2)} />
        )}
      </div>

      {price != null && (
        <div className="mb-3">
          <PriceVsStrikeSummary
            symbol={symbol}
            price={price}
            strike={strike}
            side={putOrCall}
          />
        </div>
      )}

      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted">
        If you hold
      </p>
      <div className="grid flex-1 gap-2">
        {isPut ? (
          <>
            <ScenarioTile
              tone="positive"
              title="Stays above strike"
              headline={premiumLabel ? `Keep ${premiumLabel} premium` : "Keep premium collected"}
              detail={`No shares bought — option expires.`}
            />
            <ScenarioTile
              tone="warning"
              title="Falls below strike"
              headline={`Buy 100 shares @ ${strikeLabel}`}
              detail={
                effectiveCost != null
                  ? `Wheel assignment — effective ~${formatUsd(effectiveCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/share after premium.`
                  : "Cash-secured put assignment at the strike."
              }
            />
          </>
        ) : (
          <>
            <ScenarioTile
              tone="positive"
              title="Stays below strike"
              headline={premiumLabel ? `Keep ${premiumLabel} premium` : "Keep premium collected"}
              detail="Call expires; you keep shares and premium."
            />
            <ScenarioTile
              tone="warning"
              title="Rises above strike"
              headline={`Shares called away @ ${strikeLabel}`}
              detail="100 shares sold at the strike."
            />
          </>
        )}
      </div>
    </PathShell>
  );
}

function ClosePathView({
  outcome,
  recommended,
}: {
  outcome: HeldOptionOutcomes;
  recommended: boolean;
}) {
  const { close } = outcome;

  return (
    <PathShell
      title="Close now"
      icon={CircleDollarSign}
      accent="border-border bg-background/60"
      recommended={recommended}
    >
      <p className="mb-2 text-[11px] leading-relaxed text-muted">
        Buy to close the short leg today and exit the trade.
      </p>
      <div className="grid gap-2">
        {close.costPerContract != null && (
          <div className="rounded-lg border border-border/80 bg-background/40 px-2.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Cost to close
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatUsd(close.costPerContract, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            {close.costPerShare != null && (
              <p className="text-[11px] text-muted">
                {formatUsd(close.costPerShare, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                /share at ask
              </p>
            )}
          </div>
        )}
        {close.openPnl != null && (
          <div className="rounded-lg border border-border/80 bg-background/40 px-2.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Locks in P/L
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold",
                close.openPnl >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400",
              )}
            >
              {formatUsd(close.openPnl, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        )}
      </div>
    </PathShell>
  );
}

function RollSuggestionView({
  suggestion,
  recommended,
}: {
  suggestion: OptionRollSuggestion;
  recommended: boolean;
}) {
  const netPerContract =
    suggestion.estimatedCredit != null
      ? Math.round(suggestion.estimatedCredit * 100)
      : null;
  const netPositive = suggestion.estimatedCredit == null || suggestion.estimatedCredit >= 0;

  return (
    <PathShell
      title="Roll"
      icon={ArrowRightLeft}
      accent="border-accent/30 bg-accent-muted/15"
      recommended={recommended}
    >
      <p className="mb-2 text-[11px] leading-relaxed text-muted">
        Close the current leg and sell a new one — stay in the wheel with different strike or date.
      </p>
      <div className="space-y-2 text-xs">
        <div className="rounded-lg border border-border/70 bg-background/50 px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Step 1 · Buy to close
          </p>
          <p className="mt-1 font-medium text-foreground">
            {formatUsd(suggestion.currentStrike, { maximumFractionDigits: 2 })}{" "}
            {suggestion.side}
          </p>
        </div>
        <div className="flex justify-center text-muted" aria-hidden>
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="rounded-lg border border-border/70 bg-background/50 px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Step 2 · Sell to open
          </p>
          <p className="mt-1 font-medium text-foreground">
            {formatUsd(suggestion.suggestedStrike, { maximumFractionDigits: 2 })}{" "}
            {suggestion.side}
          </p>
          {suggestion.suggestedDelta != null && (
            <p className="text-muted">Delta {suggestion.suggestedDelta.toFixed(2)}</p>
          )}
        </div>
        {netPerContract != null && (
          <div
            className={cn(
              "rounded-lg border px-2.5 py-2 text-center",
              netPositive
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Net {netPositive ? "credit" : "debit"}
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {formatUsd(Math.abs(netPerContract), {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              <span className="text-xs font-normal text-muted"> / contract</span>
            </p>
          </div>
        )}
      </div>
    </PathShell>
  );
}

function RollPathView({
  roll,
  recommended,
}: {
  roll: RollPathOutcome;
  recommended: boolean;
}) {
  const net = roll.netCreditPerContract;
  const netPositive = roll.isNetCredit;

  return (
    <PathShell
      title="Roll"
      icon={ArrowRightLeft}
      accent="border-accent/30 bg-accent-muted/15"
      recommended={recommended}
    >
      <p className="mb-2 text-[11px] leading-relaxed text-muted">
        Close the current leg and sell a new one — stay in the wheel with different strike or date.
      </p>
      <div className="space-y-2 text-xs">
        <div className="rounded-lg border border-border/70 bg-background/50 px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Step 1 · Buy to close
          </p>
          <p className="mt-1 font-medium text-foreground">
            {formatUsd(roll.closeLeg.strike, { maximumFractionDigits: 2 })}{" "}
            {roll.closeLeg.side ?? "option"}
          </p>
          {roll.closeLeg.cashPerContract != null && (
            <p className="text-muted">
              Pay{" "}
              {formatUsd(roll.closeLeg.cashPerContract, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          )}
        </div>

        <div className="flex justify-center text-muted" aria-hidden>
          <ArrowRight className="h-4 w-4" />
        </div>

        <div className="rounded-lg border border-border/70 bg-background/50 px-2.5 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Step 2 · Sell to open
          </p>
          <p className="mt-1 font-medium text-foreground">
            {formatUsd(roll.openLeg.strike, { maximumFractionDigits: 2 })}{" "}
            {roll.openLeg.side ?? "option"}
          </p>
          {roll.openLeg.cashPerContract != null && (
            <p className="text-muted">
              Collect{" "}
              {formatUsd(roll.openLeg.cashPerContract, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          )}
          {roll.openLeg.delta != null && (
            <p className="text-muted">Delta {roll.openLeg.delta.toFixed(2)}</p>
          )}
        </div>

        {net != null && (
          <div
            className={cn(
              "rounded-lg border px-2.5 py-2 text-center",
              netPositive
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-amber-500/30 bg-amber-500/5",
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              Net {netPositive ? "credit" : "debit"}
            </p>
            <p className="mt-0.5 text-base font-semibold text-foreground">
              {formatUsd(Math.abs(net), {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              <span className="text-xs font-normal text-muted"> / contract</span>
            </p>
          </div>
        )}
      </div>
    </PathShell>
  );
}

function FallbackPathView({
  path,
  recommended,
}: {
  path: ComparePathOption;
  recommended: boolean;
}) {
  const meta =
    path.path === "roll"
      ? { icon: ArrowRightLeft, accent: "border-accent/30 bg-accent-muted/15" }
      : path.path === "close"
        ? { icon: CircleDollarSign, accent: "border-border bg-background/60" }
        : { icon: Timer, accent: "border-border bg-background/60" };

  return (
    <PathShell
      title={path.title}
      icon={meta.icon}
      accent={meta.accent}
      recommended={recommended}
    >
      <ul className="space-y-1">
        {path.lines.map((line) => (
          <li key={line} className="text-xs leading-relaxed text-muted">
            {line}
          </li>
        ))}
      </ul>
    </PathShell>
  );
}

function PathCard({
  path,
  outcome,
  symbol,
  recommendedPath,
  rollSuggestions,
}: {
  path: ComparePathOption;
  outcome: HeldOptionOutcomes;
  symbol: string;
  recommendedPath: ComparePathKind | null | undefined;
  rollSuggestions?: OptionRollSuggestion[];
}) {
  const recommended = recommendedPath === path.path;
  const { roll, close, hold } = outcome;
  const rollSuggestion = findMatchingRollSuggestion(outcome, rollSuggestions);

  if (path.path === "hold" && hold) {
    return (
      <HoldPathView
        outcome={outcome}
        symbol={symbol}
        recommended={recommended}
      />
    );
  }
  if (path.path === "close" && close) {
    return <ClosePathView outcome={outcome} recommended={recommended} />;
  }
  if (path.path === "roll") {
    if (roll) {
      return <RollPathView roll={roll} recommended={recommended} />;
    }
    if (rollSuggestion) {
      return (
        <RollSuggestionView suggestion={rollSuggestion} recommended={recommended} />
      );
    }
  }
  return <FallbackPathView path={path} recommended={recommended} />;
}

export function ComparePathsIntro() {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Compare paths
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Three ways to handle this short option — estimated dollars from your live quotes.
        Compare outcomes, then see the recommended action in the summary above.
      </p>
    </div>
  );
}

export function ComparePathsCard({
  outcome,
  symbol,
  recommendedPath = null,
  rollSuggestions,
  className,
}: Props) {
  const orderedPaths = resolveDisplayPaths(
    outcome,
    rollSuggestions,
    recommendedPath ?? null,
  );

  if (!orderedPaths.length) return null;

  const symbolUpper = symbol.toUpperCase();

  return (
    <div
      className={cn(
        "grid gap-2",
        orderedPaths.length >= 3
          ? "sm:grid-cols-3"
          : orderedPaths.length === 2
            ? "sm:grid-cols-2"
            : "grid-cols-1",
        className,
      )}
    >
      {orderedPaths.map((path) => (
        <PathCard
          key={path.path}
          path={path}
          outcome={outcome}
          symbol={symbolUpper}
          recommendedPath={recommendedPath}
          rollSuggestions={rollSuggestions}
        />
      ))}
    </div>
  );
}
