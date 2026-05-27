"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePositionsContext } from "@/app/Providers";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { TaxWashSaleStrip } from "@/components/TaxWashSaleStrip";
import { OptionsTabPrompt } from "@/components/OptionsTabPrompt";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SymbolAlertStrip } from "@/components/SymbolAlertStrip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  alertToQuickActionId,
  collectTaxAlertItems,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import type { TaxAlertItem } from "@/lib/intelligence";
import type { ProactiveAlert } from "@/app/types/intelligence";
import { symbolChatKey } from "@/lib/chatKeys";
import { scrollToChat } from "@/lib/scrollToChat";
import { shouldShowOptionsTab } from "@/lib/symbolOptions";
import { BriefcaseBusiness } from "lucide-react";
import { pageSectionClass } from "@/lib/pageLayout";
import { PageSplit } from "@/components/PageShell";

type Props = {
  symbol: string;
};

export function SymbolPositionContent({ symbol }: Props) {
  const {
    error,
    positionMap,
    proactiveAlerts,
    portfolioBrief,
    recentActivity,
    sendQuickAction,
  } = usePositionsContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;

  const { intelligence } = useSymbolIntelligence(symbol, { accessToken });

  const positionsForSelectedSymbol = positionMap[symbolUpper] ?? null;
  const hasPosition = (positionsForSelectedSymbol?.length ?? 0) > 0;
  const showOptionsPrompt = shouldShowOptionsTab(
    positionsForSelectedSymbol,
    intelligence,
  );

  const taxItems = useMemo(
    () =>
      collectTaxAlertItems(
        mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
        recentActivity?.suggestedActions ?? [],
        symbolUpper,
      ),
    [proactiveAlerts, portfolioBrief, recentActivity?.suggestedActions, symbolUpper],
  );

  const symbolAlerts = useMemo(
    () => mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
    [proactiveAlerts, portfolioBrief],
  );

  const handleSuggestedAction = useCallback(
    (actionId: string) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId,
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionsForSelectedSymbol],
  );

  const handleRunAlert = useCallback(
    (alert: ProactiveAlert) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId: alertToQuickActionId(alert),
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionsForSelectedSymbol],
  );

  const handleTaxAlert = useCallback(
    (item: TaxAlertItem) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId: item.actionId,
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionsForSelectedSymbol],
  );

  const handleAskFollowUp = useCallback(() => {
    scrollToChat();
  }, []);

  if (!hasPosition) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="No Schwab position"
        description={`You are not holding ${symbolUpper} in your linked Schwab account. Use Overview for company research or add it to your watchlist.`}
        variant="solid"
      />
    );
  }

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PageSplit
        main={
          <>
            {showOptionsPrompt && (
              <OptionsTabPrompt
                symbol={symbolUpper}
                className={pageSectionClass}
              />
            )}

            <AnalysisPanel
              mode="symbol"
              symbol={symbolUpper}
              positions={positionsForSelectedSymbol}
              hideComparePaths
              className={pageSectionClass}
              onAskFollowUp={handleAskFollowUp}
            />

            {accessToken && (
              <RecentActivitySection
                className={pageSectionClass}
                accessToken={accessToken}
                symbol={symbolUpper}
                onRunSuggestedAction={handleSuggestedAction}
              />
            )}
          </>
        }
        aside={
          taxItems.length > 0 || symbolAlerts.length > 0 ? (
            <>
              {taxItems.length > 0 && (
                <TaxWashSaleStrip
                  className={pageSectionClass}
                  items={taxItems}
                  onRun={handleTaxAlert}
                />
              )}

              <SymbolAlertStrip
                className={pageSectionClass}
                symbol={symbolUpper}
                alerts={symbolAlerts}
                onRunAlert={handleRunAlert}
              />
            </>
          ) : undefined
        }
      />
    </>
  );
}
