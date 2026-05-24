"use client";

import { useCallback, useMemo } from "react";
import { usePositionsContext } from "@/app/Providers";
import { SymbolAlertStrip } from "@/components/SymbolAlertStrip";
import type { ProactiveAlert } from "@/app/types/intelligence";
import { alertToQuickActionId, mergeDisplayAlerts } from "@/lib/intelligence";

type Props = {
  symbol: string;
};

export function SymbolResearchAlertsSection({ symbol }: Props) {
  const {
    positionMap,
    proactiveAlerts,
    portfolioBrief,
    sendQuickAction,
  } = usePositionsContext();

  const symbolUpper = symbol.toUpperCase();
  const hasPosition = (positionMap[symbolUpper]?.length ?? 0) > 0;

  const alerts = useMemo(
    () => mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
    [proactiveAlerts, portfolioBrief],
  );

  const handleRunAlert = useCallback(
    (alert: ProactiveAlert) => {
      void sendQuickAction({
        activeChatKey: `__RESEARCH_${symbolUpper}__`,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionMap[symbolUpper] ?? [],
        actionId: alertToQuickActionId(alert),
      });
    },
    [positionMap, sendQuickAction, symbolUpper],
  );

  if (!hasPosition) return null;

  return (
    <SymbolAlertStrip
      className="mb-4"
      symbol={symbolUpper}
      alerts={alerts}
      onRunAlert={handleRunAlert}
    />
  );
}
