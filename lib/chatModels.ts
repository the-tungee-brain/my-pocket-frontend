import type { AccountPlan, ChatModelDefinition } from "@/app/types/account";

export type ModelTierId = "fast" | "balanced" | "advanced";

export type ChatModelOption = ChatModelDefinition;

export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";

export const CHAT_MODEL_TIERS: {
  id: ModelTierId;
  label: string;
}[] = [
  { id: "fast", label: "Simple" },
  { id: "balanced", label: "Standard" },
  { id: "advanced", label: "Advanced" },
];

/** Offline fallback when `/account/plan` has not loaded yet. */
export const FALLBACK_CHAT_MODEL_OPTIONS: ChatModelOption[] = [
  {
    id: "gpt-5-nano",
    label: "Fast",
    description: "Quick replies for simple questions",
    tier: "fast",
  },
  {
    id: "gpt-4o-mini",
    label: "Fast",
    description: "Lightweight and responsive",
    tier: "fast",
  },
  {
    id: DEFAULT_CHAT_MODEL,
    label: "Balanced",
    description: "Recommended for most portfolio and research questions",
    tier: "balanced",
  },
  {
    id: "gpt-5.1",
    label: "Advanced",
    description: "Strong general-purpose analysis",
    tier: "advanced",
  },
  {
    id: "gpt-4o",
    label: "Advanced",
    description: "Reliable depth for everyday use",
    tier: "advanced",
  },
  {
    id: "gpt-5.4",
    label: "Advanced",
    description: "Deepest analysis — best for complex questions",
    tier: "advanced",
  },
  {
    id: "o3",
    label: "Advanced",
    description: "Maximum reasoning depth, slower responses",
    tier: "advanced",
  },
  {
    id: "o4-mini",
    label: "Advanced",
    description: "Strong reasoning with moderate speed",
    tier: "advanced",
  },
];

/** @deprecated Use `getChatModelOptions(plan)` — kept for imports that expect a static list. */
export const CHAT_MODEL_OPTIONS = FALLBACK_CHAT_MODEL_OPTIONS;

export function getChatModelOptions(
  plan?: AccountPlan | null,
): ChatModelOption[] {
  if (plan?.chatModels?.length) {
    return plan.chatModels;
  }
  return FALLBACK_CHAT_MODEL_OPTIONS;
}

export function getDefaultChatModel(plan?: AccountPlan | null): string {
  return plan?.freeModel ?? DEFAULT_CHAT_MODEL;
}

export function getModelDisplayName(
  modelId: string,
  plan?: AccountPlan | null,
): string {
  const match = getChatModelOptions(plan).find((option) => option.id === modelId);
  if (!match) return "Balanced";
  if (match.tier === "balanced" && match.id === getDefaultChatModel(plan)) {
    return "Balanced";
  }
  return `${match.label} · ${match.description.split(" ")[0]}`;
}

export function getModelTierLabel(
  modelId: string,
  plan?: AccountPlan | null,
): string {
  const match = getChatModelOptions(plan).find((option) => option.id === modelId);
  if (!match) return "Standard";
  return (
    CHAT_MODEL_TIERS.find((tier) => tier.id === match.tier)?.label ?? "Standard"
  );
}

export function getModelButtonLabel(
  modelId: string,
  plan?: AccountPlan | null,
): string {
  const tier = getModelTierLabel(modelId, plan);
  return `${tier} · ${modelId}`;
}

export function isDefaultModel(
  modelId: string,
  plan?: AccountPlan | null,
): boolean {
  return modelId === getDefaultChatModel(plan);
}

export function requiresProModel(
  modelId: string,
  plan?: AccountPlan | null,
): boolean {
  if (plan?.proOnlyModels?.length) {
    return plan.proOnlyModels.includes(modelId);
  }
  const match = getChatModelOptions(plan).find((option) => option.id === modelId);
  if (!match) return true;
  return match.tier === "advanced";
}

export function isFreePlanModel(
  modelId: string,
  plan?: AccountPlan | null,
): boolean {
  if (plan?.freeModels?.length) {
    return plan.freeModels.includes(modelId);
  }
  const match = getChatModelOptions(plan).find((option) => option.id === modelId);
  return match?.tier === "fast" || match?.tier === "balanced";
}

export function normalizeChatModelId(
  modelId: string | undefined | null,
  plan?: AccountPlan | null,
): string {
  const trimmed = modelId?.trim();
  const fallback = getDefaultChatModel(plan);
  if (!trimmed) return fallback;
  return getChatModelOptions(plan).some((option) => option.id === trimmed)
    ? trimmed
    : fallback;
}

/** Clamp to server allowlists from `/account/plan`. */
export function clampChatModelForPlan(
  modelId: string | undefined | null,
  plan?: AccountPlan | null,
): string {
  const normalized = normalizeChatModelId(modelId, plan);
  if (!plan) {
    return requiresProModel(normalized, plan) ? getDefaultChatModel(plan) : normalized;
  }
  if (plan.isPaid) {
    const allowed = plan.allowedModels ?? plan.paidModels;
    if (allowed?.length) {
      return allowed.includes(normalized)
        ? normalized
        : (plan.defaultModel ?? getDefaultChatModel(plan));
    }
    return normalized;
  }
  const freeModels = plan.freeModels ?? [];
  if (freeModels.includes(normalized)) return normalized;
  return getDefaultChatModel(plan);
}

export function isModelAllowedForPlan(
  modelId: string,
  plan?: AccountPlan | null,
): boolean {
  const normalized = normalizeChatModelId(modelId, plan);
  if (!plan) return !requiresProModel(normalized, plan);
  if (plan.isPaid) {
    const allowed = plan.allowedModels ?? plan.paidModels;
    return allowed?.includes(normalized) ?? true;
  }
  return plan.freeModels?.includes(normalized) ?? false;
}
