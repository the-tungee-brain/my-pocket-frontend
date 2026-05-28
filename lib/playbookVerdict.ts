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
  verdict: /\*\*Verdict:\*\*\s*([\s\S]+?)(?=\n\s*\*\*|$)/i,
  drivers:
    /\*\*(?:What drives this|Key factors):\*\*\s*([\s\S]+?)(?=\n\s*\*\*|$)/i,
  changeMind: /\*\*What would change my mind:\*\*\s*([\s\S]+?)(?=\n\s*\*\*|$)/i,
  putZone: /\*\*Put zone:\*\*\s*([\s\S]+?)(?=\n\s*\*\*|$)/i,
};

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

function parseFactorLine(line: string): PlaybookFactor {
  const labeled = line.match(/^\*\*(Business|Financials|News|Strategy fit):\*\*\s*(.+)$/i);
  if (labeled) {
    const category = categoryFromLabel(labeled[1]);
    return {
      category,
      label: FACTOR_LABELS[category],
      text: cleanLine(labeled[2]),
    };
  }

  const inline = line.match(/^(Business|Financials|News|Strategy fit):\s*(.+)$/i);
  if (inline) {
    const category = categoryFromLabel(inline[1]);
    return {
      category,
      label: FACTOR_LABELS[category],
      text: cleanLine(inline[2]),
    };
  }

  return {
    category: "other",
    label: FACTOR_LABELS.other,
    text: cleanLine(line),
  };
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
  const factors = driverLines.map(parseFactorLine);
  const changeMatch = trimmed.match(SECTION_PATTERNS.changeMind);
  const putMatch = trimmed.match(SECTION_PATTERNS.putZone);

  return {
    verdict,
    factors,
    drivers: factors.map((factor) =>
      factor.category === "other" ? factor.text : `${factor.label}: ${factor.text}`,
    ),
    changeMind: changeMatch ? cleanLine(changeMatch[1]) : undefined,
    putZone: putMatch ? cleanLine(putMatch[1]) : undefined,
    remainder: "",
    tone: verdictToneFromText(verdict),
  };
}
