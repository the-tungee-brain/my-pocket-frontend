import type {
  IncomeVsGrowth,
  InvestmentStrategy,
  OptionsExperience,
  RiskTolerance,
  UserInvestmentProfile,
  UserInvestmentProfileUpdate,
} from "@/app/types/strategy";

export type StrategyFormValues = {
  primaryStrategy: InvestmentStrategy | null;
  riskTolerance: RiskTolerance;
  optionsExperience: OptionsExperience;
  incomeVsGrowth: IncomeVsGrowth;
  symbols: string[];
  etfPrimary: string;
  etfBond: string;
  etfStockPct: number;
  targetDeltaMin: number;
  targetDeltaMax: number;
  preferredDteDays: number;
  maxSingleNamePct: number;
  targetYieldPct: number | null;
  maxPayoutRatio: number;
  rebalanceThresholdPct: number;
};

export const DEFAULT_STRATEGY_FORM: StrategyFormValues = {
  primaryStrategy: null,
  riskTolerance: "moderate",
  optionsExperience: "beginner",
  incomeVsGrowth: "balanced",
  symbols: [],
  etfPrimary: "VTI",
  etfBond: "BND",
  etfStockPct: 70,
  targetDeltaMin: 0.2,
  targetDeltaMax: 0.3,
  preferredDteDays: 7,
  maxSingleNamePct: 15,
  targetYieldPct: null,
  maxPayoutRatio: 75,
  rebalanceThresholdPct: 5,
};

export function deltaBandForRisk(
  riskTolerance: RiskTolerance,
): Pick<StrategyFormValues, "targetDeltaMin" | "targetDeltaMax"> {
  switch (riskTolerance) {
    case "conservative":
      return { targetDeltaMin: 0.1, targetDeltaMax: 0.15 };
    case "aggressive":
      return { targetDeltaMin: 0.35, targetDeltaMax: 0.5 };
    default:
      return { targetDeltaMin: 0.2, targetDeltaMax: 0.3 };
  }
}

export function deltaBandDescription(riskTolerance: RiskTolerance): string {
  switch (riskTolerance) {
    case "conservative":
      return "0.10–0.15 delta — lower assignment risk, lower premium";
    case "aggressive":
      return "0.35+ delta — higher income, higher assignment risk";
    default:
      return "0.20–0.30 delta — balanced wheel sweet spot";
  }
}

const WHEEL_LIKE: InvestmentStrategy[] = [
  "wheel",
  "csp-income",
  "covered-call",
];

export function isWheelLikeStrategy(
  strategy: InvestmentStrategy | null,
): strategy is InvestmentStrategy {
  return strategy !== null && WHEEL_LIKE.includes(strategy);
}

export function profileToFormValues(
  profile: UserInvestmentProfile | null,
): StrategyFormValues {
  if (!profile) {
    return { ...DEFAULT_STRATEGY_FORM };
  }

  const allocation = profile.etfCore?.targetAllocation ?? {};
  const allocationEntries = Object.entries(allocation);
  const [etfPrimary, etfPrimaryPct] = allocationEntries[0] ?? ["VTI", 70];
  const [etfBond, etfBondPct] = allocationEntries[1] ?? ["BND", 30];
  const etfStockPct =
    etfPrimaryPct ??
    (etfBondPct != null ? 100 - etfBondPct : DEFAULT_STRATEGY_FORM.etfStockPct);

  let symbols: string[] = [];
  if (profile.wheel?.wheelSymbols?.length) {
    symbols = profile.wheel.wheelSymbols;
  } else if (profile.dividend?.dividendSymbols?.length) {
    symbols = profile.dividend.dividendSymbols;
  }

  return {
    primaryStrategy: profile.primaryStrategy,
    riskTolerance: profile.riskTolerance,
    optionsExperience: profile.optionsExperience,
    incomeVsGrowth: profile.incomeVsGrowth,
    symbols,
    etfPrimary,
    etfBond,
    etfStockPct,
    targetDeltaMin:
      profile.wheel?.targetDeltaMin ??
      deltaBandForRisk(profile.riskTolerance).targetDeltaMin,
    targetDeltaMax:
      profile.wheel?.targetDeltaMax ??
      deltaBandForRisk(profile.riskTolerance).targetDeltaMax,
    preferredDteDays:
      profile.wheel?.preferredDteDays ?? DEFAULT_STRATEGY_FORM.preferredDteDays,
    maxSingleNamePct:
      profile.wheel?.maxSingleNamePct ?? DEFAULT_STRATEGY_FORM.maxSingleNamePct,
    targetYieldPct: profile.dividend?.targetYieldPct ?? null,
    maxPayoutRatio:
      profile.dividend?.maxPayoutRatio ?? DEFAULT_STRATEGY_FORM.maxPayoutRatio,
    rebalanceThresholdPct:
      profile.etfCore?.rebalanceThresholdPct ??
      DEFAULT_STRATEGY_FORM.rebalanceThresholdPct,
  };
}

export function formValuesToUpdate(
  values: StrategyFormValues,
  options: { completeOnboarding?: boolean } = {},
): UserInvestmentProfileUpdate {
  const payload: UserInvestmentProfileUpdate = {
    primaryStrategy: values.primaryStrategy,
    riskTolerance: values.riskTolerance,
    optionsExperience: values.optionsExperience,
    incomeVsGrowth: values.incomeVsGrowth,
    completeOnboarding: options.completeOnboarding,
  };

  if (isWheelLikeStrategy(values.primaryStrategy)) {
    payload.wheel = {
      wheelSymbols: values.symbols,
      targetDeltaMin: values.targetDeltaMin,
      targetDeltaMax: values.targetDeltaMax,
      preferredDteDays: values.preferredDteDays,
      maxSingleNamePct: values.maxSingleNamePct,
    };
  }

  if (values.primaryStrategy === "dividend") {
    payload.dividend = {
      dividendSymbols: values.symbols,
      targetYieldPct: values.targetYieldPct,
      maxPayoutRatio: values.maxPayoutRatio,
    };
  }

  if (values.primaryStrategy === "etf-core") {
    payload.etfCore = {
      targetAllocation: {
        [values.etfPrimary.toUpperCase()]: values.etfStockPct,
        [values.etfBond.toUpperCase()]: 100 - values.etfStockPct,
      },
      rebalanceThresholdPct: values.rebalanceThresholdPct,
    };
  }

  return payload;
}

export function isStrategyFormValid(values: StrategyFormValues): boolean {
  if (!values.primaryStrategy) return false;

  if (values.primaryStrategy === "etf-core") {
    return values.etfPrimary.trim().length > 0 && values.etfBond.trim().length > 0;
  }

  return values.symbols.length > 0;
}
