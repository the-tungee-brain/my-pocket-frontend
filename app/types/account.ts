export type AccountPlan = {
  plan: "free" | "pro";
  isPaid: boolean;
  freeModel: string;
  defaultModel: string;
};
