import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import { normalizeEtfHoldingsContext } from "@/lib/etfHoldings";

function hasOwn<T extends object, K extends PropertyKey>(
  value: T,
  key: K,
): value is T & Record<K, unknown> {
  return Object.hasOwn(value, key);
}

/** API overview bundles use camelCase; normalize nested ETF holdings to app shape. */
export function normalizeResearchOverviewBundle(
  raw: ResearchOverviewBundle,
): ResearchOverviewBundle {
  if (!raw.etfHoldings) return raw;

  const holdingsLimit = Math.max(1, raw.etfHoldings.holdings?.length ?? 8);
  const etfHoldings = normalizeEtfHoldingsContext(raw.etfHoldings, holdingsLimit);
  if (!etfHoldings) return raw;

  return { ...raw, etfHoldings };
}

export function mergeResearchOverviewBundle(
  base: ResearchOverviewBundle,
  patch: Partial<ResearchOverviewBundle>,
): ResearchOverviewBundle {
  const merged: ResearchOverviewBundle = { ...base };

  if (hasOwn(patch, "symbol") && typeof patch.symbol === "string") {
    merged.symbol = patch.symbol;
  }
  if (hasOwn(patch, "assetType")) {
    merged.assetType = patch.assetType ?? null;
  }
  if (hasOwn(patch, "asOf") && typeof patch.asOf === "string" && patch.asOf) {
    merged.asOf = patch.asOf;
  }
  if (hasOwn(patch, "snapshot") && patch.snapshot) {
    merged.snapshot = patch.snapshot;
  }
  if (hasOwn(patch, "performance") && patch.performance) {
    merged.performance = patch.performance;
  }
  if (hasOwn(patch, "intelligence") && patch.intelligence) {
    merged.intelligence = patch.intelligence;
  }
  if (hasOwn(patch, "streetAnalysis")) {
    merged.streetAnalysis = patch.streetAnalysis ?? null;
  }
  if (hasOwn(patch, "etfFunds")) {
    merged.etfFunds = patch.etfFunds ?? null;
  }
  if (hasOwn(patch, "etfHoldings")) {
    merged.etfHoldings = patch.etfHoldings ?? null;
  }
  if (hasOwn(patch, "summary")) {
    merged.summary = patch.summary ?? null;
  }

  return normalizeResearchOverviewBundle(merged);
}
