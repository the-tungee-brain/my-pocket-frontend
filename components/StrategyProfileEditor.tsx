"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
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
  formValuesEqual,
  formValuesToUpdate,
  isStrategyFormValid,
  isWheelLikeStrategy,
  profileToFormValues,
  type StrategyFormValues,
} from "@/lib/strategyProfileForm";
import {
  defaultScreenerFiltersForStrategy,
  supportsStrategyStockScreener,
} from "@/lib/strategyScreener";

type Props = {
  accessToken: string;
  catalog: StrategyCatalogItem[];
  profile: UserInvestmentProfile | null;
  onSave: (values: StrategyFormValues) => Promise<void>;
  submitLabel?: string;
  showStrategyChangeWarning?: boolean;
  variant?: "default" | "settings";
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
  variant = "default",
}: Props) {
  const isSettings = variant === "settings";
  const [values, setValues] = useState<StrategyFormValues>(() =>
    profileToFormValues(profile),
  );
  const [symbolInput, setSymbolInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [screenerExpanded, setScreenerExpanded] = useState(!isSettings);

  useEffect(() => {
    setScreenerExpanded(!isSettings);
  }, [isSettings, values.primaryStrategy]);

  const savedBaseline = useMemo(() => profileToFormValues(profile), [profile]);
  const isDirty = useMemo(
    () => !formValuesEqual(values, savedBaseline),
    [values, savedBaseline],
  );

  useEffect(() => {
    setValues(profileToFormValues(profile));
    setSaved(false);
  }, [profile]);

  const strategyChanged =
    profile?.primaryStrategy != null &&
    values.primaryStrategy != null &&
    profile.primaryStrategy !== values.primaryStrategy;

  const selectedCatalogItem = useMemo(
    () => catalog.find((item) => item.id === values.primaryStrategy) ?? null,
    [catalog, values.primaryStrategy],
  );

  const [screenerFilters, setScreenerFilters] = useState(() =>
    values.primaryStrategy
      ? defaultScreenerFiltersForStrategy(values.primaryStrategy)
      : defaultScreenerFiltersForStrategy("wheel"),
  );

  useEffect(() => {
    if (values.primaryStrategy) {
      setScreenerFilters(defaultScreenerFiltersForStrategy(values.primaryStrategy));
    }
  }, [values.primaryStrategy]);

  const showSymbolScreener = supportsStrategyStockScreener(values.primaryStrategy);

  const prepareScreenerProfile = useCallback(async () => {
    if (!values.primaryStrategy) return;
    await updateInvestmentProfile(accessToken, formValuesToUpdate(values));
  }, [accessToken, values]);

  const {
    result: screenerResult,
    loading: screenerLoading,
    initialLoading: screenerInitialLoading,
    isFetching: screenerIsFetching,
    error: screenerError,
    runScreen,
    hasRun: screenerHasRun,
    page: screenerPage,
    pageSize: screenerPageSize,
    setPage: setScreenerPage,
    setPageSize: setScreenerPageSize,
  } = useStrategyStockScreener({
    accessToken,
    strategy: values.primaryStrategy,
    enabled: showSymbolScreener && (!isSettings || screenerExpanded),
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

  const sectionClass = cn(
    "space-y-4 rounded-xl border p-4",
    isSettings
      ? "border-border/80 bg-secondary/30"
      : "border-border bg-background/40",
  );

  const screenerPanel =
    values.primaryStrategy === "etf-core" ? (
      <StrategyStockScreenerPanel
        strategy={values.primaryStrategy ?? "etf-core"}
        preset={screenerResult?.preset}
        quotes={screenerResult?.quotes ?? []}
        sections={screenerResult?.sections}
        summary={screenerResult?.summary}
        filters={screenerFilters}
        onFiltersChange={setScreenerFilters}
        loading={screenerLoading}
        initialLoading={screenerInitialLoading}
        isFetching={screenerIsFetching}
                  error={screenerError}
                  hasRun={screenerHasRun}
        page={screenerPage}
        pageSize={screenerPageSize}
        totalPages={screenerResult?.totalPages ?? 1}
        totalCount={screenerResult?.totalCount ?? 0}
        onPageChange={setScreenerPage}
        onPageSizeChange={setScreenerPageSize}
        onRun={() => void runScreen({ force: true, syncProfile: true })}
        onAddSymbol={(symbol) => patch({ etfPrimary: symbol.toUpperCase() })}
        selectedSymbols={[values.etfPrimary, values.etfBond].filter(Boolean)}
        compact={isSettings}
      />
    ) : (
      <StrategyStockScreenerPanel
        strategy={values.primaryStrategy ?? "wheel"}
        preset={screenerResult?.preset}
        quotes={screenerResult?.quotes ?? []}
        sections={screenerResult?.sections}
        summary={screenerResult?.summary}
        filters={screenerFilters}
        onFiltersChange={setScreenerFilters}
        loading={screenerLoading}
        initialLoading={screenerInitialLoading}
        isFetching={screenerIsFetching}
                  error={screenerError}
                  hasRun={screenerHasRun}
        page={screenerPage}
        pageSize={screenerPageSize}
        totalPages={screenerResult?.totalPages ?? 1}
        totalCount={screenerResult?.totalCount ?? 0}
        onPageChange={setScreenerPage}
        onPageSizeChange={setScreenerPageSize}
        onRun={() => void runScreen({ force: true, syncProfile: true })}
        onAddSymbol={addSymbol}
        selectedSymbols={values.symbols}
        compact={isSettings}
      />
    );

  return (
    <div className={cn("space-y-6", isSettings && isDirty && "pb-4")}>
      <section className={cn("space-y-3", isSettings && sectionClass)}>
        {!isSettings && (
          <div>
            <h3 className="text-sm font-semibold text-foreground">Strategy</h3>
            <p className="mt-1 text-xs text-muted">
              Changing strategy resets your guided checklist for the new path.
            </p>
          </div>
        )}
        {isSettings && (
          <h3 className="text-sm font-semibold text-foreground">Strategy type</h3>
        )}
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
          <section className={sectionClass}>
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

          <section className={sectionClass}>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {isSettings ? "Watchlist & allocation" : `${selectedCatalogItem?.title ?? "Plan"} details`}
              </h3>
              {isSettings && (
                <p className="mt-1 text-xs text-muted">
                  Update symbols and strategy-specific parameters. Use the screener
                  below to browse ideas.
                </p>
              )}
            </div>

            {values.primaryStrategy === "etf-core" ? (
              <>
                <EtfConfig values={values} onChange={patch} />
                {isSettings ? (
                  <CollapsibleSection
                    title="Browse ETF ideas"
                    description="Optional screener for core portfolio ETFs"
                    expanded={screenerExpanded}
                    onToggle={() => setScreenerExpanded((open) => !open)}
                  >
                    {screenerPanel}
                  </CollapsibleSection>
                ) : (
                  screenerPanel
                )}
              </>
            ) : (
              <>
                <SymbolConfig
                  accessToken={accessToken}
                  values={values}
                  symbolInput={symbolInput}
                  onSymbolInputChange={setSymbolInput}
                  onAddSymbol={addSymbol}
                  onRemoveSymbol={removeSymbol}
                />
                {isSettings ? (
                  <CollapsibleSection
                    title="Browse symbol ideas"
                    description="Optional screener filtered for your strategy"
                    expanded={screenerExpanded}
                    onToggle={() => setScreenerExpanded((open) => !open)}
                  >
                    {screenerPanel}
                  </CollapsibleSection>
                ) : (
                  screenerPanel
                )}
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
      {saved && !error && !isDirty && (
        <p className="text-sm text-accent-strong">Strategy settings saved.</p>
      )}

      {isSettings && isDirty && (
        <div className="sticky bottom-16 z-30 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur-md md:bottom-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">You have unsaved changes</p>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  setValues(savedBaseline);
                  setSaved(false);
                  setError(null);
                }}
              >
                Discard
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                isLoading={submitting}
                disabled={!isStrategyFormValid(values)}
                size="sm"
              >
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isSettings && (
        <div className="flex justify-end">
          <Button
            onClick={() => void handleSubmit()}
            isLoading={submitting}
            disabled={!isStrategyFormValid(values)}
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  description,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  description?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
      >
        <div>
          <p className="text-xs font-semibold text-foreground">{title}</p>
          {description && (
            <p className="mt-0.5 text-[11px] text-muted">{description}</p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border/60 px-3 py-3">{children}</div>
      )}
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
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold text-foreground">Your symbols</p>
        <p className="mt-0.5 text-[11px] text-muted">
          Up to 5 tickers for this strategy ({values.symbols.length}/5)
        </p>
      </div>
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
    </div>
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
