import type { Position, SchwabAccounts } from "@/app/types/schwab";

export type StructuredAnalyzeRequestBody = {
  account: SchwabAccounts;
  positions: Position[];
  symbol: string | null;
  action: "free-form";
  prompt: null;
  user_display_message: string;
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
    model: input.model,
  };
}

export function structuredAnalyzeDisplayMessage(input: {
  symbol?: string | null;
  portfolio?: boolean;
}): string {
  if (input.portfolio || !input.symbol) {
    return "Analyze my portfolio.";
  }
  return `Analyze my ${input.symbol.toUpperCase()} position.`;
}
