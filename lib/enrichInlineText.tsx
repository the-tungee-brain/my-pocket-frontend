import type { ReactNode } from "react";
import { MONEY_HIGHLIGHT_PATTERN } from "@/lib/conversationalAnalysis";

/** Highlight dollar amounts inside plain text nodes (conversational variant only). */
export function enrichPlainText(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MONEY_HIGHLIGHT_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    nodes.push(
      <span
        key={`money-${index}-${match[0]}`}
        className="font-medium tabular-nums text-foreground"
      >
        {match[0]}
      </span>,
    );
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  if (nodes.length === 0) return text;
  if (nodes.length === 1) return nodes[0];
  return nodes;
}

export function enrichReactChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") return enrichPlainText(children);
  if (Array.isArray(children)) {
    return children.map((child, index) =>
      typeof child === "string" ? (
        <span key={index}>{enrichPlainText(child)}</span>
      ) : (
        child
      ),
    );
  }
  return children;
}
