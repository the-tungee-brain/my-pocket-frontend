import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import { seedSymbolIntelligenceCache } from "@/app/hooks/useSymbolIntelligence";
import { rememberAssetType } from "@/lib/researchAssetType";
import { seedEtfHoldingsCache } from "@/lib/etfHoldings";
import { seedPerformanceCache } from "@/app/hooks/usePerformance";
import { seedStreetAnalysisCache } from "@/app/hooks/useStreetAnalysis";
import { seedEtfFundsCache } from "@/app/hooks/useEtfFunds";
import { seedResearchSnapshotCache } from "@/lib/researchSnapshot";

export function seedResearchOverviewCaches(bundle: ResearchOverviewBundle) {
  const key = bundle.symbol.toUpperCase();
  if (!key) return;

  if (!bundle.intelligence.partial) {
    seedSymbolIntelligenceCache(key, bundle.intelligence);
  }
  if (bundle.assetType) {
    rememberAssetType(key, bundle.assetType);
  }
  if (bundle.performance) {
    seedPerformanceCache(key, bundle.performance);
  }
  if (bundle.streetAnalysis !== undefined) {
    seedStreetAnalysisCache(key, bundle.streetAnalysis);
  }
  if (bundle.etfFunds !== undefined) {
    seedEtfFundsCache(key, bundle.etfFunds);
  }
  if (bundle.etfHoldings) {
    seedEtfHoldingsCache(key, bundle.etfHoldings);
  }
  if (bundle.snapshot) {
    seedResearchSnapshotCache(key, bundle.snapshot);
  }
}
