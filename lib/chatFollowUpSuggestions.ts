export type ChatFollowUpSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

type FollowUpRule = {
  id: string;
  label: string;
  prompt: string;
  priority: number;
  when: (content: string) => boolean;
};

const OFFER_CUE_RE =
  /\b(if you want|if you'd like|if you would like|happy to|i can (?:walk|help|suggest|map|compare|break)|let me know|want me to|would you like|i'd (?:suggest|recommend)|we can (?:look|discuss))\b/i;

const TRIM_CLOSE_RE =
  /\b(trim|sell (?:about|roughly|around)?|reduce|cut (?:back|down)|partial exit|close (?:about|roughly|around)?|take (?:some )?profits|lock in gains)\b/i;

const COVERED_CALL_RE =
  /\b(sell (?:a |1 )?covered call|covered call at|covered call\b)\b/i;

const CSP_RE =
  /\b(sell (?:a |1 )?cash-secured put|cash-secured put at|cash-secured put\b)\b/i;

const ROLL_RE =
  /\b(roll (?:the |your )?option|rolling (?:the |your )?|roll (?:out|up|down))\b/i;

const ASSIGNMENT_RE =
  /\b(assignment|assigned|call(?:ed)? away|put (?:you|me) (?:at|into)|expir(?:e|ing|ation)|(?:itm|in the money|at the money))\b/i;

const CONCENTRATION_RE =
  /\b(concentrated|concentration|(?:\d{1,2}|30|40|50)% of (?:the )?portfolio|overweight|too much in|trim (?:first|down))\b/i;

const HOLD_RE =
  /\b(i'd hold|would hold|holding (?:for now|is fine)|no action needed|stay the course|sit tight)\b/i;

const EARNINGS_RE =
  /\b(earnings|reports (?:on|this)|post-earnings|before earnings|earnings week)\b/i;

const TAX_RE =
  /\b(tax|wash sale|cost basis|harvest|capital gain|short-term|long-term)\b/i;

const REDEPLOY_RE =
  /\b(redeploy|proceeds|hold cash|diversified etf|\betf\b|rotate into|put the cash|where to put)\b/i;

const ORDER_MECHANICS_RE =
  /\b(limit vs\.? market|order mechanics|limit order|market order|sell order|buy order)\b/i;

const INVALIDATION_RE =
  /\b(invalidation|change my mind|thesis (?:breaks|broken|weakens)|stop loss|exit if)\b/i;

const EXECUTION_RE =
  /\b(walk (?:you )?through|step by step|execution plan|exact (?:trade|order))\b/i;

const FOLLOW_UP_RULES: FollowUpRule[] = [
  {
    id: "redeploy-proceeds",
    label: "Where to redeploy proceeds",
    prompt:
      "Where should I redeploy the proceeds from that trim — hold cash, add a diversified ETF, or rotate into another holding? Pick one specific path for me.",
    priority: 1,
    when: (content) =>
      REDEPLOY_RE.test(content) ||
      (OFFER_CUE_RE.test(content) &&
        /\b(redeploy|proceeds|cash|etf|rotate)\b/i.test(content)) ||
      (TRIM_CLOSE_RE.test(content) && OFFER_CUE_RE.test(content)),
  },
  {
    id: "order-mechanics",
    label: "Limit vs market order",
    prompt:
      "For that trade, should I use a limit order or market order? Give me a specific limit price or timing if limit makes sense.",
    priority: 2,
    when: (content) =>
      ORDER_MECHANICS_RE.test(content) ||
      (OFFER_CUE_RE.test(content) &&
        /\blimit\b/i.test(content) &&
        /\bmarket\b/i.test(content)) ||
      (TRIM_CLOSE_RE.test(content) && OFFER_CUE_RE.test(content)),
  },
  {
    id: "execute-covered-call",
    label: "Walk through the covered call",
    prompt:
      "Walk me through executing that covered call step by step — contracts, strike, expiration, and what to watch before expiration.",
    priority: 2,
    when: (content) =>
      COVERED_CALL_RE.test(content) &&
      (OFFER_CUE_RE.test(content) || EXECUTION_RE.test(content)),
  },
  {
    id: "execute-csp",
    label: "Walk through the cash-secured put",
    prompt:
      "Walk me through executing that cash-secured put — cash needed, strike, expiration, and assignment plan if I get put the shares.",
    priority: 2,
    when: (content) =>
      CSP_RE.test(content) &&
      (OFFER_CUE_RE.test(content) || EXECUTION_RE.test(content)),
  },
  {
    id: "roll-vs-close",
    label: "Roll vs close the option",
    prompt:
      "Compare rolling that option versus closing it now — include estimated credit/debit and which you'd pick.",
    priority: 1,
    when: (content) =>
      ROLL_RE.test(content) ||
      (ASSIGNMENT_RE.test(content) &&
        (OFFER_CUE_RE.test(content) || ROLL_RE.test(content))),
  },
  {
    id: "assignment-plan",
    label: "Assignment risk plan",
    prompt:
      "If assignment happens on that option, what should I do next — accept shares, roll, or close — and why?",
    priority: 2,
    when: (content) =>
      ASSIGNMENT_RE.test(content) &&
      (COVERED_CALL_RE.test(content) || CSP_RE.test(content) || OFFER_CUE_RE.test(content)),
  },
  {
    id: "trim-priority",
    label: "Which position to trim first",
    prompt:
      "If I need to reduce risk, which position should I trim first and by roughly how much?",
    priority: 2,
    when: (content) =>
      CONCENTRATION_RE.test(content) &&
      (OFFER_CUE_RE.test(content) || TRIM_CLOSE_RE.test(content)),
  },
  {
    id: "target-weights",
    label: "Target portfolio weights",
    prompt:
      "Suggest target weights for my top holdings so concentration is under control, using my current portfolio size.",
    priority: 3,
    when: (content) =>
      CONCENTRATION_RE.test(content) && OFFER_CUE_RE.test(content),
  },
  {
    id: "invalidation-triggers",
    label: "What would change your mind",
    prompt:
      "What specific price move, news, or date would make you change this recommendation?",
    priority: 3,
    when: (content) =>
      HOLD_RE.test(content) ||
      INVALIDATION_RE.test(content) ||
      (OFFER_CUE_RE.test(content) && /\b(change|invalidate|wrong)\b/i.test(content)),
  },
  {
    id: "earnings-plan",
    label: "Pre-earnings plan",
    prompt:
      "How should I position this holding before earnings — hold, trim, hedge, or adjust options?",
    priority: 2,
    when: (content) =>
      EARNINGS_RE.test(content) &&
      (OFFER_CUE_RE.test(content) || ASSIGNMENT_RE.test(content)),
  },
  {
    id: "tax-impact",
    label: "Map the tax impact",
    prompt:
      "Map out the tax impact if I follow that plan now, including wash-sale rules if relevant.",
    priority: 2,
    when: (content) =>
      TAX_RE.test(content) &&
      (TRIM_CLOSE_RE.test(content) || OFFER_CUE_RE.test(content)),
  },
  {
    id: "trim-without-offer",
    label: "Where proceeds should go",
    prompt:
      "I may trim as you suggested — where should the proceeds go, and should I use a limit or market order?",
    priority: 4,
    when: (content) =>
      TRIM_CLOSE_RE.test(content) &&
      !REDEPLOY_RE.test(content) &&
      !ORDER_MECHANICS_RE.test(content),
  },
  {
    id: "options-without-offer",
    label: "Execute that options trade",
    prompt:
      "Give me a concrete step-by-step plan to execute the options trade you recommended, including size and timing.",
    priority: 4,
    when: (content) =>
      (COVERED_CALL_RE.test(content) || CSP_RE.test(content)) &&
      !EXECUTION_RE.test(content) &&
      !OFFER_CUE_RE.test(content),
  },
  {
    id: "accept-offer",
    label: "Yes, let's do that",
    prompt: "Let's do that — give me the specific next step.",
    priority: 10,
    when: (content) => OFFER_CUE_RE.test(content),
  },
];

const MAX_SUGGESTIONS = 3;

export function getChatFollowUpSuggestions(
  content: string,
): ChatFollowUpSuggestion[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const matched = FOLLOW_UP_RULES.filter((rule) => rule.when(trimmed)).sort(
    (a, b) => a.priority - b.priority,
  );

  const seen = new Set<string>();
  const suggestions: ChatFollowUpSuggestion[] = [];

  for (const rule of matched) {
    if (seen.has(rule.id)) continue;
    seen.add(rule.id);
    suggestions.push({
      id: rule.id,
      label: rule.label,
      prompt: rule.prompt,
    });
    if (suggestions.length >= MAX_SUGGESTIONS) break;
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
