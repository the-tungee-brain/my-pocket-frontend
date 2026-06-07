"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "tomcrest-theme";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "light" || preference === "dark") {
    root.dataset.theme = preference;
    return;
  }
  root.dataset.theme = "system";
}

function readStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "system";
}

export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = readStoredThemePreference();
    setPreferenceState(stored);
    applyThemePreference(stored);
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = isThemePreference(event.newValue)
        ? event.newValue
        : "system";
      setPreferenceState(next);
      applyThemePreference(next);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyThemePreference(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  return { preference, setPreference };
}
