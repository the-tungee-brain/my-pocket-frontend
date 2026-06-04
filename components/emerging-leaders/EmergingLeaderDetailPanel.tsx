"use client";

import type { EmergingLeaderItem } from "@/app/types/emergingLeaders";
import { MoversInvestigateFooter } from "@/components/movers/MoversInvestigateFooter";
import { Badge } from "@/components/ui/Badge";
import { KpiStat } from "@/components/ui/KpiStat";
import {
  compressionVelocityTone,
  listRowSubtitle,
  setupScoreTone,
  stageBadgeVariant,
} from "@/lib/emergingLeaders";
import {
  moversCalloutClass,
  moversDetailEmptyClass,
  moversDetailPanelClass,
  moversSectionHeadingClass,
} from "@/lib/moversUi";
import { cn } from "@/lib/utils";

type Props = {
  item: EmergingLeaderItem | null;
  companyName?: string | null;
  className?: string;
};

function FactorBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "missing" | "next";
}) {
  if (!items.length) return null;
  const prefix = tone === "positive" ? "✓" : tone === "missing" ? "✗" : "•";

  return (
    <section className="space-y-2">
      <h3 className={moversSectionHeadingClass}>{title}</h3>
      <ul className="space-y-1.5">
        {items.map((line) => (
          <li
            key={line}
            className={cn(
              "text-sm leading-snug",
              tone === "positive" && "text-foreground",
              tone === "missing" && "text-muted",
              tone === "next" && "text-foreground",
            )}
          >
            <span className="mr-2 font-mono text-xs text-muted">{prefix}</span>
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function EmergingLeaderDetailPanel({
  item,
  companyName,
  className,
}: Props) {
  if (!item) {
    return (
      <aside className={cn(moversDetailEmptyClass, className)}>
        <p className="text-sm text-muted">
          Select a symbol for setup quality, gaps, and what to watch next.
        </p>
      </aside>
    );
  }

  const sym = item.symbol.toUpperCase();
  const scoreTone = setupScoreTone(item.setupQualityScore);

  return (
    <aside className={cn(moversDetailPanelClass, className)}>
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">
              {sym}
            </h2>
            {companyName ? (
              <p className="truncate text-sm text-muted">{companyName}</p>
            ) : null}
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                Rank #{item.rank}
              </span>
              {" · "}
              {listRowSubtitle(item)}
            </p>
            <Badge variant={stageBadgeVariant(item.setupStage)}>
              {item.setupStageLabel}
            </Badge>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <KpiStat
          label="Setup quality"
          value={`${item.setupQualityScore}/100`}
          tone={scoreTone}
        />
        <KpiStat
          label="Compression velocity"
          value={`${item.compressionVelocityLabel} · ${item.compressionVelocity}/100`}
          tone={compressionVelocityTone(item.compressionVelocity)}
        />
      </div>

      <section className="space-y-2">
        <h3 className={moversSectionHeadingClass}>Why it ranks</h3>
        <p className={moversCalloutClass}>{item.whyItRanks}</p>
      </section>

      <FactorBlock
        title="What supports the setup"
        items={item.positiveFactors}
        tone="positive"
      />
      <FactorBlock
        title="What is still missing"
        items={item.missingFactors}
        tone="missing"
      />
      <FactorBlock
        title="Next confirmation"
        items={item.nextConfirmation}
        tone="next"
      />

      <MoversInvestigateFooter symbol={sym} />
    </aside>
  );
}
