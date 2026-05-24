const STORAGE_KEY = "powerpocket-onboarding-dismissed";
const RESEARCH_STORAGE_KEY = "powerpocket-research-onboarding-dismissed";

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
