export type PlaybookVerdictTone = "positive" | "cautious" | "negative" | "neutral";

export type PlaybookVerdictContent = {
  verdict: string;
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

function cleanLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseBulletLines(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.replace(/^[-*•]\s+/, "").trim())
    .filter(Boolean);
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
  const drivers = driversMatch ? parseBulletLines(driversMatch[1]) : [];
  const changeMatch = trimmed.match(SECTION_PATTERNS.changeMind);
  const putMatch = trimmed.match(SECTION_PATTERNS.putZone);

  return {
    verdict,
    drivers,
    changeMind: changeMatch ? cleanLine(changeMatch[1]) : undefined,
    putZone: putMatch ? cleanLine(putMatch[1]) : undefined,
    remainder: "",
    tone: verdictToneFromText(verdict),
  };
}
