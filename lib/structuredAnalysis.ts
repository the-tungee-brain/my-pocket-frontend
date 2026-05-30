import type { Position, SchwabAccounts } from "@/app/types/schwab";
import type { StructuredAnalysis } from "@/app/types/analysis";
import type { SymbolAnalysisPrecomputed } from "@/app/types/symbolAnalysis";
import type { PortfolioAnalysisPrecomputed } from "@/app/types/portfolioAnalysis";

export const STRUCTURED_ANALYSIS_SCHEMA = "portfolio_analysis_v1";

export type StructuredAnalyzeRequestBody = {
  account: SchwabAccounts;
  positions: Position[];
  symbol: string | null;
  action: "free-form";
  prompt: null;
  user_display_message: string;
  response_format: typeof STRUCTURED_ANALYSIS_SCHEMA;
  analysis_instructions: string;
};

export function buildStructuredAnalyzeRequest(input: {
  account: SchwabAccounts;
  positions: Position[];
  symbol: string | null;
  userDisplayMessage: string;
}): StructuredAnalyzeRequestBody {
  return {
    account: input.account,
    positions: input.positions,
    symbol: input.symbol,
    action: "free-form",
    prompt: null,
    user_display_message: input.userDisplayMessage,
    response_format: STRUCTURED_ANALYSIS_SCHEMA,
    analysis_instructions: STRUCTURED_ANALYSIS_INSTRUCTIONS,
  };
}

export function structuredAnalyzeDisplayMessage(input: {
  symbol?: string | null;
  portfolio?: boolean;
}): string {
  if (input.portfolio || !input.symbol) {
    return "Analyze my portfolio for diversification and where to deploy cash.";
  }
  return `Analyze my ${input.symbol.toUpperCase()} position.`;
}

export const STRUCTURED_ANALYSIS_INSTRUCTIONS = `Return ONLY valid JSON matching this schema (no markdown fences, no prose outside JSON):
{
  "summary": "2-3 sentence overall read",
  "recommendedAction": {
    "title": "Short action label",
    "reason": "Why this is the best next step",
    "symbol": "OPTIONAL_TICKER or null"
  },
  "sections": [
    {
      "id": "optional_slug",
      "title": "Section title",
      "body": "Optional short paragraph",
      "bullets": ["Optional bullet points"]
    }
  ]
}
Use 1-3 sections max for portfolio analysis. Do NOT include Portfolio cash map, Gaps vs targets,
Where to put money smarter, Diversification diagnosis, Portfolio snapshot, Holdings review, Trim plan,
or Deploy plan — the UI money map card already shows cash, holdings, and trim/deploy amounts.
Use sections for interpretation only: "Action plan (ranked)" and optionally "Risk if you do nothing".
When the response includes precomputed option comparePaths in the API envelope, do NOT add an
"Outcome comparison" section — the UI renders compare paths separately. Put why roll/close/hold
wins in recommendedAction.reason instead.`;

const PORTFOLIO_PRECOMPUTED_SECTION_TITLES = [
  /^portfolio cash map$/i,
  /^gaps vs targets$/i,
  /^where to put money smarter$/i,
  /^diversification diagnosis$/i,
  /^portfolio snapshot$/i,
  /^holdings review$/i,
  /^holding-by-holding/i,
  /^cash map$/i,
  /^trim plan$/i,
  /^deploy plan$/i,
  /^concentration check$/i,
];

export function hasPortfolioAllocation(
  portfolioPrecomputed: PortfolioAnalysisPrecomputed | null | undefined,
): boolean {
  return (portfolioPrecomputed?.holdings?.length ?? 0) > 0;
}

export function stripPortfolioAllocationSections(
  analysis: StructuredAnalysis,
): StructuredAnalysis {
  return {
    ...analysis,
    sections: analysis.sections.filter((section) => {
      const title = section.title.trim();
      return !PORTFOLIO_PRECOMPUTED_SECTION_TITLES.some((pattern) =>
        pattern.test(title),
      );
    }),
  };
}

export function hasComparePaths(
  precomputed: SymbolAnalysisPrecomputed | null | undefined,
): boolean {
  return (
    precomputed?.heldOptionOutcomes?.some((o) => o.comparePaths.length > 0) ??
    false
  );
}

export function stripOutcomeComparisonSection(
  analysis: StructuredAnalysis,
): StructuredAnalysis {
  return {
    ...analysis,
    sections: analysis.sections.filter(
      (section) => !/^outcome comparison$/i.test(section.title.trim()),
    ),
  };
}
