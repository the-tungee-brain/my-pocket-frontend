import {
  CalendarDays,
  CircleHelp,
  Scale,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type QuickAction = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "daily-summary", label: "Daily summary", icon: CalendarDays },
  { id: "risk-check", label: "Risk check", icon: ShieldAlert },
  { id: "tax-angle", label: "Tax angle", icon: Scale },
  { id: "what-changed", label: "What changed", icon: CircleHelp },
];

export function getQuickActionLabel(actionId: string): string {
  return (
    QUICK_ACTIONS.find((action) => action.id === actionId)?.label ?? actionId
  );
}

export function formatQuickActionMessage(
  actionId: string,
  target: string,
): string {
  const actionLabel = getQuickActionLabel(actionId);
  return `${actionLabel} for ${target}`;
}
