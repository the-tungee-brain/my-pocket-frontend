const MATERIAL_TEXT_RE =
  /earnings|guidance|revenue|profit|margin|forecast|outlook|aws|cloud strategy|retail strategy|capital allocation|sec |8-k|10-q|10-k|dividend|buyback|repurchase|split|offering|debt|capital|acquisition|merger|major partnership|contract|customer|product|platform|launch|approval|fda|regulat|lawsuit|settlement|investigation|management|ceo|cfo|board|strategy|restructur|layoff|plant|factory|competitive|market share|antitrust|data center|capex|custom chip|trainium|inferentia/;

const NOISY_RELEASE_RE =
  /reminder|webcast|conference|presentation|fireside|participate|announce participation|investor conference|class action reminder|deadline|shareholder alert|rosen law|levi & korsinsky|glancy|bragar|accesswire|prnewswire/;

const WEAK_MENTION_RE =
  /amazon veteran|former amazon|ex-amazon|amazon alum|amazon executive joins|available on amazon|sold on amazon|sells on amazon|amazon marketplace|amazon sales channel|compares? (itself )?(to|with|against) amazon|comparison to amazon|amazon-like|using amazon for credibility/;

const THIRD_PARTY_PR_RE =
  /prnewswire|accesswire|globenewswire|business wire|ein presswire|newsfile|otc markets|investorwire/;

const GENERIC_TOPIC_RE =
  /^(company[-_ ]specific development|company development|industry read[-_ ]through|development|news|update|story|coverage|market coverage)$/i;

const CONCRETE_TOPIC_LABELS = new Map([
  ["custom_ai_chips", "Custom AI chips"],
  ["custom ai chips", "Custom AI chips"],
  ["trainium", "Custom AI chips"],
  ["inferentia", "Custom AI chips"],
  ["aws_cloud_strategy", "AWS/cloud strategy"],
  ["aws", "AWS/cloud strategy"],
  ["cloud_spending", "Cloud spending"],
  ["retail_strategy", "Retail strategy"],
  ["advertising", "Advertising growth"],
  ["regulation", "Regulatory risk"],
  ["antitrust", "Regulatory risk"],
  ["data_centers", "AI infrastructure spending"],
  ["capex", "AI infrastructure spending"],
  ["margin", "Margin outlook"],
  ["earnings", "Financial outlook"],
  ["guidance", "Financial outlook"],
  ["revenue", "Financial outlook"],
  ["capital_allocation", "Capital allocation"],
  ["management", "Management change"],
  ["market_share", "Competitive position"],
]);

function compactText(value) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function sentenceKey(value) {
  return compactText(value)
    .toLowerCase()
    .replace(/[^a-z0-9%$ ]/g, "")
    .replace(/\s+/g, " ");
}

function dedupeLines(items, limit) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const text = compactText(item);
    if (!text) continue;
    const key = sentenceKey(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function itemText(item) {
  return compactText(
    `${item.headline ?? ""} ${item.summary ?? ""} ${item.original_summary ?? ""} ${(item.topics ?? []).join(" ")} ${item.source ?? ""}`,
  ).toLowerCase();
}

function isAmazonScope(symbol) {
  return symbol?.toUpperCase() === "AMZN";
}

function isWeakCompanyMention(item, symbol) {
  const text = itemText(item);
  if (item.directRelevance === "weak_mention" || item.directRelevance === "irrelevant") {
    return true;
  }
  if (!isAmazonScope(symbol) && !/\bamazon\b|amazon\.com|alexa|zoox|aws/.test(text)) {
    return false;
  }
  if (WEAK_MENTION_RE.test(text)) return true;
  if (
    /alexa\+?|grubhub|wonder/.test(text) &&
    !/amazon (launches|rolls out|expands|prices|monetizes|announces)|revenue|margin|subscription|platform strategy|devices strategy/.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /zoox/.test(text) &&
    !/amazon.*(revenue|margin|strategy|investment|capital|commercial rollout|autonomous vehicle strategy)/.test(
      text,
    )
  ) {
    return true;
  }
  if (
    /gs1|certification pilot|sales channel/.test(text) &&
    /\bamazon\b|amazon marketplace/.test(text)
  ) {
    return true;
  }
  if (
    THIRD_PARTY_PR_RE.test(text) &&
    /\bamazon\b|amazon marketplace|alexa|zoox/.test(text) &&
    !MATERIAL_TEXT_RE.test(text)
  ) {
    return true;
  }
  return false;
}

function officialReleaseLooksMaterial(item, symbol) {
  const text = itemText(item);
  const material = MATERIAL_TEXT_RE.test(text);
  const noise = NOISY_RELEASE_RE.test(text);
  return material && !noise && !isWeakCompanyMention(item, symbol);
}

function inferredDirectRelevance(item, symbol) {
  if (isWeakCompanyMention(item, symbol)) return "weak_mention";
  const text = itemText(item);
  if (MATERIAL_TEXT_RE.test(text)) {
    return "direct_company_news";
  }
  if (
    /supplier|customer|industry|sector|competitor|chips|semiconductor|ai infrastructure|cloud spending|smartphone demand|ev demand|ad market|oil price|bank capital|rates|regulatory read-through/.test(
      text,
    )
  ) {
    return "important_industry_read_through";
  }
  return "weak_mention";
}

function isBriefingRelevant(item, symbol) {
  if (isWeakCompanyMention(item, symbol)) return false;
  if (item.directRelevance) {
    return (
      item.directRelevance === "direct_company_news" ||
      item.directRelevance === "important_industry_read_through"
    );
  }
  if (item.feedKind === "official") return officialReleaseLooksMaterial(item, symbol);
  return inferredDirectRelevance(item, symbol) !== "weak_mention";
}

function thesisImpactScore(item) {
  if (item.thesisImpact === "high") return 4;
  if (item.thesisImpact === "medium") return 2.4;
  if (item.thesisImpact === "low") return 0.5;
  return 0;
}

function hasStrictMaterialImpact(item, symbol) {
  if (!isBriefingRelevant(item, symbol)) return false;
  return MATERIAL_TEXT_RE.test(itemText(item));
}

function headlineScore(item, symbol) {
  if (!isBriefingRelevant(item, symbol)) return -10;
  if (item.directRelevance) {
    return thesisImpactScore(item);
  }
  const text = itemText(item);
  let score = 0;
  if (item.feedKind === "official") score += 1.2;
  if (officialReleaseLooksMaterial(item, symbol)) score += 3;
  if (MATERIAL_TEXT_RE.test(text)) score += 3;
  if (/analyst|rating|price target|upgrade|downgrade|estimate/.test(text)) {
    score += 1.4;
  }
  if (/sector|industry|market|nasdaq|s&p|dow|macro|fed|yield/.test(text)) {
    score -= 0.8;
  }
  if (item.sentiment === "bullish" || item.sentiment === "bearish") score += 0.8;
  if ((item.confidence ?? 0) >= 0.7) score += 0.4;
  return score;
}

function rankHeadline(item, symbol) {
  const score = headlineScore(item, symbol);
  const strictMaterial = hasStrictMaterialImpact(item, symbol);
  const rank =
    strictMaterial && (item.thesisImpact === "high" || score >= 4)
      ? "Material"
      : score >= 1.8
        ? "Relevant"
        : "Background";
  return { ...item, rank, score };
}

function rankHeadlines(items, symbol) {
  const rankOrder = {
    Material: 0,
    Relevant: 1,
    Background: 2,
  };
  return items
    .filter((item) => isBriefingRelevant(item, symbol))
    .map((item) => rankHeadline(item, symbol))
    .sort((a, b) => {
      const rankDiff = rankOrder[a.rank] - rankOrder[b.rank];
      if (rankDiff !== 0) return rankDiff;
      return b.score - a.score;
    });
}

function stripDuplicateVerdictPrefix(text) {
  return compactText(text).replace(
    /^(strongly positive|long-term positive|mixed thesis signal|long-term negative|strongly negative)[:,.\-\s]+/i,
    "",
  );
}

function oneSentence(value, maxLength = 150) {
  const text = stripDuplicateVerdictPrefix(value);
  if (!text) return null;
  if (/company-specific (news|development)|industry read-through|template|fallback/i.test(text)) {
    return null;
  }
  const match = text.match(/^.+?(?:[.!?](?=\s|$)|$)/);
  let sentence = compactText(match?.[0] ?? text);
  if (sentence.length > maxLength) {
    sentence = `${sentence.slice(0, maxLength - 1).trim().replace(/\s+\S*$/, "")}.`;
  }
  return sentence;
}

function concreteTopic(item) {
  for (const topic of item.topics ?? []) {
    const normalized = compactText(topic).replace(/_/g, " ").toLowerCase();
    if (!normalized || GENERIC_TOPIC_RE.test(normalized)) continue;
    const mapped = CONCRETE_TOPIC_LABELS.get(topic) ?? CONCRETE_TOPIC_LABELS.get(normalized);
    if (mapped) return mapped;
    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const text = itemText(item);
  if (/custom (ai )?chip|trainium|inferentia/.test(text)) return "Custom AI chips";
  if (/aws|cloud/.test(text)) return "AWS/cloud strategy";
  if (/data center|capex|ai infrastructure/.test(text)) return "AI infrastructure spending";
  if (/advertising|ad market/.test(text)) return "Advertising growth";
  if (/retail|marketplace|prime/.test(text)) return "Retail strategy";
  if (/regulat|lawsuit|antitrust|investigation|settlement/.test(text)) return "Regulatory risk";
  if (/margin|cost structure|profit/.test(text)) return "Margin outlook";
  if (/earnings|guidance|revenue|forecast|outlook/.test(text)) return "Financial outlook";
  if (/acquisition|merger|divestiture/.test(text)) return "M&A strategy";
  if (/ceo|cfo|management|board/.test(text)) return "Management change";
  if (/competitive|market share|competitor/.test(text)) return "Competitive position";
  return null;
}

function thesisSynthesisLine(item) {
  if (isWeakCompanyMention(item)) return null;
  const topic = concreteTopic(item);
  if (!topic) return null;
  if (item.thesisImpact === "low") return null;

  const horizon =
    item.thesisHorizon === "near_term"
      ? "near-term"
      : item.thesisHorizon === "long_term"
        ? "long-term"
        : "medium-term";

  if (/custom ai chips/i.test(topic)) {
    return "Custom AI chips could improve AWS cost structure if adoption scales.";
  }
  if (item.sentiment === "bearish") {
    return `${topic} could pressure ${horizon} expectations if the issue expands.`;
  }
  if (item.thesisImpact === "high") {
    return `${topic} could materially affect ${horizon} expectations.`;
  }
  return `${topic} may influence ${horizon} expectations.`;
}

function verdictText(data, nearImpact, longImpact) {
  if (!data?.aiEnrichment) {
    return "Recent headlines are loaded, but thesis impact has not been analyzed yet.";
  }
  const candidate = oneSentence(data.investorTakeaway || data.summary, 170);
  if (candidate) return candidate;

  const nearPhrase =
    nearImpact != null && nearImpact >= 4
      ? "near-term impact looks meaningful"
      : nearImpact != null && nearImpact <= 2
        ? "there is no major near-term catalyst yet"
        : "near-term catalyst strength is moderate";
  if (
    data.overall_sentiment === "bullish" ||
    data.overall_sentiment === "strongly_bullish"
  ) {
    return `Recent thesis-relevant coverage is constructive, but ${nearPhrase}.`;
  }
  if (
    data.overall_sentiment === "bearish" ||
    data.overall_sentiment === "strongly_bearish"
  ) {
    return `Recent thesis-relevant coverage raises risk, and ${nearPhrase}.`;
  }
  const longPhrase =
    longImpact != null && longImpact >= 4
      ? "long-term thesis impact is meaningful"
      : "long-term thesis impact is limited";
  return `Recent thesis-relevant coverage is mixed; ${nearPhrase} and ${longPhrase}.`;
}

function whatChangedItems(data, ranked) {
  const fromMaterial = ranked
    .filter((item) => item.rank !== "Background")
    .map(thesisSynthesisLine);
  return dedupeLines(
    [data?.investorTakeaway, ...(data?.insights ?? []), ...fromMaterial].map((item) =>
      oneSentence(item),
    ),
    5,
  );
}

function thesisBuckets(data, ranked) {
  const bullish = dedupeLines(
    [
      ...(data?.insights ?? []).map((item) => oneSentence(item)),
      ...ranked
        .filter((item) => item.sentiment === "bullish")
        .map(thesisSynthesisLine),
    ],
    3,
  );
  const bearish = dedupeLines(
    ranked
      .filter((item) => item.sentiment === "bearish")
      .map(thesisSynthesisLine),
    3,
  );
  const risks = dedupeLines((data?.risks ?? []).map((item) => oneSentence(item)), 3);
  const opportunities = dedupeLines(
    ranked
      .filter((item) =>
        /opportun|growth|launch|approval|contract|partnership|demand|upgrade|target|aws|cloud|chip|trainium|margin/i.test(
          `${item.headline ?? ""} ${item.summary ?? ""} ${(item.topics ?? []).join(" ")}`,
        ),
      )
      .map(thesisSynthesisLine),
    3,
  );
  return { bullish, bearish, risks, opportunities };
}

module.exports = {
  compactText,
  concreteTopic,
  dedupeLines,
  headlineScore,
  inferredDirectRelevance,
  isBriefingRelevant,
  isWeakCompanyMention,
  officialReleaseLooksMaterial,
  rankHeadline,
  rankHeadlines,
  thesisBuckets,
  thesisSynthesisLine,
  verdictText,
  whatChangedItems,
};
