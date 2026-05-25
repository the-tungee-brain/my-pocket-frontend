export type InvestmentStrategy =
  | "wheel"
  | "csp-income"
  | "covered-call"
  | "dividend"
  | "etf-core";

export type JourneyStepStatus =
  | "locked"
  | "available"
  | "in-progress"
  | "completed"
  | "skipped";

export type WheelPhase =
  | "pick-symbol"
  | "ready-for-csp"
  | "short-put-open"
  | "assigned-shares"
  | "short-call-open"
  | "complete-cycle";

export type RiskTolerance = "conservative" | "moderate" | "aggressive";
export type OptionsExperience = "none" | "beginner" | "intermediate" | "advanced";
export type IncomeVsGrowth = "income" | "balanced" | "growth";

export type WheelStrategyConfig = {
  wheelSymbols: string[];
  targetDeltaMin?: number;
  targetDeltaMax?: number;
  preferredDteDays?: number;
  maxSingleNamePct?: number;
};

export type DividendStrategyConfig = {
  dividendSymbols: string[];
  targetYieldPct?: number | null;
  maxPayoutRatio?: number | null;
};

export type EtfCoreStrategyConfig = {
  targetAllocation: Record<string, number>;
  rebalanceThresholdPct?: number;
};

export type UserInvestmentProfile = {
  userId: string;
  primaryStrategy: InvestmentStrategy | null;
  riskTolerance: RiskTolerance;
  optionsExperience: OptionsExperience;
  incomeVsGrowth: IncomeVsGrowth;
  wheel?: WheelStrategyConfig | null;
  dividend?: DividendStrategyConfig | null;
  etfCore?: EtfCoreStrategyConfig | null;
  onboardingCompletedAt?: string | null;
};

export type UserInvestmentProfileUpdate = {
  primaryStrategy?: InvestmentStrategy | null;
  riskTolerance?: RiskTolerance;
  optionsExperience?: OptionsExperience;
  incomeVsGrowth?: IncomeVsGrowth;
  wheel?: WheelStrategyConfig | null;
  dividend?: DividendStrategyConfig | null;
  etfCore?: EtfCoreStrategyConfig | null;
  completeOnboarding?: boolean;
};

export type JourneyStep = {
  stepId: string;
  title: string;
  description: string;
  status: JourneyStepStatus;
  order: number;
  completedAt?: string | null;
  metadata?: Record<string, unknown>;
};

export type StrategyCatalogItem = {
  id: InvestmentStrategy;
  title: string;
  subtitle: string;
  description: string;
  bestFor: string[];
  prerequisites: string[];
  stepCount: number;
  requiresSchwab: boolean;
  requiresOptions: boolean;
};

export type UserStrategyJourney = {
  id?: string | null;
  userId: string;
  strategy: InvestmentStrategy;
  currentStepId?: string | null;
  steps: JourneyStep[];
  completionPct: number;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type StrategyReadiness = {
  schwabLinked: boolean;
  hasPositions: boolean;
  cashAvailable?: number | null;
  approvedSymbols: string[];
};

export type StrategyNextAction = {
  type:
    | "connect"
    | "education"
    | "research"
    | "options"
    | "buy"
    | "rebalance"
    | "monitor";
  title: string;
  reason: string;
  symbol?: string | null;
  actionId?: string | null;
  metadata?: Record<string, unknown>;
};

export type StrategyRecommendations = {
  strategy: InvestmentStrategy;
  currentStep?: JourneyStep | null;
  wheelPhase?: WheelPhase | null;
  readiness: StrategyReadiness;
  symbol?: string | null;
  nextActions: StrategyNextAction[];
};

export type SelectStrategyResponse = {
  profile: UserInvestmentProfile;
  journey: UserStrategyJourney;
};
