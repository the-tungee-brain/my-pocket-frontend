export type ModelTierId = "fast" | "balanced" | "advanced";

export type ChatModelOption = {
  id: string;
  label: string;
  description: string;
  tier: ModelTierId;
};

export const DEFAULT_CHAT_MODEL = "gpt-5-mini";

export const CHAT_MODEL_TIERS: {
  id: ModelTierId;
  label: string;
}[] = [
  { id: "fast", label: "Fast" },
  { id: "balanced", label: "Balanced" },
  { id: "advanced", label: "Advanced" },
];

export const CHAT_MODEL_OPTIONS: ChatModelOption[] = [
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
    label: "Balanced",
    description: "Strong general-purpose analysis",
    tier: "balanced",
  },
  {
    id: "gpt-4o",
    label: "Balanced",
    description: "Reliable depth for everyday use",
    tier: "balanced",
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

export function getModelDisplayName(modelId: string): string {
  const match = CHAT_MODEL_OPTIONS.find((option) => option.id === modelId);
  if (!match) return "Balanced";
  if (match.tier === "balanced" && match.id === DEFAULT_CHAT_MODEL) {
    return "Balanced";
  }
  return `${match.label} · ${match.description.split(" ")[0]}`;
}

export function getModelTierLabel(modelId: string): string {
  const match = CHAT_MODEL_OPTIONS.find((option) => option.id === modelId);
  return match?.label ?? "Balanced";
}

export function getModelButtonLabel(modelId: string): string {
  const tier = getModelTierLabel(modelId);
  return `${tier} · ${modelId}`;
}

export function isDefaultModel(modelId: string): boolean {
  return modelId === DEFAULT_CHAT_MODEL;
}
