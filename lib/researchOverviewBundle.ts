import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import { normalizeEtfHoldingsContext } from "@/lib/etfHoldings";

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
