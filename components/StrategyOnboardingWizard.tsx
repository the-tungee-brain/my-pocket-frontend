"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Layers,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useSymbolSearch } from "@/app/hooks/useSymbolSearch";
import { useStrategyStockSuggestions } from "@/app/hooks/useStrategyStockSuggestions";
import type {
  IncomeVsGrowth,
  InvestmentStrategy,
  OptionsExperience,
  RiskTolerance,
  StrategyCatalogItem,
  UserInvestmentProfileUpdate,
} from "@/app/types/strategy";
import { StrategyStockSuggestionsPanel } from "@/components/StrategyStockSuggestionsPanel";
import { Button } from "@/components/ui/Button";
import { buildPreferencesDraftUpdate } from "@/lib/strategyStockSuggestions";
import { cn } from "@/lib/utils";

type WizardStep =
  | "welcome"
  | "strategy"
  | "preferences"
  | "configure"
  | "review";

type Props = {
  accessToken: string;
  catalog: StrategyCatalogItem[];
  onComplete: (payload: UserInvestmentProfileUpdate) => Promise<void>;
  onSaveDraft?: (payload: UserInvestmentProfileUpdate) => Promise<void>;
  onClose?: () => void;
};

const STRATEGY_ICONS: Record<InvestmentStrategy, typeof RefreshCw> = {
  wheel: RefreshCw,
  "csp-income": CircleDollarSign,
  "covered-call": TrendingUp,
  dividend: CircleDollarSign,
  "etf-core": Layers,
};

const DEFAULT_ETF_ALLOCATION = { VTI: 70, BND: 30 };

export function StrategyOnboardingWizard({
  accessToken,
  catalog,
  onComplete,
  onSaveDraft,
  onClose,
}: Props) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedStrategy, setSelectedStrategy] =
    useState<InvestmentStrategy | null>(null);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("moderate");
  const [optionsExperience, setOptionsExperience] =
    useState<OptionsExperience>("beginner");
  const [incomeVsGrowth, setIncomeVsGrowth] =
    useState<IncomeVsGrowth>("balanced");
  const [symbolInput, setSymbolInput] = useState("");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [etfPrimary, setEtfPrimary] = useState("VTI");
  const [etfBond, setEtfBond] = useState("BND");
  const [etfStockPct, setEtfStockPct] = useState(70);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { results: searchResults } = useSymbolSearch(symbolInput, {
    accessToken,
    limit: 8,
  });

  const selectedCatalogItem = useMemo(
    () => catalog.find((item) => item.id === selectedStrategy) ?? null,
    [catalog, selectedStrategy],
  );

  const showSymbolSuggestions =
    step === "configure" &&
    selectedStrategy !== null &&
    selectedStrategy !== "etf-core";

  const prepareSuggestionsProfile = useCallback(async () => {
    if (!onSaveDraft || !selectedStrategy) return;
    await onSaveDraft(
      buildPreferencesDraftUpdate(selectedStrategy, {
        riskTolerance,
        optionsExperience,
        incomeVsGrowth,
      }),
    );
  }, [
    onSaveDraft,
    selectedStrategy,
    riskTolerance,
    optionsExperience,
    incomeVsGrowth,
  ]);

  const {
    suggestions,
    loading: suggestionsLoading,
    error: suggestionsError,
  } = useStrategyStockSuggestions({
    accessToken,
    strategy: selectedStrategy,
    enabled: showSymbolSuggestions && !!onSaveDraft,
    prepareProfile: prepareSuggestionsProfile,
  });

  const addSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (!upper || symbols.includes(upper)) return;
    setSymbols((prev) => [...prev, upper].slice(0, 5));
    setSymbolInput("");
  };

  const removeSymbol = (symbol: string) => {
    setSymbols((prev) => prev.filter((item) => item !== symbol));
  };

  const buildPayload = (): UserInvestmentProfileUpdate => {
    const payload: UserInvestmentProfileUpdate = {
      primaryStrategy: selectedStrategy,
      riskTolerance,
      optionsExperience,
      incomeVsGrowth,
      completeOnboarding: true,
    };

    if (
      selectedStrategy === "wheel" ||
      selectedStrategy === "csp-income" ||
      selectedStrategy === "covered-call"
    ) {
      payload.wheel = {
        wheelSymbols: symbols,
        targetDeltaMin: 0.2,
        targetDeltaMax: 0.3,
        preferredDteDays: 7,
        maxSingleNamePct: 15,
      };
    }

    if (selectedStrategy === "dividend") {
      payload.dividend = {
        dividendSymbols: symbols,
        targetYieldPct: incomeVsGrowth === "income" ? 3.5 : null,
        maxPayoutRatio: 75,
      };
    }

    if (selectedStrategy === "etf-core") {
      payload.etfCore = {
        targetAllocation: {
          [etfPrimary.toUpperCase()]: etfStockPct,
          [etfBond.toUpperCase()]: 100 - etfStockPct,
        },
        rebalanceThresholdPct: 5,
      };
    }

    return payload;
  };

  const canContinue = () => {
    if (step === "strategy") return selectedStrategy !== null;
    if (step === "configure") {
      if (selectedStrategy === "etf-core") {
        return etfPrimary.trim().length > 0 && etfBond.trim().length > 0;
      }
      return symbols.length > 0;
    }
    return true;
  };

  const goNext = () => {
    if (step === "welcome") setStep("strategy");
    else if (step === "strategy") setStep("preferences");
    else if (step === "preferences") setStep("configure");
    else if (step === "configure") setStep("review");
  };

  const goBack = () => {
    if (step === "strategy") setStep("welcome");
    else if (step === "preferences") setStep("strategy");
    else if (step === "configure") setStep("preferences");
    else if (step === "review") setStep("configure");
  };

  const handleFinish = async () => {
    if (!selectedStrategy) return;
    setSubmitting(true);
    setError(null);
    try {
      await onComplete(buildPayload());
    } catch {
      setError("Could not save your strategy. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-secondary shadow-2xl">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
                Strategy onboarding
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {step === "welcome" && "Welcome to your investing journey"}
                {step === "strategy" && "Choose your strategy"}
                {step === "preferences" && "Tell us about yourself"}
                {step === "configure" && "Set up your plan"}
                {step === "review" && "Review and start"}
              </h2>
            </div>
            {onClose && (
              <Button size="xs" variant="ghost" onClick={onClose}>
                Skip for now
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "welcome" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted">
                Tomcrest will guide you step by step — whether you want to run
                the wheel, collect dividends, or build a simple ETF portfolio.
              </p>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                  Pick a strategy that matches how you want to invest
                </li>
                <li className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                  Get a personalized checklist and next actions
                </li>
                <li className="flex gap-2">
                  <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                  Track progress as you connect Schwab and take trades
                </li>
              </ul>
            </div>
          )}

          {step === "strategy" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {catalog.map((item) => {
                const Icon = STRATEGY_ICONS[item.id];
                const selected = selectedStrategy === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedStrategy(item.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition",
                      selected
                        ? "border-accent/50 bg-accent-muted/50"
                        : "border-border bg-background/40 hover:border-accent/30",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-accent-strong" />
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-accent-strong">
                      {item.subtitle}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {step === "preferences" && (
            <div className="space-y-5">
              <FieldGroup label="Risk tolerance">
                {(
                  ["conservative", "moderate", "aggressive"] as RiskTolerance[]
                ).map((value) => (
                  <ChoiceChip
                    key={value}
                    selected={riskTolerance === value}
                    onClick={() => setRiskTolerance(value)}
                    label={value}
                  />
                ))}
              </FieldGroup>

              <FieldGroup label="Income vs growth">
                {(["income", "balanced", "growth"] as IncomeVsGrowth[]).map(
                  (value) => (
                    <ChoiceChip
                      key={value}
                      selected={incomeVsGrowth === value}
                      onClick={() => setIncomeVsGrowth(value)}
                      label={value}
                    />
                  ),
                )}
              </FieldGroup>

              {(selectedStrategy === "wheel" ||
                selectedStrategy === "csp-income" ||
                selectedStrategy === "covered-call") && (
                <FieldGroup label="Options experience">
                  {(
                    [
                      "none",
                      "beginner",
                      "intermediate",
                      "advanced",
                    ] as OptionsExperience[]
                  ).map((value) => (
                    <ChoiceChip
                      key={value}
                      selected={optionsExperience === value}
                      onClick={() => setOptionsExperience(value)}
                      label={value}
                    />
                  ))}
                </FieldGroup>
              )}
            </div>
          )}

          {step === "configure" && selectedCatalogItem && (
            <div className="space-y-4">
              {selectedStrategy === "etf-core" ? (
                <>
                  <p className="text-sm text-muted">
                    Set a simple two-fund core allocation. You can adjust this
                    later.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-muted">
                      Stock ETF
                      <input
                        value={etfPrimary}
                        onChange={(event) => setEtfPrimary(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                    <label className="block text-xs text-muted">
                      Bond ETF
                      <input
                        value={etfBond}
                        onChange={(event) => setEtfBond(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <label className="block text-xs text-muted">
                    Stock allocation: {etfStockPct}%
                    <input
                      type="range"
                      min={50}
                      max={90}
                      value={etfStockPct}
                      onChange={(event) =>
                        setEtfStockPct(Number(event.target.value))
                      }
                      className="mt-2 w-full"
                    />
                  </label>
                  <p className="text-xs text-muted">
                    Target: {etfPrimary.toUpperCase()} {etfStockPct}% /{" "}
                    {etfBond.toUpperCase()} {100 - etfStockPct}%
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    {selectedStrategy === "dividend"
                      ? "Add 1–5 dividend names you want to research and hold."
                      : "Add 1–3 symbols you'd be happy to own if assigned on a put."}
                  </p>
                  <StrategyStockSuggestionsPanel
                    picks={suggestions?.picks ?? []}
                    summary={suggestions?.summary}
                    loading={suggestionsLoading}
                    error={suggestionsError}
                    onAddSymbol={addSymbol}
                    selectedSymbols={symbols}
                  />
                  <input
                    value={symbolInput}
                    onChange={(event) => setSymbolInput(event.target.value)}
                    placeholder="Search symbol, e.g. AAPL"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  {searchResults.length > 0 && symbolInput.trim() && (
                    <div className="rounded-lg border border-border bg-background">
                      {searchResults.map((item) => (
                        <button
                          key={item.symbol}
                          type="button"
                          onClick={() => addSymbol(item.symbol)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-muted-bg"
                        >
                          {item.symbol}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {symbols.map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => removeSymbol(symbol)}
                        className="rounded-full border border-accent/30 bg-accent-muted/40 px-3 py-1 text-xs font-medium text-accent-strong"
                      >
                        {symbol} ×
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {step === "review" && selectedCatalogItem && (
            <div className="space-y-4 text-sm">
              <ReviewRow label="Strategy" value={selectedCatalogItem.title} />
              <ReviewRow label="Risk" value={riskTolerance} />
              <ReviewRow label="Focus" value={incomeVsGrowth} />
              {selectedStrategy === "etf-core" ? (
                <ReviewRow
                  label="Allocation"
                  value={`${etfPrimary.toUpperCase()} ${etfStockPct}% / ${etfBond.toUpperCase()} ${100 - etfStockPct}%`}
                />
              ) : (
                <ReviewRow label="Symbols" value={symbols.join(", ") || "—"} />
              )}
              <p className="text-xs text-muted">
                We'll create a guided checklist and suggest your next step on
                the portfolio page.
              </p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === "welcome" || submitting}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {step !== "review" ? (
            <Button onClick={goNext} disabled={!canContinue()}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => void handleFinish()} isLoading={submitting}>
              Start my journey
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ChoiceChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
        selected
          ? "border-accent/40 bg-accent-muted/50 text-accent-strong"
          : "border-border bg-background/40 text-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="font-medium capitalize text-foreground">{value}</span>
    </div>
  );
}
