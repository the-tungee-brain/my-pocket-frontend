import type {
  InvestmentStrategy,
  StrategyCatalogItem,
  StrategyNextAction,
  StrategyRecommendations,
  UserInvestmentProfile,
  WheelPhase,
} from "@/app/types/strategy";

export const MAX_STRATEGY_SYMBOLS = 5;

export function symbolsFromProfile(
  profile: UserInvestmentProfile | null | undefined,
): string[] {
  if (!profile) return [];
  if (profile.wheel?.wheelSymbols?.length) {
    return profile.wheel.wheelSymbols.map((symbol) => symbol.toUpperCase());
  }
  if (profile.dividend?.dividendSymbols?.length) {
    return profile.dividend.dividendSymbols.map((symbol) => symbol.toUpperCase());
  }
  if (profile.etfCore?.targetAllocation) {
    return Object.keys(profile.etfCore.targetAllocation).map((symbol) =>
      symbol.toUpperCase(),
    );
  }
  return [];
}

export function isOnStrategyPlaybook(
  profile: UserInvestmentProfile | null | undefined,
  symbol: string,
): boolean {
  const upper = symbol.toUpperCase();
  return symbolsFromProfile(profile).includes(upper);
}

export function wheelPhaseLabel(phase: WheelPhase | null | undefined): string {
  switch (phase) {
    case "ready-for-csp":
      return "Ready for CSP";
    case "short-put-open":
      return "Put open";
    case "assigned-shares":
      return "Shares held";
    case "short-call-open":
      return "Call open";
    case "complete-cycle":
      return "Cycle complete";
    case "pick-symbol":
      return "Pick symbol";
    default:
      return "On playbook";
  }
}

export function formatStrategyPlaybookTitle(
  strategy: InvestmentStrategy,
  catalogItem?: StrategyCatalogItem | null,
): string {
  if (catalogItem?.title) return catalogItem.title;
  switch (strategy) {
    case "wheel":
      return "Wheel strategy";
    case "csp-income":
      return "Cash-secured puts";
    case "covered-call":
      return "Covered calls";
    case "dividend":
      return "Dividend investing";
    case "etf-core":
      return "ETF core portfolio";
    default:
      return strategy;
  }
}

export function primaryPlaybookAction(
  recommendations: StrategyRecommendations | null | undefined,
): StrategyNextAction | null {
  if (!recommendations?.nextActions?.length) return null;
  return recommendations.nextActions[0] ?? null;
}

export function actionTypeLabel(type: StrategyNextAction["type"]): string {
  switch (type) {
    case "connect":
      return "Connect";
    case "research":
      return "Research";
    case "options":
      return "Options";
    case "monitor":
      return "Monitor";
    case "buy":
      return "Buy";
    case "rebalance":
      return "Rebalance";
    case "education":
      return "Learn";
    default:
      return "Action";
  }
}

export function playbookAskPrompt(action: StrategyNextAction): string {
  const symbol = action.symbol?.trim().toUpperCase();
  const title = action.title.trim();
  const reason = action.reason.trim();

  if (!symbol) {
    return `${title} ${reason}`.trim();
  }

  switch (action.type) {
    case "options": {
      const lower = title.toLowerCase();
      if (lower.includes("covered call")) {
        return (
          `I have ${symbol} on my strategy playbook. ${reason} ` +
          "What covered call strike and expiration would you suggest, and what assignment risk should I plan for?"
        );
      }
      if (lower.includes("csp") || lower.includes("put")) {
        return (
          `For ${symbol} on my strategy playbook: ${reason} ` +
          "What cash-secured put strike and DTE fit my strategy, and would you sell the put here?"
        );
      }
      return `For ${symbol}: ${title}. ${reason} What option trade would you consider next?`;
    }
    case "monitor":
      return (
        `Monitor my ${symbol} options position. ${reason} ` +
        "What should I watch for, and when would you roll, close, or let it ride?"
      );
    case "research":
      return (
        `For ${symbol} on my strategy playbook: ${reason} ` +
        "Help me decide the next step — fundamentals, timing, and fit with my strategy."
      );
    case "buy":
      return (
        `For ${symbol}: ${reason} ` +
        "What's a sensible way to build the position without breaking my strategy rules?"
      );
    case "rebalance":
      return (
        `Review ${symbol} in my portfolio. ${reason} ` +
        "Should I add, trim, or hold based on my strategy targets?"
      );
    default:
      return `${symbol}: ${title}. ${reason}`;
  }
}

export function playbookActionAskable(action: StrategyNextAction): boolean {
  if (action.type === "connect" || action.type === "education") {
    return false;
  }
  return true;
}
