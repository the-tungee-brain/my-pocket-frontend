export type ChatFollowUpSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

const OFFER_CUE_RE =
  /\b(if you want|if you'd like|if you would like|happy to|i can suggest|let me know|want me to)\b/i;

const REDEPLOY_RE =
  /\b(redeploy|proceeds|hold cash|diversified etf|\betf\b|another stock|rotate into)\b/i;

const ORDER_MECHANICS_RE =
  /\b(limit vs\.? market|order mechanics|limit order|market order|sell order)\b/i;

export function getChatFollowUpSuggestions(
  content: string,
): ChatFollowUpSuggestion[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const hasOfferCue = OFFER_CUE_RE.test(trimmed);
  const mentionsRedeploy = REDEPLOY_RE.test(trimmed);
  const mentionsOrderMechanics = ORDER_MECHANICS_RE.test(trimmed);

  if (!hasOfferCue && !mentionsRedeploy && !mentionsOrderMechanics) {
    return [];
  }

  const suggestions: ChatFollowUpSuggestion[] = [];

  if (mentionsRedeploy || (hasOfferCue && /\bor\b.*\b(cash|etf|stock)\b/i.test(trimmed))) {
    suggestions.push({
      id: "redeploy-proceeds",
      label: "Where to redeploy proceeds",
      prompt: "Where should I redeploy the proceeds from that trim?",
    });
  }

  if (
    mentionsOrderMechanics ||
    (hasOfferCue && /\blimit\b/i.test(trimmed) && /\bmarket\b/i.test(trimmed))
  ) {
    suggestions.push({
      id: "order-mechanics",
      label: "Limit vs market order",
      prompt: "Should I use a limit order or market order for that sell?",
    });
  }

  if (suggestions.length === 0 && hasOfferCue) {
    suggestions.push({
      id: "accept-offer",
      label: "Yes, let's do that",
      prompt: "Let's do that",
    });
  }

  return suggestions;
}

export function shouldShowFollowUpSuggestions(
  messages: { role: string; content: string }[],
  messageIndex: number,
  loading: boolean,
): boolean {
  if (loading) return false;

  const message = messages[messageIndex];
  if (!message || message.role !== "assistant") return false;

  const hasLaterUserMessage = messages
    .slice(messageIndex + 1)
    .some((entry) => entry.role === "user");
  if (hasLaterUserMessage) return false;

  const lastAssistantIndex = messages.findLastIndex(
    (entry) => entry.role === "assistant",
  );
  if (lastAssistantIndex !== messageIndex) return false;

  return getChatFollowUpSuggestions(message.content).length > 0;
}
