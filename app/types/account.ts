export type AccountPlan = {
  plan: "free" | "pro";
  isPaid: boolean;
  freeModel: string;
  defaultModel: string;
  /** Server-side feature flags (snake_case keys). */
  features?: Record<string, boolean>;
};
