"use client";

type AllocationSlice = {
  name: string;
  value: number;
  pct: number;
};

type PortfolioAllocation = {
  totalValue: number;
  byAssetClass: AllocationSlice[];
  bySector: AllocationSlice[];
  byRegion: AllocationSlice[];
  aiSummary: {
    diversification: string;
    concentration: string;
    risk: string;
  };
};

const MOCK_PORTFOLIO: PortfolioAllocation = {
  totalValue: 250_000,
  byAssetClass: [
    { name: "US Stocks", value: 125_000, pct: 50 },
    { name: "International Stocks", value: 50_000, pct: 20 },
    { name: "Bonds", value: 50_000, pct: 20 },
    { name: "Cash", value: 25_000, pct: 10 },
  ],
  bySector: [
    { name: "Technology", value: 75_000, pct: 30 },
    { name: "Health Care", value: 37_500, pct: 15 },
    { name: "Financials", value: 37_500, pct: 15 },
    { name: "Energy", value: 25_000, pct: 10 },
    { name: "Consumer Discretionary", value: 25_000, pct: 10 },
    { name: "Industrials", value: 25_000, pct: 10 },
    { name: "Other", value: 25_000, pct: 10 },
  ],
  byRegion: [
    { name: "US", value: 175_000, pct: 70 },
    { name: "Developed ex‑US", value: 50_000, pct: 20 },
    { name: "Emerging Markets", value: 25_000, pct: 10 },
  ],
  aiSummary: {
    diversification:
      "Your portfolio is moderately diversified across assets, sectors, and regions, with most risk driven by equities.",
    concentration:
      "Technology is about 30% of your equity exposure, which is high but reasonable for a growth‑tilted portfolio.",
    risk: "Overall risk level is consistent with a growth profile: ~70% in stocks, 20% in bonds, and 10% in cash.",
  },
};

const formatUsd = (v: number) =>
  v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const formatPct = (v: number) => `${v.toFixed(0)}%`;

function AllocationList({
  title,
  items,
}: {
  title: string;
  items: AllocationSlice[];
}) {
  return (
    <div className="rounded-xl bg-neutral-900/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          {title}
        </div>
        <div className="text-[10px] text-neutral-500">
          {items.length} slices
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {items.map((item) => (
          <li key={item.name} className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="truncate pr-2">{item.name}</span>
              <span className="text-neutral-300">
                {formatUsd(item.value)} · {formatPct(item.pct)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-sky-500/70"
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PortfolioOverview() {
  const p = MOCK_PORTFOLIO;

  const stockPct =
    p.byAssetClass
      .filter((a) => a.name.toLowerCase().includes("stock"))
      .reduce((sum, a) => sum + a.pct, 0) ?? 0;
  const bondPct =
    p.byAssetClass
      .filter((a) => a.name.toLowerCase().includes("bond"))
      .reduce((sum, a) => sum + a.pct, 0) ?? 0;
  const cashPct =
    p.byAssetClass
      .filter((a) => a.name.toLowerCase().includes("cash"))
      .reduce((sum, a) => sum + a.pct, 0) ?? 0;

  return (
    <div className="mx-auto mb-4 mt-2 max-w-3xl rounded-2xl py-4 text-sm text-foreground shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Portfolio overview (mock)
          </div>
          <div className="mt-0.5 text-2xl font-semibold">
            {formatUsd(p.totalValue)}{" "}
            <span className="text-sm font-normal text-neutral-400">
              total value
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-400">
            Growth‑tilted, globally diversified sample portfolio
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[11px]">
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Diversified</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>{stockPct.toFixed(0)}% stocks</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>{bondPct.toFixed(0)}% bonds</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-neutral-500/10 px-2.5 py-1 text-neutral-300">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            <span>{cashPct.toFixed(0)}% cash</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AllocationList title="By asset class" items={p.byAssetClass} />
        <AllocationList title="By sector" items={p.bySector} />
        <AllocationList title="By region" items={p.byRegion} />
      </div>

      <div className="mt-5 rounded-2xl border border-neutral-800/80 bg-secondary p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-[11px] text-sky-300">
              AI
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-300">
                AI portfolio insights
              </div>
              <div className="text-[11px] text-neutral-500">
                High‑level read on diversification, concentration, and risk
              </div>
            </div>
          </div>
          <button className="hidden rounded-full border border-neutral-700 bg-neutral-900/60 px-2.5 py-1 text-[11px] text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800/80 sm:inline-flex">
            Regenerate
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-neutral-900/60 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
              Diversification
            </div>
            <p className="text-xs leading-relaxed text-neutral-200">
              {MOCK_PORTFOLIO.aiSummary.diversification}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-900/60 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
              Concentration
            </div>
            <p className="text-xs leading-relaxed text-neutral-200">
              {MOCK_PORTFOLIO.aiSummary.concentration}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-900/60 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-400">
              Risk
            </div>
            <p className="text-xs leading-relaxed text-neutral-200">
              {MOCK_PORTFOLIO.aiSummary.risk}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
