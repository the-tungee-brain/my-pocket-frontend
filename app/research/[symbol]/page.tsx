import type { Metadata } from "next";
import { Info, AlertTriangle, Newspaper, Briefcase } from "lucide-react";
import { CompanySnapshot } from "./CompanySnapshot";
import { PerformanceSnapshot } from "./PerformanceSnapshot";
import { SummarySection } from "./SummarySection";
import { BusinessSection } from "./BusinessSection";

export const metadata: Metadata = {
  title: "Stock Research",
  description: "Readable research page for a single stock.",
};

type ResearchStatic = {
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

const MOCK_RESEARCH_STATIC: ResearchStatic = {
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

type PageProps = {
  params: { symbol: string };
};

export default async function ResearchPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 lg:py-10">
        <CompanySnapshot symbol={symbol} />
        <ResearchBody symbol={symbol} />
      </div>
    </main>
  );
}

function ResearchBody({ symbol }: { symbol: string }) {
  const data = MOCK_RESEARCH_STATIC;

  return (
    <>
      <SummarySection symbol={symbol} />

      <section className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <div className="space-y-8">
          <BusinessSection symbol={symbol} />

          <PerformanceSnapshot
            symbol={symbol}
            fallback={{
              trendLabel: "",
              oneMonth: "",
              threeMonth: "",
              oneYear: "",
              volatilityNote: "",
            }}
          />

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
    </>
  );
}
