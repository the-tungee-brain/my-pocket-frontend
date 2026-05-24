const FOCUS_KEY = "powerpocket-focus-research-search";

export function requestResearchSearchFocus(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FOCUS_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeResearchSearchFocus(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const shouldFocus = sessionStorage.getItem(FOCUS_KEY) === "1";
    if (shouldFocus) {
      sessionStorage.removeItem(FOCUS_KEY);
    }
    return shouldFocus;
  } catch {
    return false;
  }
}
