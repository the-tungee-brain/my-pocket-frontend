"use client";

import { createContext, useContext, ReactNode } from "react";
import { useState } from "react";

export type TabId = "assistant" | "news";

type TabContextType = {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
};

const TabContext = createContext<TabContextType | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>("assistant");
  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  );
}

export const useTabs = () => {
  const context = useContext(TabContext);
  if (!context) throw new Error("useTabs must be used within TabProvider");
  return context;
};
