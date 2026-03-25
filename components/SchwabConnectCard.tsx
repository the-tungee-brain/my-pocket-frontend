"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { TopTabBar } from "./TobTabBar";
import { useTabs } from "@/app/contexts/TabContext";

export function SchwabConnectCard() {
  const { activeTab, setActiveTab } = useTabs();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex w-full justify-center">
      <div className="flex w-full max-w-3xl items-center justify-between gap-3">
        <TopTabBar activeTab={activeTab} onChange={setActiveTab} />
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
