"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Layers,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useStrategyStockScreener } from "@/app/hooks/useStrategyStockScreener";
import type {
  IncomeVsGrowth,
  InvestmentStrategy,
  OptionsExperience,
  RiskTolerance,
  StrategyCatalogItem,
  UserInvestmentProfile,
} from "@/app/types/strategy";
import { StrategyStockScreenerPanel } from "@/components/StrategyStockScreenerPanel";
import { SymbolSearchField } from "@/components/SymbolSearchField";
import { Button } from "@/components/ui/Button";
import { updateInvestmentProfile } from "@/lib/apiClient";
import { cn } from "@/lib/utils";
import {
  DEFAULT_STRATEGY_FORM,
  deltaBandForRisk,
  formValuesToUpdate,
  isStrategyFormValid,
  isWheelLikeStrategy,
  profileToFormValues,
  type StrategyFormValues,
} from "@/lib/strategyProfileForm";
import {
  defaultWheelScreenerFilters,
  supportsStrategyStockScreener,
} from "@/lib/strategyScreener";

type Props = {
  accessToken: string;
  catalog: StrategyCatalogItem[];
  profile: UserInvestmentProfile | null;
  onSave: (values: StrategyFormValues) => Promise<void>;
  submitLabel?: string;
  showStrategyChangeWarning?: boolean;
};

const STRATEGY_ICONS: Record<InvestmentStrategy, typeof RefreshCw> = {
  wheel: RefreshCw,
  "csp-income": CircleDollarSign,
  "covered-call": TrendingUp,
  dividend: CircleDollarSign,
  "etf-core": Layers,
};

export function StrategyProfileEditor({
  accessToken,
  catalog,
  profile,
  onSave,
  submitLabel = "Save changes",
  showStrategyChangeWarning = true,
}: Props) {
  const [values, setValues] = useState<StrategyFormValues>(() =>
    profileToFormValues(profile),
  );
  const [symbolInput, setSymbolInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues(profileToFormValues(profile));
  }, [profile]);

  const strategyChanged =
    profile?.primaryStrategy != null &&
    values.primaryStrategy != null &&
    profile.primaryStrategy !== values.primaryStrategy;

  const selectedCatalogItem = useMemo(
    () => catalog.find((item) => item.id === values.primaryStrategy) ?? null,
    [catalog, values.primaryStrategy],
  );

  const [screenerFilters, setScreenerFilters] = useState(defaultWheelScreenerFilters());

  const showSymbolScreener = supportsStrategyStockScreener(values.primaryStrategy);

  const prepareScreenerProfile = useCallback(async () => {
    if (!values.primaryStrategy) return;
    await updateInvestmentProfile(accessToken, formValuesToUpdate(values));
  }, [accessToken, values]);

  const {
    result: screenerResult,
    loading: screenerLoading,
    error: screenerError,
    runScreen,
    stale: screenerStale,
    hasRun: screenerHasRun,
  } = useStrategyStockScreener({
    accessToken,
    strategy: values.primaryStrategy,
    enabled: showSymbolScreener,
    filters: screenerFilters,
    autoRun: true,
    prepareProfile: prepareScreenerProfile,
    prepareOnAutoFetch: true,
  });

  const patch = (partial: Partial<StrategyFormValues>) => {
    setValues((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const addSymbol = (symbol: string) => {
    const upper = symbol.toUpperCase();
    if (!upper || values.symbols.includes(upper)) return;
    patch({ symbols: [...values.symbols, upper].slice(0, 5) });
    setSymbolInput("");
  };

  const removeSymbol = (symbol: string) => {
    patch({ symbols: values.symbols.filter((item) => item !== symbol) });
  };

  const handleSubmit = async () => {
    if (!isStrategyFormValid(values)) {
      setError("Complete all required fields before saving.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSave(values);
      setSaved(true);
    } catch {
      setError("Could not save your strategy settings. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Strategy</h3>
          <p className="mt-1 text-xs text-muted">
            Changing strategy resets your guided checklist for the new path.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {catalog.map((item) => {
            const Icon = STRATEGY_ICONS[item.id];
            const selected = values.primaryStrategy === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  patch({
                    primaryStrategy: item.id,
                    symbols:
                      profile?.primaryStrategy === item.id
                        ? profileToFormValues(profile).symbols
                        : [],
                  })
                }
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
                <p className="mt-1 text-xs text-accent-strong">{item.subtitle}</p>
              </button>
            );
          })}
        </div>
      </section>

      {values.primaryStrategy && (
        <>
          <section className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
            <FieldGroup label="Risk tolerance">
              {(["conservative", "moderate", "aggressive"] as RiskTolerance[]).map(
                (option) => (
                  <ChoiceChip
                    key={option}
                    label={option}
                    selected={values.riskTolerance === option}
                    onClick={() =>
                      patch({
                        riskTolerance: option,
                        ...(isWheelLikeStrategy(values.primaryStrategy)
                          ? deltaBandForRisk(option)
                          : {}),
                      })
                    }
                  />
                ),
              )}
            </FieldGroup>
            {isWheelLikeStrategy(values.primaryStrategy) && (
              <p className="text-xs text-muted-foreground">
                Target delta band: {values.targetDeltaMin.toFixed(2)}–
                {values.targetDeltaMax.toFixed(2)} (synced to risk tolerance)
              </p>
            )}
            <FieldGroup label="Income vs growth">
              {(["income", "balanced", "growth"] as IncomeVsGrowth[]).map(
                (option) => (
                  <ChoiceChip
                    key={option}
                    label={option}
                    selected={values.incomeVsGrowth === option}
                    onClick={() => patch({ incomeVsGrowth: option })}
                  />
                ),
              )}
            </FieldGroup>
            {isWheelLikeStrategy(values.primaryStrategy) && (
              <FieldGroup label="Options experience">
                {(
                  ["none", "beginner", "intermediate", "advanced"] as OptionsExperience[]
                ).map((option) => (
                  <ChoiceChip
                    key={option}
                    label={option}
                    selected={values.optionsExperience === option}
                    onClick={() => patch({ optionsExperience: option })}
                  />
                ))}
              </FieldGroup>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {selectedCatalogItem?.title ?? "Plan"} details
            </h3>

            {values.primaryStrategy === "etf-core" ? (
              <>
                <StrategyStockScreenerPanel
                  strategy={values.primaryStrategy ?? "etf-core"}
                  preset={screenerResult?.preset}
                  quotes={screenerResult?.quotes ?? []}
                  summary={screenerResult?.summary}
                  filters={screenerFilters}
                  onFiltersChange={setScreenerFilters}
                  loading={screenerLoading}
                  error={screenerError}
                  stale={screenerStale}
                  hasRun={screenerHasRun}
                  onRun={() => void runScreen({ force: true, syncProfile: true })}
                  onAddSymbol={(symbol) => patch({ etfPrimary: symbol.toUpperCase() })}
                  selectedSymbols={[values.etfPrimary, values.etfBond].filter(Boolean)}
                />
                <EtfConfig values={values} onChange={patch} />
              </>
            ) : (
              <>
                <StrategyStockScreenerPanel
                  strategy={values.primaryStrategy ?? "wheel"}
                  preset={screenerResult?.preset}
                  quotes={screenerResult?.quotes ?? []}
                  summary={screenerResult?.summary}
                  filters={screenerFilters}
                  onFiltersChange={setScreenerFilters}
                  loading={screenerLoading}
                  error={screenerError}
                  stale={screenerStale}
                  hasRun={screenerHasRun}
                  onRun={() => void runScreen({ force: true, syncProfile: true })}
                  onAddSymbol={addSymbol}
                  selectedSymbols={values.symbols}
                />
                <SymbolConfig
                  accessToken={accessToken}
                  values={values}
                  symbolInput={symbolInput}
                  onSymbolInputChange={setSymbolInput}
                  onAddSymbol={addSymbol}
                  onRemoveSymbol={removeSymbol}
                />
              </>
            )}

            {isWheelLikeStrategy(values.primaryStrategy) && (
              <WheelAdvancedConfig values={values} onChange={patch} />
            )}

            {values.primaryStrategy === "dividend" && (
              <DividendAdvancedConfig values={values} onChange={patch} />
            )}
          </section>
        </>
      )}

      {showStrategyChangeWarning && strategyChanged && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Switching strategies will start a fresh journey checklist. Your Schwab
          connection and portfolio data stay the same.
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-accent-strong">Strategy settings saved.</p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => void handleSubmit()}
          isLoading={submitting}
          disabled={!isStrategyFormValid(values)}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function EtfConfig({
  values,
  onChange,
}: {
  values: StrategyFormValues;
  onChange: (partial: Partial<StrategyFormValues>) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted">
          Stock ETF
          <input
            value={values.etfPrimary}
            onChange={(event) => onChange({ etfPrimary: event.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block text-xs text-muted">
          Bond ETF
          <input
            value={values.etfBond}
            onChange={(event) => onChange({ etfBond: event.target.value })}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <label className="block text-xs text-muted">
        Stock allocation: {values.etfStockPct}%
        <input
          type="range"
          min={50}
          max={90}
          value={values.etfStockPct}
          onChange={(event) =>
            onChange({ etfStockPct: Number(event.target.value) })
          }
          className="mt-2 w-full"
        />
      </label>
      <label className="block text-xs text-muted">
        Rebalance when drift exceeds (%)
        <input
          type="number"
          min={1}
          max={20}
          value={values.rebalanceThresholdPct}
          onChange={(event) =>
            onChange({ rebalanceThresholdPct: Number(event.target.value) })
          }
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </label>
    </>
  );
}

function SymbolConfig({
  accessToken,
  values,
  symbolInput,
  onSymbolInputChange,
  onAddSymbol,
  onRemoveSymbol,
}: {
  accessToken: string;
  values: StrategyFormValues;
  symbolInput: string;
  onSymbolInputChange: (value: string) => void;
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
}) {
  return (
    <>
      <SymbolSearchField
        accessToken={accessToken}
        value={symbolInput}
        onChange={onSymbolInputChange}
        onSelect={onAddSymbol}
      />
      <div className="flex flex-wrap gap-2">
        {values.symbols.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => onRemoveSymbol(symbol)}
            className="rounded-full border border-accent/30 bg-accent-muted/40 px-3 py-1 text-xs font-medium text-accent-strong"
          >
            {symbol} ×
          </button>
        ))}
      </div>
    </>
  );
}

function WheelAdvancedConfig({
  values,
  onChange,
}: {
  values: StrategyFormValues;
  onChange: (partial: Partial<StrategyFormValues>) => void;
}) {
  return (
    <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
      <NumberField
        label="Target delta min"
        value={values.targetDeltaMin}
        step={0.01}
        onChange={(value) => onChange({ targetDeltaMin: value })}
      />
      <NumberField
        label="Target delta max"
        value={values.targetDeltaMax}
        step={0.01}
        onChange={(value) => onChange({ targetDeltaMax: value })}
      />
      <NumberField
        label="Preferred DTE (days)"
        value={values.preferredDteDays}
        step={1}
        onChange={(value) => onChange({ preferredDteDays: value })}
      />
      <NumberField
        label="Max single-name weight (%)"
        value={values.maxSingleNamePct}
        step={1}
        onChange={(value) => onChange({ maxSingleNamePct: value })}
      />
    </div>
  );
}

function DividendAdvancedConfig({
  values,
  onChange,
}: {
  values: StrategyFormValues;
  onChange: (partial: Partial<StrategyFormValues>) => void;
}) {
  return (
    <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
      <NumberField
        label="Target yield (%)"
        value={values.targetYieldPct ?? DEFAULT_STRATEGY_FORM.targetYieldPct ?? 0}
        step={0.1}
        onChange={(value) => onChange({ targetYieldPct: value || null })}
      />
      <NumberField
        label="Max payout ratio (%)"
        value={values.maxPayoutRatio}
        step={1}
        onChange={(value) => onChange({ maxPayoutRatio: value })}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
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

export { formValuesToUpdate };
