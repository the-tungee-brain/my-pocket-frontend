import type { Metadata } from "next";
import {
  ArrowUpRight,
  ArrowDownRight,
  Info,
  AlertTriangle,
  BarChart3,
  Newspaper,
  Briefcase,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Stock Research",
  description: "Readable research page for a single stock.",
};

type SentimentLabel = "Bullish" | "Neutral" | "Bearish";

type ResearchData = {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  price: number;
  changePct: number;
  marketCap: string;
  range52w: string;
  timeframe: string;
  aiSummary: {
    short: string;
    long: string;
    sentiment: SentimentLabel;
  };
  business: {
    whatTheyDo: string;
    segments: string[];
    revenueNotes: string;
  };
  performance: {
    trendLabel: string;
    oneMonth: string;
    threeMonth: string;
    oneYear: string;
    volatilityNote: string;
  };
  fundamentals: {
    overviewNote: string;
    metrics: { label: string; value: string; note?: string }[];
  };
  news: {
    title: string;
    date: string;
    impact: "Positive" | "Neutral" | "Negative";
    summary: string;
  }[];
  risks: string[];
};

const MOCK_RESEARCH: ResearchData = {
  symbol: "NVDA",
  name: "NVIDIA Corporation",
  sector: "Semiconductors",
  country: "United States",
  price: 845.32,
  changePct: 2.37,
  marketCap: "$2.0T",
  range52w: "$375 – $975",
  timeframe: "Last 12 months",
  aiSummary: {
    short: "Fast‑growing chip company riding AI demand, with a rich valuation.",
    long:
      "NVIDIA designs chips and software that power gaming, data centers, and AI workloads. " +
      "Over the last year, demand for AI infrastructure has driven strong revenue and earnings growth. " +
      "The market now prices in high expectations, so future results need to stay strong to support the current share price.",
    sentiment: "Bullish",
  },
  business: {
    whatTheyDo:
      "NVIDIA designs graphics processing units (GPUs) and related software used in gaming, professional visualization, data centers, and automotive applications.",
    segments: [
      "Data center: chips and systems for AI and cloud workloads.",
      "Gaming: GPUs for PCs and gaming laptops.",
      "Professional visualization and automotive: graphics and compute platforms for workstations and cars.",
    ],
    revenueNotes:
      "In recent years, data center and AI workloads have become the largest and fastest‑growing part of the business.",
  },
  performance: {
    trendLabel: "Uptrend over the past year, with sharp moves after earnings.",
    oneMonth: "+8%",
    threeMonth: "+25%",
    oneYear: "+120%",
    volatilityNote:
      "The stock often moves sharply around earnings and macro news, so short‑term swings can be large.",
  },
  fundamentals: {
    overviewNote:
      "Growth and profitability are well above many peers, and the balance sheet is strong. The trade‑off is a higher valuation multiple.",
    metrics: [
      { label: "Market cap", value: "$2.0T" },
      {
        label: "Forward P/E",
        value: "41x",
        note: "Higher than most chip peers",
      },
      {
        label: "Revenue growth (3y)",
        value: "48% per year",
        note: "Helped by AI‑related demand",
      },
      {
        label: "Gross margin",
        value: "72%",
        note: "Improving as higher‑margin products scale",
      },
      {
        label: "Net debt",
        value: "Net cash",
        note: "Gives flexibility for investment and buybacks",
      },
    ],
  },
  news: [
    {
      title: "Company reports quarterly results above expectations",
      date: "2026‑02‑28",
      impact: "Positive",
      summary:
        "Revenue and earnings came in ahead of analyst estimates, driven by strong data center demand. Guidance was raised for the next quarter.",
    },
    {
      title: "New AI hardware platform announced",
      date: "2026‑01‑10",
      impact: "Positive",
      summary:
        "Management introduced a new generation of AI hardware, aiming to improve performance and energy efficiency for cloud customers.",
    },
    {
      title: "Short‑term volatility after macro headlines",
      date: "2025‑12‑15",
      impact: "Neutral",
      summary:
        "Shares moved sharply along with other tech names following interest rate comments, without major company‑specific news.",
    },
  ],
  risks: [
    "Results are sensitive to demand for AI and data center spending.",
    "Competition from other chipmakers and in‑house solutions at large cloud providers.",
    "High valuation leaves less room for disappointment if growth slows.",
  ],
};

function SentimentBadge({ label }: { label: SentimentLabel }) {
  let color = "bg-secondary text-foreground border-border";
  if (label === "Bullish") {
    color =
      "bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30";
  } else if (label === "Bearish") {
    color =
      "bg-red-50 text-red-800 border-red-100 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30";
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${color}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          label === "Bullish"
            ? "bg-emerald-500"
            : label === "Bearish"
              ? "bg-red-500"
              : "bg-neutral-400"
        }`}
      />
      Overall view: {label}
    </span>
  );
}

type PageProps = {
  params: { symbol: string };
};

export default function ResearchPage({ params }: PageProps) {
  const data = MOCK_RESEARCH;
  const positiveChange = data.changePct >= 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 lg:py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              Stock research
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {data.symbol} · {data.name}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Sector: {data.sector} · Country: {data.country}
            </p>
            <SentimentBadge label={data.aiSummary.sentiment} />
          </div>
          <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold">
                ${data.price.toLocaleString()}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  positiveChange
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {positiveChange ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span className="tabular-nums">
                  {positiveChange ? "+" : ""}
                  {data.changePct.toFixed(2)}%
                </span>
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
              Market cap: {data.marketCap} · 52‑week range: {data.range52w}
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Info className="h-4 w-4 text-neutral-500" />
            Big picture in plain language
          </h2>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {data.aiSummary.short}
          </p>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {data.aiSummary.long}
          </p>
        </section>

        <section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-neutral-500" />
                How this business makes money
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {data.business.whatTheyDo}
              </p>
              <ul className="list-disc space-y-1 text-sm text-neutral-700 dark:text-neutral-300 pl-4">
                {data.business.segments.map((seg) => (
                  <li key={seg}>{seg}</li>
                ))}
              </ul>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {data.business.revenueNotes}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <BarChart3 className="h-4 w-4 text-neutral-500" />
                Recent performance
              </h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {data.performance.trendLabel}
              </p>
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-secondary/70 p-3 text-xs">
                <div>
                  <p className="text-neutral-500">1 month</p>
                  <p className="mt-1 font-medium">
                    {data.performance.oneMonth}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">3 months</p>
                  <p className="mt-1 font-medium">
                    {data.performance.threeMonth}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500">1 year</p>
                  <p className="mt-1 font-medium">{data.performance.oneYear}</p>
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {data.performance.volatilityNote}
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Newspaper className="h-4 w-4 text-neutral-500" />
                Recent news and events
              </h3>
              <div className="space-y-3">
                {data.news.map((item) => (
                  <article
                    key={item.title + item.date}
                    className="rounded-xl border border-border bg-secondary/70 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <span className="text-xs text-neutral-500">
                        {item.date}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium">
                      Impact:{" "}
                      <span
                        className={
                          item.impact === "Positive"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : item.impact === "Negative"
                              ? "text-red-600 dark:text-red-400"
                              : "text-neutral-600 dark:text-neutral-400"
                        }
                      >
                        {item.impact}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {item.summary}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-xl border border-border bg-secondary/80 p-4 text-sm">
              <h3 className="text-sm font-semibold">Key numbers at a glance</h3>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {data.fundamentals.overviewNote}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                {data.fundamentals.metrics.map((m) => (
                  <div key={m.label} className="flex justify-between gap-3">
                    <dt className="text-neutral-500">{m.label}</dt>
                    <dd className="text-right">
                      <div className="text-neutral-900 dark:text-neutral-100">
                        {m.value}
                      </div>
                      {m.note && (
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {m.note}
                        </div>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-xl border border-border bg-secondary/80 p-4 text-sm">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Things to keep in mind
              </h3>
              <ul className="mt-2 list-disc space-y-1 text-sm text-neutral-700 dark:text-neutral-300 pl-4">
                {data.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                This is a simplified overview. Always dig deeper if you plan to
                invest.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
