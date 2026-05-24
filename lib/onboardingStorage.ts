const STORAGE_KEY = "powerpocket-onboarding-dismissed";

export function isOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function dismissOnboarding(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, "1");
}
