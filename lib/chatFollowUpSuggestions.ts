import { stripLeadResponseLabels, stripPlainEnglishLabels, stripStreamingStatusPrefix } from "@/lib/conversationalAnalysis";

export type ChatFollowUpSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

const FOLLOW_UP_BLOCK_RE =
  /<<TOMCREST_FOLLOW_UPS>>\s*([\s\S]*?)\s*<<END_TOMCREST_FOLLOW_UPS>>/;
const FOLLOW_UP_BLOCK_START = "<<TOMCREST_FOLLOW_UPS>>";

/** Hide follow-up metadata from visible assistant text (including while streaming). */
export function stripFollowUpBlock(
  content: string,
  isStreaming = false,
): string {
  const startIndex = content.indexOf(FOLLOW_UP_BLOCK_START);
  if (startIndex !== -1) {
    return content.slice(0, startIndex).trimEnd();
  }

  if (!isStreaming) return content;

  // While tokens are still arriving, hide a trailing partial marker prefix.
  for (let length = FOLLOW_UP_BLOCK_START.length - 1; length >= 1; length--) {
    const prefix = FOLLOW_UP_BLOCK_START.slice(0, length);
    if (content.endsWith(prefix)) {
      return content.slice(0, -length).trimEnd();
    }
  }

  return content;
}

/** Visible assistant text for markdown/copy (status line + follow-up block removed). */
export function getVisibleAssistantContent(
  content: string,
  isStreaming = false,
): string {
  const withoutStatus = isStreaming
    ? content
    : stripStreamingStatusPrefix(content);
  return stripFollowUpBlock(
    stripPlainEnglishLabels(stripLeadResponseLabels(withoutStatus)),
    isStreaming,
  );
}

export function parseChatFollowUps(content: string): ChatFollowUpSuggestion[] {
  const match = content.match(FOLLOW_UP_BLOCK_RE);
  if (!match) return [];

  try {
    const parsed: unknown = JSON.parse(match[1].trim());
    if (!Array.isArray(parsed)) return [];

    const suggestions: ChatFollowUpSuggestion[] = [];
    for (const [index, item] of parsed.entries()) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const label = typeof record.label === "string" ? record.label.trim() : "";
      const prompt = typeof record.prompt === "string" ? record.prompt.trim() : "";
      if (!label || !prompt) continue;

      suggestions.push({
        id: `follow-up-${index + 1}`,
        label: label.slice(0, 80),
        prompt: prompt.slice(0, 500),
      });
      if (suggestions.length >= 3) break;
    }

    return suggestions;
  } catch {
    return [];
  }
}

export function shouldShowFollowUpSuggestions(
  messages: {
    role: string;
    content: string;
  }[],
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

  return parseChatFollowUps(message.content).length > 0;
}
