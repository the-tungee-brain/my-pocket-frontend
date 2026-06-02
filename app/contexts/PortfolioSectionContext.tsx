"use client";

import {
  createContext,
  useCallback,
  useContext,
  ReactNode,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type PortfolioSectionId = "today" | "news" | "holdings" | "activity";

type PortfolioSectionContextType = {
  activeSection: PortfolioSectionId;
  setActiveSection: (section: PortfolioSectionId) => void;
};

const PortfolioSectionContext =
  createContext<PortfolioSectionContextType | null>(null);

function parseSection(value: string | null): PortfolioSectionId {
  if (value === "news" || value === "holdings" || value === "activity") {
    return value;
  }
  return "today";
}

function PortfolioSectionProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeSection = parseSection(searchParams.get("section"));

  const setActiveSection = useCallback(
    (section: PortfolioSectionId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (section === "today") {
        params.delete("section");
      } else {
        params.set("section", section);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <PortfolioSectionContext.Provider
      value={{ activeSection, setActiveSection }}
    >
      {children}
    </PortfolioSectionContext.Provider>
  );
}

export function PortfolioSectionProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <PortfolioSectionProviderInner>{children}</PortfolioSectionProviderInner>
    </Suspense>
  );
}

export function usePortfolioSection() {
  const context = useContext(PortfolioSectionContext);
  if (!context) {
    throw new Error(
      "usePortfolioSection must be used within PortfolioSectionProvider",
    );
  }
  return context;
}
