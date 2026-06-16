import type { SectorWeight } from "@/app/types/intelligence";
import type {
  PortfolioOptimizationResponse,
  PortfolioOptimizationScoreTone,
} from "@/app/types/portfolioOptimization";
import type { Position, SchwabAccounts } from "@/app/types/schwab";
import { formatUsd } from "@/lib/formatCurrency";

const UNKNOWN_SECTOR_LABEL = "Unknown";
const FUND_ASSET_TYPES = new Set(["ETF", "FUND", "MUTUALFUND", "MUTUAL_FUND"]);

type HoldingRow = {
  symbol: string;
  marketValue: number;
  assetType?: string | null;
  quantity?: number | null;
  latestPrice?: number | null;
};

function clamp(value: number, low = 0, high = 100) {
  return Math.max(low, Math.min(high, value));
}

function scoreFromPenalty(maxScore: number, penalty: number) {
  return Math.round(clamp(maxScore - penalty, 0, maxScore) * 100) / 100;
}

function status(score: number | null | undefined, maxScore: number) {
  if (score == null || maxScore <= 0) return "unavailable" as const;
  const ratio = score / maxScore;
  if (ratio >= 0.85) return "strong" as const;
  if (ratio >= 0.65) return "good" as const;
  if (ratio >= 0.4) return "watch" as const;
  return "poor" as const;
}

function rating(score: number): PortfolioOptimizationResponse["rating"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  if (score >= 40) return "Weak";
  return "Poor";
}

function scoreTone(score: number): PortfolioOptimizationScoreTone {
  return rating(score).toLowerCase() as PortfolioOptimizationScoreTone;
}

function scoreColor(score: number) {
  if (score >= 85) return "#16a34a";
  if (score >= 70) return "#22c55e";
  if (score >= 55) return "#ca8a04";
  if (score >= 40) return "#f97316";
  return "#dc2626";
}

function stockLevel(weightPct: number) {
  if (weightPct >= 50) return "critical" as const;
  if (weightPct >= 30) return "high" as const;
  if (weightPct >= 20) return "elevated" as const;
  return "normal" as const;
}

function isFundAssetType(value?: string | null) {
  if (!value) return false;
  return FUND_ASSET_TYPES.has(value.trim().toUpperCase().replaceAll(" ", "_"));
}

function effectiveNames(weights: { portfolioWeightPct: number }[]) {
  const hhi = weights.reduce(
    (sum, item) => sum + (item.portfolioWeightPct / 100) ** 2,
    0,
  );
  return hhi > 0 ? Math.round((1 / hhi) * 100) / 100 : 0;
}

function allocationValue(totalValue: number, allocationPct: number) {
  return Math.round(totalValue * (allocationPct / 100) * 100) / 100;
}

function dollarPhrase(value: number) {
  return formatUsd(Math.abs(value), { maximumFractionDigits: 0 });
}

function sharesPhrase(value: number) {
  return `${Math.round(value)} shares`;
}

function pctPhrase(value: number) {
  return `${value.toFixed(1)}%`;
}

function scoreBreakdown(
  items: Array<{ label: string; points: number }>,
): Array<{ label: string; points: number }> {
  return items
    .map((item) => ({ ...item, points: Math.round(item.points) }))
    .filter((item) => item.points > 0);
}

function sectorRedirectPhrase(sector: string) {
  if (sector === UNKNOWN_SECTOR_LABEL) {
    return "Healthcare, Financials, Industrials, Consumer Staples, or broad-market ETFs as sector metadata improves";
  }
  return `Healthcare, Financials, Industrials, Consumer Staples, broad-market ETFs, and other non-${sector} exposure`;
}

function emptyOptimization(dataGaps: string[]): PortfolioOptimizationResponse {
  const unavailable = {
    score: null,
    maxScore: 0,
    status: "unavailable" as const,
    summary: "Portfolio positions are not available.",
  };
  return {
    diversificationScore: 0,
    rating: "Poor",
    scoreTone: "poor",
    scoreColor: scoreColor(0),
    stockWeights: [],
    sectorWeights: [],
    breakdown: {
      stockConcentration: { ...unavailable, maxScore: 30 },
      sectorConcentration: { ...unavailable, maxScore: 25 },
      etfDiversification: { ...unavailable, maxScore: 15 },
      cashAllocation: { ...unavailable, maxScore: 10 },
      positionCount: { ...unavailable, maxScore: 10 },
      correlation: { ...unavailable, maxScore: 10 },
    },
    topDrivers: [],
    rankedSuggestions: [],
    dataGaps,
  };
}

function positionRows(positions: Position[]): HoldingRow[] {
  const rows = new Map<string, HoldingRow>();
  for (const position of positions) {
    const instrument = position.instrument;
    const symbol =
      instrument.assetType === "OPTION"
        ? (instrument.underlyingSymbol ?? instrument.symbol)
        : instrument.symbol;
    const symbolUpper = symbol?.toUpperCase();
    if (!symbolUpper) continue;
    const existing = rows.get(symbolUpper);
    rows.set(symbolUpper, {
      symbol: symbolUpper,
      marketValue:
        (existing?.marketValue ?? 0) + Math.abs(position.marketValue),
      assetType: existing?.assetType ?? instrument.assetType,
      quantity:
        (existing?.quantity ?? 0) +
        (instrument.assetType === "EQUITY"
          ? Math.abs(
              (position.longQuantity ?? 0) - (position.shortQuantity ?? 0),
            )
          : 0),
      latestPrice:
        instrument.assetType === "EQUITY" &&
        Math.abs((position.longQuantity ?? 0) - (position.shortQuantity ?? 0)) >
          0
          ? Math.abs(position.marketValue) /
            Math.abs(
              (position.longQuantity ?? 0) - (position.shortQuantity ?? 0),
            )
          : existing?.latestPrice,
    });
  }
  return [...rows.values()];
}

export function buildLocalPortfolioOptimization({
  positions,
  account,
}: {
  positions: Position[];
  account: SchwabAccounts | null;
}): PortfolioOptimizationResponse | null {
  if (!account) return null;
  const liquidationValue =
    account.securitiesAccount.currentBalances.liquidationValue;
  const rows = positionRows(positions);
  if (!rows.length || liquidationValue <= 0) {
    return emptyOptimization(["No current holdings are available."]);
  }

  const totalHoldingsMarketValue = rows.reduce(
    (sum, row) => sum + row.marketValue,
    0,
  );
  const stockWeights = rows
    .map((row) => {
      const portfolioWeightPct = (row.marketValue / liquidationValue) * 100;
      return {
        symbol: row.symbol,
        portfolioWeightPct,
        investedWeightPct:
          totalHoldingsMarketValue > 0
            ? (row.marketValue / totalHoldingsMarketValue) * 100
            : null,
        weightPct: portfolioWeightPct,
        marketValue: row.marketValue,
        level: stockLevel(portfolioWeightPct),
      };
    })
    .sort((a, b) => b.portfolioWeightPct - a.portfolioWeightPct);

  const sectorMap = new Map<string, { value: number; symbols: string[] }>();
  for (const row of rows) {
    const sector = isFundAssetType(row.assetType)
      ? "ETF"
      : UNKNOWN_SECTOR_LABEL;
    const existing = sectorMap.get(sector) ?? { value: 0, symbols: [] };
    sectorMap.set(sector, {
      value: existing.value + row.marketValue,
      symbols: [...existing.symbols, row.symbol].sort(),
    });
  }
  const sectorWeights: SectorWeight[] = [...sectorMap.entries()]
    .map(([sector, item]) => ({
      sector,
      weightPct: (item.value / liquidationValue) * 100,
      symbols: item.symbols,
    }))
    .sort((a, b) => b.weightPct - a.weightPct);

  const top1 = stockWeights[0]?.portfolioWeightPct ?? 0;
  const top3 = stockWeights
    .slice(0, 3)
    .reduce((sum, item) => sum + item.portfolioWeightPct, 0);
  const effective = effectiveNames(stockWeights);
  const topSector = sectorWeights[0] ?? null;
  const etfWeight =
    sectorWeights.find((item) => item.sector === "ETF")?.weightPct ?? 0;
  const cashAfterCsp = account.securitiesAccount.currentBalances.cashBalance;
  const cashPct = (cashAfterCsp / liquidationValue) * 100;

  const stockScore = scoreFromPenalty(
    30,
    Math.max(top1 - 20, 0) * 0.45 +
      Math.max(top3 - 55, 0) * 0.25 +
      Math.max(6 - effective, 0) * 2.5,
  );
  const sectorScore = scoreFromPenalty(
    25,
    Math.max((topSector?.weightPct ?? 0) - 35, 0) * 0.45,
  );
  const etfScore =
    etfWeight >= 30
      ? 15
      : etfWeight <= 0
        ? 0
        : clamp((etfWeight / 30) * 15, 0, 15);
  const cashScore =
    cashPct >= 5 && cashPct <= 20
      ? 10
      : cashPct < 5
        ? clamp((cashPct / 5) * 10, 0, 10)
        : scoreFromPenalty(10, (cashPct - 20) * 0.25);
  const countScore =
    stockWeights.length >= 8 && stockWeights.length <= 25
      ? 10
      : stockWeights.length < 8
        ? clamp((stockWeights.length / 8) * 10, 0, 10)
        : scoreFromPenalty(10, (stockWeights.length - 25) * 0.2);
  const score = Math.round(
    stockScore + sectorScore + etfScore + cashScore + countScore,
  );

  const topDrivers = [
    ...(top1 >= 20
      ? [
          {
            category: "stockConcentration",
            title: "Single-name concentration",
            detail: `Largest holding is ${top1.toFixed(1)}% of the portfolio.`,
            impactScore: Math.min(100, top1 * 1.5),
          },
        ]
      : []),
    ...(topSector && topSector.weightPct >= 35
      ? [
          {
            category: "sectorConcentration",
            title: "Sector concentration",
            detail: `${topSector.sector} is ${topSector.weightPct.toFixed(1)}% of the portfolio.`,
            impactScore: Math.min(100, topSector.weightPct * 1.2),
          },
        ]
      : []),
    ...(etfWeight < 20
      ? [
          {
            category: "etfDiversification",
            title: "Low broad ETF exposure",
            detail: `ETF exposure is ${etfWeight.toFixed(1)}%.`,
            impactScore: Math.min(100, 60 - etfWeight),
          },
        ]
      : []),
  ].sort((a, b) => b.impactScore - a.impactScore);

  const suggestions: PortfolioOptimizationResponse["rankedSuggestions"] = [];
  const rowsBySymbol = new Map(rows.map((row) => [row.symbol, row]));
  const topStock = stockWeights[0] ?? null;
  const targetEtfWeight = 25;
  const shouldMergeConcentrationPlan =
    !!topStock &&
    topStock.portfolioWeightPct >= 50 &&
    etfWeight < targetEtfWeight;
  if (topStock && topStock.portfolioWeightPct >= 20) {
    const target =
      topStock.portfolioWeightPct >= 70
        ? 40
        : topStock.portfolioWeightPct >= 50
          ? 30
          : 20;
    const targetValue = allocationValue(liquidationValue, target);
    const deltaValue = targetValue - topStock.marketValue;
    const row = rowsBySymbol.get(topStock.symbol);
    const estimatedShares =
      row?.assetType === "EQUITY" && row.latestPrice && row.latestPrice > 0
        ? Math.round((Math.abs(deltaValue) / row.latestPrice) * 100) / 100
        : null;
    const estimatedScoreImprovement = Math.round(
      Math.min(30, Math.max(topStock.portfolioWeightPct - target, 0) * 0.5),
    );
    const targetEtfValue = allocationValue(liquidationValue, targetEtfWeight);
    const etfDeltaValue =
      targetEtfValue - allocationValue(liquidationValue, etfWeight);
    suggestions.push({
      rank: 1,
      category: shouldMergeConcentrationPlan
        ? "portfolioRebalance"
        : "stockConcentration",
      title: shouldMergeConcentrationPlan
        ? `Trim ${topStock.symbol} and diversify into broad-market ETFs`
        : `Trim ${topStock.symbol} toward ${target}%`,
      why: shouldMergeConcentrationPlan
        ? `${topStock.symbol} is the main concentration risk; using part of the trim to build broad ETF exposure also reduces sector and single-stock dependence.`
        : `${topStock.symbol} is the main source of single-name concentration risk.`,
      action: shouldMergeConcentrationPlan
        ? `Trim approximately ${dollarPhrase(deltaValue)} of ${topStock.symbol}${
            estimatedShares ? `, about ${sharesPhrase(estimatedShares)}` : ""
          }. Fund this by trimming concentrated positions, redirecting future contributions, or reallocating excess cash.`
        : `Trim approximately ${dollarPhrase(deltaValue)} of ${topStock.symbol}${
            estimatedShares ? `, about ${sharesPhrase(estimatedShares)}` : ""
          }.`,
      currentAllocationPct: topStock.portfolioWeightPct,
      targetAllocationPct: target,
      currentValue: topStock.marketValue,
      targetValue,
      deltaValue,
      estimatedShares,
      impactScore: Math.min(100, topStock.portfolioWeightPct * 1.4),
      estimatedScoreImprovement,
      estimatedScoreBreakdown: scoreBreakdown([
        {
          label: "Single-name concentration",
          points: estimatedScoreImprovement * 0.7,
        },
        {
          label: "Sector diversification",
          points: estimatedScoreImprovement * 0.2,
        },
        {
          label: "ETF exposure",
          points: estimatedScoreImprovement * 0.1,
        },
      ]),
      planDetails: [
        {
          label: `${topStock.symbol} allocation`,
          value: `${pctPhrase(topStock.portfolioWeightPct)} -> ${pctPhrase(target)}`,
        },
        {
          label: "Trim amount",
          value: estimatedShares
            ? `${dollarPhrase(deltaValue)} / about ${sharesPhrase(estimatedShares)}`
            : dollarPhrase(deltaValue),
        },
        ...(shouldMergeConcentrationPlan
          ? [
              {
                label: "Target ETF exposure",
                value: `${pctPhrase(targetEtfWeight)} · ${dollarPhrase(targetEtfValue)}`,
              },
              {
                label: "ETF funding gap",
                value: dollarPhrase(etfDeltaValue),
              },
              {
                label: "Destinations",
                value:
                  "Broad-market ETFs plus Healthcare, Financials, Industrials, and Consumer Staples exposure.",
              },
            ]
          : []),
      ],
      symbols: [topStock.symbol],
    });
  }
  if (topSector && topSector.weightPct >= 35 && !shouldMergeConcentrationPlan) {
    const target = topSector.weightPct >= 60 ? 60 : 35;
    const currentValue = allocationValue(liquidationValue, topSector.weightPct);
    const targetValue = allocationValue(liquidationValue, target);
    const deltaValue = targetValue - currentValue;
    const estimatedScoreImprovement = Math.round(
      Math.min(25, Math.max(topSector.weightPct - target, 0) * 0.3),
    );
    suggestions.push({
      rank: suggestions.length + 1,
      category: "sectorConcentration",
      title: `Bring ${topSector.sector} below ${target}%`,
      why: "Portfolio risk is concentrated in one sector, which can make outcomes depend on the same market drivers.",
      action: `Redirect approximately ${dollarPhrase(deltaValue)} of ${topSector.sector} exposure into ${sectorRedirectPhrase(topSector.sector)}.`,
      currentAllocationPct: topSector.weightPct,
      targetAllocationPct: target,
      currentValue,
      targetValue,
      deltaValue,
      impactScore: Math.min(100, topSector.weightPct * 1.2),
      estimatedScoreImprovement,
      estimatedScoreBreakdown: scoreBreakdown([
        {
          label: "Sector diversification",
          points: estimatedScoreImprovement * 0.75,
        },
        {
          label: "Single-name concentration",
          points: estimatedScoreImprovement * 0.15,
        },
        {
          label: "ETF exposure",
          points: estimatedScoreImprovement * 0.1,
        },
      ]),
      planDetails: [
        {
          label: "Example destinations",
          value: sectorRedirectPhrase(topSector.sector),
        },
      ],
      symbols: topSector.symbols.slice(0, 5),
    });
  }
  if (etfWeight < targetEtfWeight && !shouldMergeConcentrationPlan) {
    const target = targetEtfWeight;
    const currentValue = allocationValue(liquidationValue, etfWeight);
    const targetValue = allocationValue(liquidationValue, target);
    const deltaValue = targetValue - currentValue;
    const estimatedScoreImprovement = Math.round(
      Math.min(15, (target - etfWeight) * 0.3),
    );
    suggestions.push({
      rank: suggestions.length + 1,
      category: "etfDiversification",
      title: `Increase broad ETF exposure to ${target}%`,
      why: "Broad ETFs reduce dependence on single-stock outcomes.",
      action: `Fund approximately ${dollarPhrase(deltaValue)} of broad-market ETFs such as VOO, VTI, or SCHB. Fund this by trimming concentrated positions, redirecting future contributions, or reallocating excess cash.`,
      currentAllocationPct: etfWeight,
      targetAllocationPct: target,
      currentValue,
      targetValue,
      deltaValue,
      impactScore: Math.min(100, 70 - etfWeight),
      estimatedScoreImprovement,
      estimatedScoreBreakdown: scoreBreakdown([
        { label: "ETF exposure", points: estimatedScoreImprovement * 0.65 },
        {
          label: "Single-name concentration",
          points: estimatedScoreImprovement * 0.2,
        },
        {
          label: "Sector diversification",
          points: estimatedScoreImprovement * 0.15,
        },
      ]),
      planDetails: [
        {
          label: "Funding source",
          value:
            "Trim concentrated positions, redirect future contributions, or reallocate excess cash.",
        },
      ],
      symbols: [],
    });
  }

  return {
    diversificationScore: clamp(score),
    rating: rating(score),
    scoreTone: scoreTone(score),
    scoreColor: scoreColor(score),
    stockWeights,
    sectorWeights,
    breakdown: {
      stockConcentration: {
        score: stockScore,
        maxScore: 30,
        status: status(stockScore, 30),
        summary: `Largest name is ${top1.toFixed(1)}%; top three are ${top3.toFixed(1)}%.`,
      },
      sectorConcentration: {
        score: sectorScore,
        maxScore: 25,
        status: status(sectorScore, 25),
        summary: topSector
          ? `Largest sector is ${topSector.sector} at ${topSector.weightPct.toFixed(1)}%.`
          : "Sector allocation is not available.",
      },
      etfDiversification: {
        score: etfScore,
        maxScore: 15,
        status: status(etfScore, 15),
        summary: `Broad ETF exposure is ${etfWeight.toFixed(1)}%.`,
      },
      cashAllocation: {
        score: cashScore,
        maxScore: 10,
        status: status(cashScore, 10),
        summary: `Cash is ${cashPct.toFixed(1)}% of portfolio.`,
      },
      positionCount: {
        score: countScore,
        maxScore: 10,
        status: status(countScore, 10),
        summary: `${stockWeights.length} names; effective diversification is ${effective.toFixed(1)} names.`,
      },
      correlation: {
        score: null,
        maxScore: 10,
        status: "unavailable",
        summary: "Correlation scoring is not available yet.",
      },
    },
    topDrivers,
    rankedSuggestions: suggestions
      .sort((a, b) => b.impactScore - a.impactScore)
      .map((item, index) => ({ ...item, rank: index + 1 }))
      .slice(0, 5),
    dataGaps: ["Sector metadata unavailable; showing limited fallback."],
  };
}
