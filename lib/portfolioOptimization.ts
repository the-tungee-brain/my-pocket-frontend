import type { SectorWeight } from "@/app/types/intelligence";
import type { PortfolioOptimizationResponse } from "@/app/types/portfolioOptimization";
import type { Position, SchwabAccounts } from "@/app/types/schwab";

const UNKNOWN_SECTOR_LABEL = "Unknown";
const FUND_ASSET_TYPES = new Set(["ETF", "FUND", "MUTUALFUND", "MUTUAL_FUND"]);

type HoldingRow = {
  symbol: string;
  marketValue: number;
  assetType?: string | null;
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

  const suggestions = [];
  const topStock = stockWeights[0] ?? null;
  if (topStock && topStock.portfolioWeightPct >= 20) {
    const target =
      topStock.portfolioWeightPct >= 70
        ? 50
        : topStock.portfolioWeightPct >= 50
          ? 30
          : 20;
    suggestions.push({
      rank: 1,
      category: "stockConcentration",
      title: `Reduce ${topStock.symbol} below ${target}%`,
      why: `${topStock.symbol} is ${topStock.portfolioWeightPct.toFixed(1)}% of portfolio value.`,
      action:
        "Trim or avoid adding until the position falls below the target weight.",
      impactScore: Math.min(100, topStock.portfolioWeightPct * 1.4),
      estimatedScoreImprovement: Math.round(
        Math.min(30, Math.max(topStock.portfolioWeightPct - target, 0) * 0.5),
      ),
      symbols: [topStock.symbol],
    });
  }
  if (topSector && topSector.weightPct >= 35) {
    suggestions.push({
      rank: suggestions.length + 1,
      category: "sectorConcentration",
      title: `Reduce ${topSector.sector} exposure`,
      why: `${topSector.sector} represents ${topSector.weightPct.toFixed(1)}% of portfolio value.`,
      action:
        "Direct new capital away from this sector until exposure normalizes.",
      impactScore: Math.min(100, topSector.weightPct * 1.2),
      estimatedScoreImprovement: Math.round(
        Math.min(25, Math.max(topSector.weightPct - 35, 0) * 0.3),
      ),
      symbols: topSector.symbols.slice(0, 5),
    });
  }
  if (etfWeight < 30) {
    suggestions.push({
      rank: suggestions.length + 1,
      category: "etfDiversification",
      title: "Increase broad-market ETF exposure",
      why: `ETF exposure is ${etfWeight.toFixed(1)}%, leaving diversification dependent on single names.`,
      action:
        "Use future contributions or trim proceeds for broad ETF exposure.",
      impactScore: Math.min(100, 70 - etfWeight),
      estimatedScoreImprovement: Math.round(
        Math.min(15, (30 - etfWeight) * 0.3),
      ),
      symbols: [],
    });
  }

  return {
    diversificationScore: clamp(score),
    rating: rating(score),
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
