"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useStrategyJourney } from "@/app/hooks/useStrategyJourney";
import { isOnStrategyPlaybook } from "@/lib/strategyPlaybook";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
};

export function StrategySymbolBadge({ symbol, className }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { profile } = useStrategyJourney(accessToken, {
    enabled: !!accessToken,
  });

  const onPlaybook = useMemo(
    () => isOnStrategyPlaybook(profile, symbol),
    [profile, symbol],
  );

  if (!onPlaybook || !profile?.primaryStrategy) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-accent/30 bg-accent-muted/40 px-2 py-0.5 text-[10px] font-medium text-accent-strong",
        className,
      )}
    >
      On your playbook
    </span>
  );
}
