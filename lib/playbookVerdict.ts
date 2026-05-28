export type PlaybookVerdictTone = "positive" | "cautious" | "negative" | "neutral";

export type PlaybookFactorCategory =
  | "business"
  | "financials"
  | "news"
  | "strategy"
  | "other";

export type PlaybookFactor = {
  category: PlaybookFactorCategory;
  label: string;
  text: string;
};

export type PlaybookVerdictContent = {
  verdict: string;
  factors: PlaybookFactor[];
  drivers: string[];
  changeMind?: string;
  putZone?: string;
  remainder: string;
  tone: PlaybookVerdictTone;
};

const SECTION_PATTERNS = {
  verdict: /\*\*Verdict:\*\*\s*([^\n]+(?:\n(?!\s*[-*•]|\*\*)[^\n]+)*)/i,
  drivers:
    /(?:^|\n)\s*(?:#{1,3}\s*)?\*\*(?:What drives this|Key factors):?\*\*\s*\n([\s\S]+?)(?=\n\s*\*\*|$)/i,
  changeMind: /\*\*What would change my mind:\*\*\s*([\s\S]+?)(?=\n\s*\*\*|$)/i,
  putZone: /\*\*Put zone:\*\*\s*([\s\S]+?)(?=\n\s*\*\*|$)/i,
};

const FACTOR_LINE_RE =
  /^[-*•]?\s*(?:\*\*(Business|Financials|News|Strategy fit):\*\*|(?:Business|Financials|News|Strategy fit):)\s*(.+)$/i;

const FACTOR_LABELS: Record<PlaybookFactorCategory, string> = {
  business: "Business",
  financials: "Financials",
  news: "News",
  strategy: "Strategy fit",
  other: "Factor",
};

function cleanLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeFactorText(text: string): string {
  return cleanLine(text).replace(/^[,;:\s]+/, "");
}

function parseBulletLines(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
}

function categoryFromLabel(label: string): PlaybookFactorCategory {
  const lower = label.toLowerCase();
  if (lower.includes("business")) return "business";
  if (lower.includes("financial")) return "financials";
  if (lower.includes("news")) return "news";
  if (lower.includes("strategy")) return "strategy";
  return "other";
}

function parseFactorLine(line: string): PlaybookFactor | null {
  const labeled = line.match(FACTOR_LINE_RE);
  if (labeled) {
    const category = categoryFromLabel(labeled[1]);
    const text = normalizeFactorText(labeled[2]);
    if (!text) return null;
    return {
      category,
      label: FACTOR_LABELS[category],
      text,
    };
  }

  const trimmed = normalizeFactorText(line);
  if (!trimmed) return null;

  return {
    category: "other",
    label: FACTOR_LABELS.other,
    text: trimmed,
  };
}

function extractFactorsFromContent(content: string): PlaybookFactor[] {
  const factors: PlaybookFactor[] = [];
  const seen = new Set<string>();

  for (const line of content.split("\n")) {
    const factor = parseFactorLine(line.trim());
    if (!factor || factor.category === "other") continue;
    const key = `${factor.category}:${factor.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    factors.push(factor);
  }

  return factors;
}

export function verdictToneFromText(verdict: string): PlaybookVerdictTone {
  const lower = verdict.toLowerCase();
  if (
    lower.includes("avoid") ||
    lower.includes("don't hold") ||
    lower.includes("do not hold") ||
    lower.includes("not comfortable")
  ) {
    return "negative";
  }
  if (lower.includes("cautious") || lower.includes("mixed") || lower.includes("wait")) {
    return "cautious";
  }
  if (
    lower.includes("comfortable") ||
    lower.includes("hold") ||
    lower.includes("yes")
  ) {
    return "positive";
  }
  return "neutral";
}

export function parsePlaybookVerdict(content: string): PlaybookVerdictContent | null {
  const trimmed = content.trim();
  if (!trimmed || !/\*\*Verdict:\*\*/i.test(trimmed)) {
    return null;
  }

  const verdictMatch = trimmed.match(SECTION_PATTERNS.verdict);
  if (!verdictMatch) return null;

  const verdict = cleanLine(verdictMatch[1]);
  const driversMatch = trimmed.match(SECTION_PATTERNS.drivers);
  const driverLines = driversMatch ? parseBulletLines(driversMatch[1]) : [];
  let factors = driverLines
    .map(parseFactorLine)
    .filter((factor): factor is PlaybookFactor => factor !== null && factor.category !== "other");

  if (factors.length === 0) {
    factors = extractFactorsFromContent(trimmed);
  }

  const changeMatch = trimmed.match(SECTION_PATTERNS.changeMind);
  const putMatch = trimmed.match(SECTION_PATTERNS.putZone);

  return {
    verdict,
    factors,
    drivers: factors.map((factor) => `${factor.label}: ${factor.text}`),
    changeMind: changeMatch ? cleanLine(changeMatch[1]) : undefined,
    putZone: putMatch ? cleanLine(putMatch[1]) : undefined,
    remainder: "",
    tone: verdictToneFromText(verdict),
  };
}
