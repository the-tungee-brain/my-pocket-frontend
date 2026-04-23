"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { TopTabBar } from "./TobTabBar";
import { useTabs } from "@/app/contexts/TabContext";
import { usePositionsContext } from "@/app/Providers";

export function SchwabConnectCard() {
  const { activeTab, setActiveTab } = useTabs();
  const { selectedView } = usePositionsContext();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex w-full justify-center h-10">
      <div className="flex w-full max-w-3xl items-center justify-between gap-3">
        {selectedView !== "research" ? (
          <TopTabBar activeTab={activeTab} onChange={setActiveTab} />
        ) : (
          <div />
        )}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="xs"
            variant="ghost"
            className="text-[11px] text-neutral-400 hover:text-neutral-100"
            onClick={handleSignOut}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}
