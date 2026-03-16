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

export function PortfolioOverview() {
  const p = MOCK_PORTFOLIO;

  return (
    <div className="mx-auto mb-4 mt-2 max-w-3xl rounded-2xl border border-border bg-secondary/80 p-4 text-sm text-foreground">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Portfolio overview (mock)
          </div>
          <div className="text-lg font-semibold">
            {formatUsd(p.totalValue)} total
          </div>
        </div>
        <div className="text-right text-xs text-neutral-400">
          Growth‑tilted, globally diversified sample portfolio
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            By asset class
          </div>
          <ul className="space-y-1 text-xs">
            {p.byAssetClass.map((a) => (
              <li
                key={a.name}
                className="flex items-center justify-between rounded-md bg-neutral-900/40 px-2 py-1"
              >
                <span>{a.name}</span>
                <span className="text-neutral-300">
                  {formatUsd(a.value)} · {a.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            By sector
          </div>
          <ul className="space-y-1 text-xs">
            {p.bySector.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between rounded-md bg-neutral-900/40 px-2 py-1"
              >
                <span>{s.name}</span>
                <span className="text-neutral-300">
                  {formatUsd(s.value)} · {s.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            By region
          </div>
          <ul className="space-y-1 text-xs">
            {p.byRegion.map((r) => (
              <li
                key={r.name}
                className="flex items-center justify-between rounded-md bg-neutral-900/40 px-2 py-1"
              >
                <span>{r.name}</span>
                <span className="text-neutral-300">
                  {formatUsd(r.value)} · {r.pct.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-neutral-900/40 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
            Diversification
          </div>
          <p className="text-xs text-neutral-200">
            {p.aiSummary.diversification}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-900/40 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400">
            Concentration
          </div>
          <p className="text-xs text-neutral-200">
            {p.aiSummary.concentration}
          </p>
        </div>
        <div className="rounded-xl bg-neutral-900/40 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-rose-400">
            Risk
          </div>
          <p className="text-xs text-neutral-200">{p.aiSummary.risk}</p>
        </div>
      </div>
    </div>
  );
}
