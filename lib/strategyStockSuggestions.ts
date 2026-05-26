import type {
  InvestmentStrategy,
  UserInvestmentProfile,
  UserInvestmentProfileUpdate,
} from "@/app/types/strategy";
import type { StrategyFormValues } from "@/lib/strategyProfileForm";
import { isWheelLikeStrategy, deltaBandForRisk } from "@/lib/strategyProfileForm";

const SUPPORTED_STRATEGIES: InvestmentStrategy[] = [
  "wheel",
  "csp-income",
  "covered-call",
  "dividend",
  "etf-core",
];

export function supportsStrategyStockSuggestions(
  strategy: InvestmentStrategy | null,
): strategy is InvestmentStrategy {
  return strategy !== null && SUPPORTED_STRATEGIES.includes(strategy);
}

export function buildPreferencesDraftUpdate(
  strategy: InvestmentStrategy,
  prefs: {
    riskTolerance: StrategyFormValues["riskTolerance"];
    optionsExperience: StrategyFormValues["optionsExperience"];
    incomeVsGrowth: StrategyFormValues["incomeVsGrowth"];
  },
  symbols: string[] = [],
): UserInvestmentProfileUpdate {
  const payload: UserInvestmentProfileUpdate = {
    primaryStrategy: strategy,
    riskTolerance: prefs.riskTolerance,
    optionsExperience: prefs.optionsExperience,
    incomeVsGrowth: prefs.incomeVsGrowth,
  };

  if (isWheelLikeStrategy(strategy)) {
    const deltaBand = deltaBandForRisk(prefs.riskTolerance);
    payload.wheel = {
      wheelSymbols: symbols,
      targetDeltaMin: deltaBand.targetDeltaMin,
      targetDeltaMax: deltaBand.targetDeltaMax,
      preferredDteDays: 7,
      maxSingleNamePct: 15,
    };
  }

  if (strategy === "dividend") {
    payload.dividend = {
      dividendSymbols: symbols,
      targetYieldPct: prefs.incomeVsGrowth === "income" ? 3.5 : null,
      maxPayoutRatio: 75,
    };
  }

  if (strategy === "etf-core") {
    payload.etfCore = {
      targetAllocation: {},
      rebalanceThresholdPct: 5,
    };
  }

  return payload;
}

export function buildAddSymbolUpdate(
  profile: UserInvestmentProfile,
  symbol: string,
): UserInvestmentProfileUpdate | null {
  const upper = symbol.toUpperCase();
  const strategy = profile.primaryStrategy;
  if (!strategy) return null;

  if (isWheelLikeStrategy(strategy)) {
    const existing = profile.wheel?.wheelSymbols ?? [];
    if (existing.map((item) => item.toUpperCase()).includes(upper)) return null;
    return {
      wheel: {
        wheelSymbols: [...existing, upper],
        targetDeltaMin:
          profile.wheel?.targetDeltaMin ??
          deltaBandForRisk(profile.riskTolerance).targetDeltaMin,
        targetDeltaMax:
          profile.wheel?.targetDeltaMax ??
          deltaBandForRisk(profile.riskTolerance).targetDeltaMax,
        preferredDteDays: profile.wheel?.preferredDteDays ?? 7,
        maxSingleNamePct: profile.wheel?.maxSingleNamePct ?? 15,
      },
    };
  }

  if (strategy === "dividend") {
    const existing = profile.dividend?.dividendSymbols ?? [];
    if (existing.map((item) => item.toUpperCase()).includes(upper)) return null;
    return {
      dividend: {
        dividendSymbols: [...existing, upper],
        targetYieldPct: profile.dividend?.targetYieldPct ?? null,
        maxPayoutRatio: profile.dividend?.maxPayoutRatio ?? 75,
      },
    };
  }

  if (strategy === "etf-core") {
    const existing = profile.etfCore?.targetAllocation ?? {};
    if (Object.keys(existing).map((item) => item.toUpperCase()).includes(upper)) {
      return null;
    }
    return {
      etfCore: {
        targetAllocation: { ...existing, [upper]: 0 },
        rebalanceThresholdPct: profile.etfCore?.rebalanceThresholdPct ?? 5,
      },
    };
  }

  return null;
}
