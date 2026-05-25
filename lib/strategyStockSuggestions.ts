import type {
  InvestmentStrategy,
  UserInvestmentProfile,
  UserInvestmentProfileUpdate,
} from "@/app/types/strategy";
import type { StrategyFormValues } from "@/lib/strategyProfileForm";
import { isWheelLikeStrategy } from "@/lib/strategyProfileForm";

const WHEEL_LIKE: InvestmentStrategy[] = ["wheel", "csp-income", "covered-call"];

export function needsStrategyStockSuggestions(
  strategy: InvestmentStrategy | null,
  profile: UserInvestmentProfile | null,
): boolean {
  if (!strategy) return false;

  if (WHEEL_LIKE.includes(strategy)) {
    return !(profile?.wheel?.wheelSymbols?.length);
  }
  if (strategy === "dividend") {
    return !(profile?.dividend?.dividendSymbols?.length);
  }
  if (strategy === "etf-core") {
    return !Object.keys(profile?.etfCore?.targetAllocation ?? {}).length;
  }
  return false;
}

export function needsStrategyStockSuggestionsFromForm(
  values: StrategyFormValues,
): boolean {
  if (!values.primaryStrategy) return false;
  if (values.primaryStrategy === "etf-core") return false;
  return values.symbols.length === 0;
}

export function buildPreferencesDraftUpdate(
  strategy: InvestmentStrategy,
  prefs: {
    riskTolerance: StrategyFormValues["riskTolerance"];
    optionsExperience: StrategyFormValues["optionsExperience"];
    incomeVsGrowth: StrategyFormValues["incomeVsGrowth"];
  },
): UserInvestmentProfileUpdate {
  const payload: UserInvestmentProfileUpdate = {
    primaryStrategy: strategy,
    riskTolerance: prefs.riskTolerance,
    optionsExperience: prefs.optionsExperience,
    incomeVsGrowth: prefs.incomeVsGrowth,
  };

  if (isWheelLikeStrategy(strategy)) {
    payload.wheel = {
      wheelSymbols: [],
      targetDeltaMin: 0.2,
      targetDeltaMax: 0.3,
      preferredDteDays: 7,
      maxSingleNamePct: 15,
    };
  }

  if (strategy === "dividend") {
    payload.dividend = {
      dividendSymbols: [],
      targetYieldPct: prefs.incomeVsGrowth === "income" ? 3.5 : null,
      maxPayoutRatio: 75,
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

  if (WHEEL_LIKE.includes(strategy)) {
    const existing = profile.wheel?.wheelSymbols ?? [];
    if (existing.map((item) => item.toUpperCase()).includes(upper)) return null;
    return {
      wheel: {
        wheelSymbols: [...existing, upper],
        targetDeltaMin: profile.wheel?.targetDeltaMin ?? 0.2,
        targetDeltaMax: profile.wheel?.targetDeltaMax ?? 0.3,
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

  return null;
}
