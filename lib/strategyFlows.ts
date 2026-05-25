import type { InvestmentStrategy } from "@/app/types/strategy";

export type StrategyFlowNode = {
  id: string;
  title: string;
  caption: string;
};

export type StrategyFlowDefinition = {
  strategy: InvestmentStrategy;
  /** Draw a loop-back arrow from the last step to the first (even step count). */
  repeats?: boolean;
  nodes: StrategyFlowNode[];
};

export const STRATEGY_FLOWS: Record<InvestmentStrategy, StrategyFlowDefinition> =
  {
    wheel: {
      strategy: "wheel",
      repeats: true,
      nodes: [
        {
          id: "pick-symbol",
          title: "Pick a stock",
          caption: "Choose names you would be happy to own long term.",
        },
        {
          id: "sell-put",
          title: "Sell cash-secured put",
          caption: "Collect premium while waiting to buy at your strike.",
        },
        {
          id: "own-shares",
          title: "Own the shares",
          caption: "Get assigned or buy shares if the put is exercised.",
        },
        {
          id: "sell-call",
          title: "Sell covered call",
          caption: "Earn income on shares until called away or expired.",
        },
      ],
    },
    "csp-income": {
      strategy: "csp-income",
      nodes: [
        {
          id: "pick-symbol",
          title: "Pick a stock",
          caption: "Focus on liquid names you would buy at a lower price.",
        },
        {
          id: "sell-put",
          title: "Sell cash-secured put",
          caption: "Set aside cash and collect premium upfront.",
        },
        {
          id: "manage",
          title: "Manage the position",
          caption: "Let expire, close early, or take assignment.",
        },
        {
          id: "repeat",
          title: "Re-deploy cash",
          caption: "Open the next put when capital is free again.",
        },
      ],
    },
    "covered-call": {
      strategy: "covered-call",
      nodes: [
        {
          id: "own-shares",
          title: "Own 100+ shares",
          caption: "Start with stock you already hold or plan to keep.",
        },
        {
          id: "sell-call",
          title: "Sell covered call",
          caption: "Cap upside in exchange for premium income.",
        },
        {
          id: "outcome",
          title: "Expiration or assignment",
          caption: "Shares called away, or sell another call.",
        },
        {
          id: "repeat",
          title: "Repeat on shares",
          caption: "Keep writing calls while you hold the underlying.",
        },
      ],
    },
    dividend: {
      strategy: "dividend",
      nodes: [
        {
          id: "pick-dividend",
          title: "Pick dividend payers",
          caption: "Prioritize yield, payout safety, and business quality.",
        },
        {
          id: "build",
          title: "Build positions",
          caption: "Buy in sizes that match your diversification rules.",
        },
        {
          id: "collect",
          title: "Collect income",
          caption: "Reinvest dividends or take them as cash flow.",
        },
        {
          id: "monitor",
          title: "Monitor fundamentals",
          caption: "Watch payout ratio, growth, and sector balance.",
        },
      ],
    },
    "etf-core": {
      strategy: "etf-core",
      nodes: [
        {
          id: "allocate",
          title: "Set target allocation",
          caption: "Define stock/bond mix and core ETF weights.",
        },
        {
          id: "buy",
          title: "Buy the core ETFs",
          caption: "Fund positions toward your target weights.",
        },
        {
          id: "rebalance",
          title: "Rebalance over time",
          caption: "Trim winners and add to laggards when drift is large.",
        },
        {
          id: "hold",
          title: "Stay the course",
          caption: "Keep contributions steady and review on a schedule.",
        },
      ],
    },
  };

export function getStrategyFlow(
  strategy: InvestmentStrategy,
): StrategyFlowDefinition {
  return STRATEGY_FLOWS[strategy];
}
