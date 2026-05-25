import type {
  StructuredAnalysis,
  StructuredAnalysisAction,
  StructuredAnalysisSection,
} from "@/app/types/analysis";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeAction(value: unknown): StructuredAnalysisAction | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const title = asString(record.title);
  const reason = asString(record.reason);
  if (!title || !reason) return null;

  const symbol = asString(record.symbol);
  return {
    title,
    reason,
    symbol: symbol ?? null,
  };
}

function normalizeSection(value: unknown): StructuredAnalysisSection | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const title = asString(record.title);
  if (!title) return null;

  const body = asString(record.body);
  const bullets = Array.isArray(record.bullets)
    ? record.bullets
        .map((item) => asString(item))
        .filter((item): item is string => !!item)
    : undefined;

  const id = asString(record.id) ?? undefined;

  if (!body && (!bullets || bullets.length === 0)) {
    return null;
  }

  return {
    id,
    title,
    body,
    bullets,
  };
}

export function normalizeStructuredAnalysis(
  value: unknown,
): StructuredAnalysis | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const summary = asString(record.summary);
  if (!summary) return null;

  const sections = Array.isArray(record.sections)
    ? record.sections
        .map(normalizeSection)
        .filter((section): section is StructuredAnalysisSection => !!section)
    : [];

  return {
    summary,
    recommendedAction: normalizeAction(record.recommendedAction),
    sections,
  };
}

function extractJsonCandidate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  return trimmed.slice(start, end + 1);
}

export function parseStructuredAnalysisJson(
  raw: string,
): StructuredAnalysis | null {
  const candidate = extractJsonCandidate(raw);
  if (!candidate) return null;

  try {
    return normalizeStructuredAnalysis(JSON.parse(candidate));
  } catch {
    return null;
  }
}

function markdownToStructured(raw: string): StructuredAnalysis | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const sections: StructuredAnalysisSection[] = [];
  const parts = trimmed.split(/^##\s+/m);

  let summary = parts[0]?.trim() ?? "";
  summary = summary.replace(/^#\s+.+\n?/m, "").trim();

  for (const part of parts.slice(1)) {
    const [titleLine, ...rest] = part.split("\n");
    const title = titleLine?.trim();
    if (!title) continue;

    const body = rest.join("\n").trim();
    const cleanedBullets = body
      .split("\n")
      .filter((line) => /^[-*]\s+/.test(line.trim()))
      .map((line) => line.trim().replace(/^[-*]\s+/, ""));

    const prose = body
      .split("\n")
      .filter((line) => !/^[-*]\s+/.test(line.trim()))
      .join("\n")
      .trim();

    sections.push({
      title,
      body: prose || null,
      bullets: cleanedBullets.length > 0 ? cleanedBullets : undefined,
    });
  }

  if (!summary && sections.length === 0) {
    return null;
  }

  return {
    summary: summary || "Analysis complete.",
    recommendedAction: null,
    sections,
  };
}

export function parseStructuredAnalysis(
  raw: string | null | undefined,
): StructuredAnalysis | null {
  if (!raw?.trim()) return null;

  return parseStructuredAnalysisJson(raw) ?? markdownToStructured(raw);
}
