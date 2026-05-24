"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { TopTabBar } from "./TopTabBar";
import { useTabs } from "@/app/contexts/TabContext";
import { usePositionsContext } from "@/app/Providers";

export function SchwabConnectCard() {
  const { activeTab, setActiveTab } = useTabs();
  const { selectedView } = usePositionsContext();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex w-full items-center justify-end gap-3 md:max-w-md md:justify-between">
      <div className="hidden flex-1 md:block">
        {selectedView !== "research" ? (
          <TopTabBar activeTab={activeTab} onChange={setActiveTab} />
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {selectedView !== "research" && (
          <div className="md:hidden">
            <TopTabBar activeTab={activeTab} onChange={setActiveTab} />
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
    </div>
  );
}
