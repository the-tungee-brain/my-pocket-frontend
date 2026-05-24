"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  ReactNode,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type TabId = "assistant" | "news";

type TabContextType = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
};

const TabContext = createContext<TabContextType | null>(null);

function parseTab(value: string | null): TabId {
  return value === "news" ? "news" : "assistant";
}

function TabProviderInner({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = parseTab(searchParams.get("tab"));

  const setActiveTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "assistant") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (pathname === "/portfolio" && activeTab === "news") {
      setActiveTab("assistant");
    }
  }, [pathname, activeTab, setActiveTab]);

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

export function TabProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <TabProviderInner>{children}</TabProviderInner>
    </Suspense>
  );
}

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("useTabs must be used within TabProvider");
  return context;
};

export function tabQuerySuffix(tab: TabId): string {
  return tab === "news" ? "?tab=news" : "";
}
