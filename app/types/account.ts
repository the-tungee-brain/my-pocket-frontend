export type ChatModelDefinition = {
  id: string;
  label: string;
  description: string;
  tier: "fast" | "balanced" | "advanced";
};

export type AccountPlan = {
  plan: "free" | "pro";
  isPaid: boolean;
  email?: string;
  freeModel: string;
  defaultModel: string;
  /** Models available on the free plan — from backend allowlist. */
  freeModels?: string[];
  /** Pro-only models — from backend allowlist. */
  proOnlyModels?: string[];
  /** Full paid catalog — from backend allowlist. */
  paidModels?: string[];
  /** Models the signed-in user may select — from backend allowlist. */
  allowedModels?: string[];
  /** Picker catalog (labels, tiers) — from backend. */
  chatModels?: ChatModelDefinition[];
  /** Server-side feature flags (snake_case keys). */
  features?: Record<string, boolean>;
};
