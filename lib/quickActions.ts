import {
  CalendarDays,
  CircleHelp,
  Landmark,
  PieChart,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { MainView } from "@/components/NavList";

export type QuickActionMode = MainView | "position" | "options";

export type QuickAction = {
  id: string;
  label: string;
  /** Value sent to the backend `action` field (natural language supported). */
  apiAction?: string;
  icon: LucideIcon;
  /** When set, sends a free-form prompt instead of a backend action id. */
  prompt?: (target: string) => string;
  /** Natural-language text shown as the user message in chat. */
  message?: (target: string) => string;
};

export const PORTFOLIO_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "portfolio-review",
    label: "Analyze",
    apiAction: "free-form",
    message: (target) => `Analyze ${target}.`,
    icon: Sparkles,
  },
  {
    id: "daily-summary",
    label: "Daily summary",
    apiAction: "daily summary",
    message: (target) =>
      `Give me a concise daily summary of ${target} — what moved, what's at risk, and the one thing I should do today.`,
    icon: CalendarDays,
  },
  {
    id: "risk-check",
    label: "Risk check",
    apiAction: "risk check",
    message: (target) =>
      `What are the biggest risks in ${target} right now — concentration, options, macro, and earnings?`,
    icon: ShieldAlert,
  },
  {
    id: "concentration-check",
    label: "Concentration",
    apiAction: "concentration check",
    message: (target) =>
      `Check concentration in ${target}. Flag anything above 15–20% and suggest specific trims if needed.`,
    icon: PieChart,
  },
  {
    id: "tax-angle",
    label: "Tax angle",
    apiAction: "tax angle",
    message: (target) =>
      `What tax considerations apply to ${target} — gains, losses, wash sales, and whether to harvest anything now?`,
    icon: Scale,
  },
  {
    id: "what-changed",
    label: "What changed",
    apiAction: "what changed",
    message: (target) =>
      `What changed in ${target} since my last snapshot — positions, weights, and any new risks?`,
    icon: CircleHelp,
  },
  {
    id: "assignment-risk",
    label: "Assignment risk",
    apiAction: "assignment risk",
    message: (target) =>
      `Review assignment and call-away risk in ${target} over the next two weeks. For each short option, say roll, close, or hold.`,
    icon: Timer,
  },
];

export const POSITION_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "position-review",
    label: "Analyze",
    apiAction: "free-form",
    message: (target) => `Analyze my ${target} position.`,
    icon: Sparkles,
  },
  ...PORTFOLIO_QUICK_ACTIONS.filter(
    (action) =>
      action.id !== "concentration-check" &&
      action.id !== "portfolio-review" &&
      action.id !== "assignment-risk",
  ),
];

export const OPTIONS_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "options-review",
    label: "Analyze options",
    apiAction: "free-form",
    message: (target) =>
      `Analyze my ${target} option positions — rolls, assignment risk, and what to do next.`,
    icon: Sparkles,
  },
  {
    id: "assignment-risk",
    label: "Assignment risk",
    apiAction: "assignment risk",
    message: (target) =>
      `Review assignment and call-away risk in ${target} over the next two weeks. For each short option, say roll, close, or hold.`,
    icon: Timer,
  },
  {
    id: "roll-review",
    label: "Roll review",
    icon: TrendingUp,
    prompt: (target) =>
      `Review roll opportunities for my ${target} options. For each short leg, suggest roll targets with strike, expiration, and rationale.`,
  },
  {
    id: "tax-angle",
    label: "Tax angle",
    apiAction: "tax angle",
    message: (target) =>
      `What tax considerations apply to my ${target} options — gains, losses, and whether to harvest or roll for tax efficiency?`,
    icon: Scale,
  },
];

export const RESEARCH_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "bull-bear-case",
    label: "Bull/bear case",
    icon: TrendingUp,
    prompt: (target) =>
      `Summarize the bull case and bear case for ${target} in plain English — 3 bullets each, then which side the data favors today.`,
  },
  {
    id: "key-risks",
    label: "Key risks",
    icon: ShieldAlert,
    prompt: (target) =>
      `What are the top 3 business and market risks for ${target} over the next 6–12 months, and what would show up in the stock first?`,
  },
  {
    id: "competitive-moat",
    label: "Competitive moat",
    icon: ShieldCheck,
    prompt: (target) =>
      `How durable is ${target}'s competitive moat versus its main peers, and where is it most vulnerable?`,
  },
  {
    id: "earnings-preview",
    label: "Earnings preview",
    icon: Landmark,
    prompt: (target) =>
      `What should I watch in the next earnings report for ${target} — key metrics, guidance, and how the stock might react?`,
  },
];

/** @deprecated Use PORTFOLIO_QUICK_ACTIONS */
export const QUICK_ACTIONS = PORTFOLIO_QUICK_ACTIONS;

export function getQuickActionsForMode(mode: QuickActionMode): QuickAction[] {
  if (mode === "options") return OPTIONS_QUICK_ACTIONS;
  if (mode === "position") return POSITION_QUICK_ACTIONS;
  if (mode === "research") return RESEARCH_QUICK_ACTIONS;
  return PORTFOLIO_QUICK_ACTIONS;
}

export function findQuickAction(actionId: string): QuickAction | undefined {
  return (
    POSITION_QUICK_ACTIONS.find((action) => action.id === actionId) ??
    PORTFOLIO_QUICK_ACTIONS.find((action) => action.id === actionId) ??
    RESEARCH_QUICK_ACTIONS.find((action) => action.id === actionId)
  );
}

export function getQuickActionLabel(actionId: string): string {
  return findQuickAction(actionId)?.label ?? actionId;
}

export function getQuickActionApiAction(actionId: string): string {
  const action = findQuickAction(actionId);
  if (!action) return actionId;
  return action.apiAction ?? action.label;
}

export function formatQuickActionMessage(
  actionId: string,
  target: string,
): string {
  const action = findQuickAction(actionId);
  if (action?.prompt) return action.prompt(target);
  if (action?.message) return action.message(target);

  const actionLabel = getQuickActionLabel(actionId);
  return `${actionLabel} for ${target}`;
}

export function isFreeFormQuickAction(actionId: string): boolean {
  return !!findQuickAction(actionId)?.prompt;
}

export function isStructuredAnalyzeAction(actionId: string): boolean {
  return actionId === "position-review" || actionId === "portfolio-review";
}

function normalizeActionKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ");
}

/** Restore pill label text (e.g. "assignment risk") to the user-facing message. */
export function restoreQuickActionDisplayMessage(
  content: string,
  target: string,
): string {
  const normalized = normalizeActionKey(content);
  if (!normalized) return content;

  for (const action of [
    ...POSITION_QUICK_ACTIONS,
    ...PORTFOLIO_QUICK_ACTIONS,
    ...RESEARCH_QUICK_ACTIONS,
  ]) {
    const candidates = [
      action.label,
      action.apiAction,
      action.id.replace(/-/g, " "),
    ].filter(Boolean) as string[];

    if (!candidates.some((candidate) => normalizeActionKey(candidate) === normalized)) {
      continue;
    }

    if (action.message) return action.message(target);
    if (action.prompt) return action.prompt(target);
    return formatQuickActionMessage(action.id, target);
  }

  return content;
}

export function chatDisplayTarget(activeChatKey: string): string {
  if (activeChatKey === "__PORTFOLIO_CHAT__") return "my portfolio";
  if (activeChatKey.startsWith("__")) return "this position";
  return activeChatKey.toUpperCase();
}
