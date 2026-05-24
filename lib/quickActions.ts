import {
  CalendarDays,
  CircleHelp,
  Landmark,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { MainView } from "@/components/NavList";

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
    id: "daily-summary",
    label: "Daily summary",
    apiAction: "daily summary",
    message: (target) => `Give me a daily summary of ${target}.`,
    icon: CalendarDays,
  },
  {
    id: "risk-check",
    label: "Risk check",
    apiAction: "risk check",
    message: (target) => `What are the main risks in ${target} right now?`,
    icon: ShieldAlert,
  },
  {
    id: "tax-angle",
    label: "Tax angle",
    apiAction: "tax angle",
    message: (target) =>
      `What tax considerations should I keep in mind for ${target}?`,
    icon: Scale,
  },
  {
    id: "what-changed",
    label: "What changed",
    apiAction: "what changed",
    message: (target) => `What changed in ${target} recently?`,
    icon: CircleHelp,
  },
];

export const RESEARCH_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "bull-bear-case",
    label: "Bull/bear case",
    icon: TrendingUp,
    prompt: (target) =>
      `Summarize the bull case and bear case for ${target}. Keep it concise and balanced.`,
  },
  {
    id: "key-risks",
    label: "Key risks",
    icon: ShieldAlert,
    prompt: (target) =>
      `What are the main business and market risks for ${target} right now?`,
  },
  {
    id: "competitive-moat",
    label: "Competitive moat",
    icon: ShieldCheck,
    prompt: (target) =>
      `How durable is ${target}'s competitive moat, and who are the main competitors?`,
  },
  {
    id: "earnings-preview",
    label: "Earnings preview",
    icon: Landmark,
    prompt: (target) =>
      `What should investors watch ahead of the next earnings report for ${target}?`,
  },
];

/** @deprecated Use PORTFOLIO_QUICK_ACTIONS */
export const QUICK_ACTIONS = PORTFOLIO_QUICK_ACTIONS;

export function getQuickActionsForMode(mode: MainView): QuickAction[] {
  if (mode === "research") return RESEARCH_QUICK_ACTIONS;
  return PORTFOLIO_QUICK_ACTIONS;
}

export function findQuickAction(actionId: string): QuickAction | undefined {
  return (
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
