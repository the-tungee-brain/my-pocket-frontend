"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { TopTabBar } from "./TopTabBar";
import { useTabs } from "@/app/contexts/TabContext";
import { usePositionsContext } from "@/app/Providers";

export function HeaderActions() {
  const { activeTab, setActiveTab } = useTabs();
  const { selectedView } = usePositionsContext();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const showPortfolioTabs = selectedView !== "research";

  return (
    <div className="flex shrink-0 items-center gap-2 md:min-w-0 md:flex-1 md:justify-end">
      {showPortfolioTabs && (
        <div className="hidden flex-1 md:block">
          <TopTabBar
            activeTab={activeTab}
            onChange={setActiveTab}
            showNews={selectedView === "symbol"}
          />
        </div>
      )}
      <Button
        size="xs"
        variant="ghost"
        className="text-[11px] text-muted hover:text-foreground"
        onClick={handleSignOut}
      >
        Log out
      </Button>
    </div>
  );
}
