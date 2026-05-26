import type { Position, SchwabAccounts } from "@/app/types/schwab";
import type { StructuredAnalysis } from "@/app/types/analysis";
import type { SymbolAnalysisPrecomputed } from "@/app/types/symbolAnalysis";

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
  model?: string;
};

export function buildStructuredAnalyzeRequest(input: {
  account: SchwabAccounts;
  positions: Position[];
  symbol: string | null;
  userDisplayMessage: string;
  model?: string;
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
    model: input.model,
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
Use 2-5 sections max. Lead with diversification for portfolio analysis. Keep bullets concise.
When the response includes precomputed option comparePaths in the API envelope, do NOT add an
"Outcome comparison" section — the UI renders compare paths separately. Put why roll/close/hold
wins in recommendedAction.reason instead.`;

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
