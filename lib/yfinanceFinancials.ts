import type { YFinanceFinancialLineItem } from "@/app/hooks/useFundamentals";
import { formatLargeUsd } from "@/lib/secUtils";

export function formatYfinancePeriod(iso: string): string {
  const parsed = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatStatementCellValue(
  label: string,
  value: number | null | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (/eps/i.test(label)) {
    return `$${value.toFixed(2)}`;
  }
  return formatLargeUsd(value);
}

export function statementHasData(
  rows: YFinanceFinancialLineItem[],
  periods: string[],
): boolean {
  return rows.some((row) =>
    periods.some((period) => row.values[period] != null),
  );
}
