"use client";

import { useSession } from "next-auth/react";
import { useIntradayTradingBias } from "@/app/hooks/useIntradayTradingBias";
import { useResearchEvents } from "@/app/hooks/useResearchEvents";
import { useResearchSnapshot } from "@/app/hooks/useResearchSnapshot";
import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import type {
  ChartIntelligenceZone,
  EventTimelineEntry,
} from "@/app/types/intelligence";
import type { IntradayTradingBiasResponse } from "@/app/types/research";
import {
  ResearchRow,
  ResearchSection,
  researchMemo,
} from "@/components/research/ResearchMemoPrimitives";
import { ResearchOverviewDecision } from "@/components/research/ResearchOverviewDecision";
import { ResearchOverviewEvidence } from "@/components/research/ResearchOverviewEvidence";
import { ResearchOverviewTradePlan } from "@/components/research/ResearchOverviewTradePlan";
import { TickerKeyStats } from "@/components/TickerKeyStats";
import { formatFriendlyDate } from "@/lib/dateUtils";
import { pageSectionClass } from "@/lib/pageLayout";
import { EtfFundsOverview } from "./EtfFundsOverview";
import { EtfHoldingsOverviewPreview } from "./EtfHoldingsPageContent";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { ResearchStockChart } from "./ResearchStockChart";
import { useResearchSymbolIntelligence } from "./ResearchSymbolIntelligenceContext";

type Props = {
  symbol: string;
};

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value))
    return "Unavailable";
  return `$${value.toFixed(2)}`;
}

function zoneDisplayPrice(zone: ChartIntelligenceZone | null | undefined) {
  if (!zone) return null;
  if (
    typeof zone.displayLevel === "number" &&
    Number.isFinite(zone.displayLevel)
  ) {
    return zone.displayLevel;
  }
  if (typeof zone.midpoint === "number" && Number.isFinite(zone.midpoint)) {
    return zone.midpoint;
  }
  return (zone.priceLow + zone.priceHigh) / 2;
}

function zoneBreakoutPrice(zone: ChartIntelligenceZone | null | undefined) {
  if (!zone) return null;
  if (
    typeof zone.breakoutLevel === "number" &&
    Number.isFinite(zone.breakoutLevel)
  ) {
    return zone.breakoutLevel;
  }
  return zoneDisplayPrice(zone);
}

function activeSupport(
  zone: ChartIntelligenceZone | null | undefined,
  visiblePrice: number | null | undefined,
) {
  const price = zoneDisplayPrice(zone);
  if (
    !zone ||
    typeof price !== "number" ||
    typeof visiblePrice !== "number" ||
    !Number.isFinite(visiblePrice) ||
    price >= visiblePrice
  ) {
    return null;
  }
  return zone;
}

function activeResistance(
  zone: ChartIntelligenceZone | null | undefined,
  visiblePrice: number | null | undefined,
) {
  const price = zoneDisplayPrice(zone);
  const breakout = zoneBreakoutPrice(zone);
  if (
    !zone ||
    typeof price !== "number" ||
    typeof breakout !== "number" ||
    typeof visiblePrice !== "number" ||
    !Number.isFinite(visiblePrice) ||
    price <= visiblePrice ||
    breakout <= visiblePrice
  ) {
    return null;
  }
  return zone;
}

function zoneNote(zone: ChartIntelligenceZone | null | undefined) {
  if (!zone) return "No actionable level from current structure.";
  return [
    zone.zoneState ?? "chart context",
    zone.distancePctFromCurrent != null
      ? `${zone.distancePctFromCurrent.toFixed(1)}% from price`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function KeyLevelsSection({
  support,
  resistance,
  breakoutLevel,
  invalidation,
  className,
}: {
  support: ChartIntelligenceZone | null | undefined;
  resistance: ChartIntelligenceZone | null | undefined;
  breakoutLevel: number | null | undefined;
  invalidation: number | string | null | undefined;
  className?: string;
}) {
  return (
    <ResearchSection title="Key Levels" className={className}>
      <div className="divide-y divide-border/60">
        <ResearchRow
          label="Actionable support"
          status={formatMoney(zoneDisplayPrice(support))}
          body={zoneNote(support)}
        />
        <ResearchRow
          label="Actionable resistance"
          status={formatMoney(zoneDisplayPrice(resistance))}
          body={zoneNote(resistance)}
        />
        <ResearchRow
          label="Breakout above"
          status={formatMoney(breakoutLevel)}
          body={
            breakoutLevel == null
              ? "No actionable breakout level above price."
              : undefined
          }
        />
        <ResearchRow
          label="Invalidation"
          status={
            typeof invalidation === "number"
              ? formatMoney(invalidation)
              : (invalidation ?? "Unavailable")
          }
        />
      </div>
    </ResearchSection>
  );
}

const INACTIVE_STALENESS_SECONDS = 60 * 60;

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function intradayIsInactive(data: IntradayTradingBiasResponse): boolean {
  if (
    typeof data.stalenessSeconds === "number" &&
    data.stalenessSeconds > INACTIVE_STALENESS_SECONDS
  ) {
    return true;
  }
  const inactiveCopy = [...data.warnings, ...data.dataGaps]
    .join(" ")
    .toLowerCase();
  return (
    inactiveCopy.includes("outside market hours") ||
    inactiveCopy.includes("market is closed") ||
    inactiveCopy.includes("intraday read is stale")
  );
}

function IntradayReadSection({
  data,
  className,
}: {
  data: IntradayTradingBiasResponse | null;
  className?: string;
}) {
  if (!data) {
    return (
      <ResearchSection title="Intraday Read" className={className}>
        <p className="text-sm text-muted">
          Delayed intraday read is not available.
        </p>
      </ResearchSection>
    );
  }

  const lastBar = data.lastUpdated ? new Date(data.lastUpdated) : null;
  const lastBarLabel =
    lastBar && !Number.isNaN(lastBar.getTime())
      ? `Last bar ${lastBar.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}`
      : null;
  const mutedNote = [...data.warnings, ...data.dataGaps]
    .map((item) => item.trim())
    .filter(Boolean)[0];
  const inactive = intradayIsInactive(data);

  return (
    <ResearchSection title="Intraday Read" className={className}>
      <div className="divide-y divide-border/60">
        <ResearchRow
          label="Session"
          status={`${inactive ? "Previous session" : "Latest read"}: ${data.bias}`}
          body={[
            inactive ? "Not live" : "Delayed 5-minute data",
            lastBarLabel,
            data.provider,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <ResearchRow
          label="Market"
          status={formatLabel(data.alignment.market)}
          body={mutedNote ? `Note: ${mutedNote.replace(/_/g, " ")}` : undefined}
        />
      </div>
    </ResearchSection>
  );
}

function EventsWarningsSection({
  events,
  eventsLoading,
  eventsError,
  warnings,
  className,
}: {
  events: EventTimelineEntry[];
  eventsLoading?: boolean;
  eventsError?: string | null;
  warnings: string[];
  className?: string;
}) {
  const visibleWarnings = warnings
    .map((warning) => warning.trim())
    .filter(Boolean)
    .filter((warning, index, all) => all.indexOf(warning) === index)
    .slice(0, 3);
  const visibleEvents = Array.from(
    new Map(
      events.map((event) => [
        `${event.date}-${event.title}-${event.kind ?? ""}-${event.url ?? ""}`,
        event,
      ]),
    ).values(),
  ).slice(0, 3);

  if (
    !visibleEvents.length &&
    !eventsLoading &&
    !eventsError &&
    !visibleWarnings.length
  ) {
    return null;
  }

  return (
    <ResearchSection title="Events / Warnings" className={className}>
      <div className="divide-y divide-border/60">
        {visibleEvents.map((event) => (
          <ResearchRow
            key={`${event.date}-${event.title}-${event.kind ?? ""}-${
              event.url ?? ""
            }`}
            label={formatFriendlyDate(event.date)}
            status={event.title}
          />
        ))}
        {eventsLoading && !events.length ? (
          <ResearchRow label="Events" status="Loading recent events" />
        ) : null}
        {eventsError ? (
          <ResearchRow label="Events" status="Unavailable" body={eventsError} />
        ) : null}
        {visibleWarnings.map((warning) => (
          <ResearchRow
            key={warning}
            label="Warning"
            status={warning.replace(/_/g, " ")}
            tone="muted"
          />
        ))}
      </div>
    </ResearchSection>
  );
}

export function ResearchOverviewTopSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isEtf } = useResearchAssetTypeContext();

  const symbolIntelligence = useResearchSymbolIntelligence();
  const intelligence = symbolIntelligence?.intelligence ?? null;
  const loading = symbolIntelligence?.loading ?? false;
  const researchEvents = useResearchEvents(symbol, accessToken);
  const { intradayTradingBias } = useIntradayTradingBias(symbol, accessToken, {
    enabled: !isEtf,
  });
  const { snapshot } = useResearchSnapshot(symbol, { accessToken });
  const { traderPlaybook } = useTraderPlaybook(symbol, accessToken, {
    enabled: !isEtf,
  });
  const intelligenceTimeline = intelligence?.eventTimeline ?? [];
  const recentEventsTimeline = researchEvents.events.length
    ? researchEvents.events
    : intelligenceTimeline;
  const recentEventsLoading =
    researchEvents.isLoading && recentEventsTimeline.length === 0;
  const recentEventsError =
    recentEventsTimeline.length === 0 ? researchEvents.error : null;
  const selectedLevels =
    intelligence?.patternIntelligence?.chartIntelligence?.selectedLevels;
  const dataGaps = intelligence?.dataGaps ?? [];
  const visiblePrice =
    snapshot?.price ?? selectedLevels?.referencePrice ?? null;
  const actionableSupport = activeSupport(
    selectedLevels?.actionableSupport ?? null,
    visiblePrice,
  );
  const actionableResistance = activeResistance(
    selectedLevels?.actionableResistance ?? null,
    visiblePrice,
  );
  const rawBreakoutLevel = actionableResistance?.breakoutLevel ?? null;
  const breakoutLevel =
    typeof rawBreakoutLevel === "number" &&
    typeof visiblePrice === "number" &&
    rawBreakoutLevel > visiblePrice
      ? rawBreakoutLevel
      : null;
  const invalidation =
    traderPlaybook?.levels.stop ??
    traderPlaybook?.conditions.invalidIf[0] ??
    null;
  const warnings = [symbolIntelligence?.error, ...dataGaps].filter(
    (item): item is string => Boolean(item),
  );

  return (
    <div className={researchMemo.pageGap}>
      <ResearchStockChart
        symbol={symbol}
        chartIntelligence={intelligence?.patternIntelligence?.chartIntelligence}
        autoSwitchToChartIntelligence={false}
      />

      <ResearchSection title="Key Stats" className={pageSectionClass}>
        <TickerKeyStats symbol={symbol} variant="definition" />
      </ResearchSection>

      {!isEtf ? (
        <ResearchOverviewDecision
          symbol={symbol}
          accessToken={accessToken}
          className={pageSectionClass}
        />
      ) : null}

      {!isEtf ? (
        <ResearchOverviewTradePlan
          symbol={symbol}
          accessToken={accessToken}
          className={pageSectionClass}
        />
      ) : null}

      {!isEtf ? (
        <KeyLevelsSection
          support={actionableSupport}
          resistance={actionableResistance}
          breakoutLevel={breakoutLevel}
          invalidation={invalidation}
          className={pageSectionClass}
        />
      ) : null}

      {isEtf ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <EtfFundsOverview symbol={symbol} className={pageSectionClass} />
          <EtfHoldingsOverviewPreview
            symbol={symbol}
            stacked
            className={pageSectionClass}
          />
        </div>
      ) : null}

      <ResearchOverviewEvidence
        symbol={symbol}
        accessToken={accessToken}
        intelligence={intelligence}
        intelligenceLoading={loading}
        isEtf={isEtf}
        className={pageSectionClass}
      />

      {!isEtf ? (
        <IntradayReadSection
          data={intradayTradingBias}
          className={pageSectionClass}
        />
      ) : null}

      <EventsWarningsSection
        events={recentEventsTimeline.slice(0, 3)}
        eventsLoading={recentEventsLoading}
        eventsError={recentEventsError}
        warnings={warnings}
        className={pageSectionClass}
      />
    </div>
  );
}
