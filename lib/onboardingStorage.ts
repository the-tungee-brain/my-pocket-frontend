const STORAGE_KEY = "powerpocket-onboarding-dismissed";
const RESEARCH_STORAGE_KEY = "powerpocket-research-onboarding-dismissed";
const WATCHLIST_HINT_KEY = "powerpocket-watchlist-hint-dismissed";
const STRATEGY_ONBOARDING_DISMISSED_KEY = "powerpocket-strategy-onboarding-dismissed";

const STRATEGY_JOURNEY_COLLAPSED_KEY = "powerpocket-strategy-journey-collapsed";

export function isStrategyJourneyCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STRATEGY_JOURNEY_COLLAPSED_KEY) !== "0";
}

export function setStrategyJourneyCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STRATEGY_JOURNEY_COLLAPSED_KEY, collapsed ? "1" : "0");
}

export function isStrategyOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STRATEGY_ONBOARDING_DISMISSED_KEY) === "1";
}

export function dismissStrategyOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STRATEGY_ONBOARDING_DISMISSED_KEY, "1");
}

export function clearStrategyOnboardingDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STRATEGY_ONBOARDING_DISMISSED_KEY);
}

export function isOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function dismissOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, "1");
}

export function isResearchOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(RESEARCH_STORAGE_KEY) === "1";
}

export function dismissResearchOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESEARCH_STORAGE_KEY, "1");
}

export function isWatchlistHintDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WATCHLIST_HINT_KEY) === "1";
}

export function dismissWatchlistHint(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WATCHLIST_HINT_KEY, "1");
}
