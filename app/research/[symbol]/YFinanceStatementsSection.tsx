"use client";

import { useState } from "react";
import type { YFinanceFinancialStatements } from "@/app/hooks/useFundamentals";
import {
  formatStatementCellValue,
  formatYfinancePeriod,
  statementHasData,
} from "@/lib/yfinanceFinancials";
import { cn } from "@/lib/utils";

type StatementTab = "income" | "balance" | "cash";

type YFinanceStatementsSectionProps = {
  snapshot: YFinanceFinancialStatements | null | undefined;
  isLoading?: boolean;
};

export function YFinanceStatementsSection({
  snapshot,
  isLoading,
}: YFinanceStatementsSectionProps) {
  const [tab, setTab] = useState<StatementTab>("income");

  if (isLoading) {
    return <div className="h-56 animate-pulse rounded-xl bg-muted-bg" />;
  }

  if (!snapshot?.periods.length) {
    return (
      <p className="text-sm text-muted">
        Statement data isn&apos;t available for this symbol right now.
      </p>
    );
  }

  const periods = snapshot.periods;
  const sections: {
    id: StatementTab;
    label: string;
    rows: YFinanceFinancialStatements["incomeStatement"];
  }[] = [
    { id: "income", label: "Income", rows: snapshot.incomeStatement },
    { id: "balance", label: "Balance sheet", rows: snapshot.balanceSheet },
    { id: "cash", label: "Cash flow", rows: snapshot.cashFlow },
  ];

  const active =
    sections.find((section) => section.id === tab) ?? sections[0];

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-lg border border-border bg-muted-bg/50 p-0.5">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setTab(section.id)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              tab === section.id
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      <StatementTable
        title={active.label}
        periods={periods}
        rows={active.rows}
      />
    </div>
  );
}

function StatementTable({
  title,
  periods,
  rows,
}: {
  title: string;
  periods: string[];
  rows: YFinanceFinancialStatements["incomeStatement"];
}) {
  if (!statementHasData(rows, periods)) {
    return (
      <p className="text-sm text-muted">No {title.toLowerCase()} rows available.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">{title} statement</caption>
        <thead>
          <tr className="border-b border-border bg-muted-bg/40">
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[10rem] bg-muted-bg/95 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted"
            >
              Line item
            </th>
            {periods.map((period) => (
              <th
                key={period}
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted"
              >
                {formatYfinancePeriod(period)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.label}
              className="border-b border-border/60 last:border-0"
            >
              <th
                scope="row"
                className="sticky left-0 z-10 bg-background/95 px-3 py-2 font-medium text-foreground"
              >
                {row.label}
              </th>
              {periods.map((period) => (
                <td
                  key={`${row.label}-${period}`}
                  className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-foreground"
                >
                  {formatStatementCellValue(row.label, row.values[period])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
