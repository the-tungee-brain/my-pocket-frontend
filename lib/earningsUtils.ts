import { formatLargeUsd } from "./secUtils";

export type BeatLabel = "beat" | "miss" | "inline" | "pending";
export type EarningsTiming = "bmo" | "amc" | "dmh";

export function formatEps(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

export function formatSurprisePct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatRevenue(value: number | null | undefined): string {
  return formatLargeUsd(value);
}

export function beatLabelText(label: BeatLabel | null | undefined): string {
  switch (label) {
    case "beat":
      return "Beat";
    case "miss":
      return "Miss";
    case "inline":
      return "Inline";
    case "pending":
      return "Upcoming";
    default:
      return "—";
  }
}

export function timingLabel(timing: EarningsTiming | null | undefined): string {
  switch (timing) {
    case "bmo":
      return "Before market open";
    case "amc":
      return "After market close";
    case "dmh":
      return "During market hours";
    default:
      return "—";
  }
}

export function formatReportDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
