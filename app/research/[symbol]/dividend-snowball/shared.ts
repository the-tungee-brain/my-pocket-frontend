"use client";

import { useEffect, useState } from "react";
import type { DividendScenarioParams } from "@/app/types/research";

export const BAR_FILL = "#34d399";
export const BAR_FILL_PARTIAL = "#6ee7b7";
export const LINE_STROKE = "#34d399";
export const GRID_STROKE = "currentColor";

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export function formatPerShare(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}

export function formatSnowballShares(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function roundSnowball(value: number): number {
  return Math.round(value * 100) / 100;
}

type SnowballNumericInputProps = {
  value: number | null | undefined;
  onCommit: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function SnowballNumericInput({
  value,
  onCommit,
  min,
  max,
  step,
  className,
}: SnowballNumericInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;
    setText(value != null && value > 0 ? String(roundSnowball(value)) : "");
  }, [value, isFocused]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        const trimmed = text.trim();
        if (trimmed === "") {
          setText(value != null && value > 0 ? String(roundSnowball(value)) : "");
          return;
        }
        const next = Number(trimmed);
        if (Number.isFinite(next) && next > 0) {
          onCommit(next);
          setText(String(roundSnowball(next)));
          return;
        }
        setText(value != null && value > 0 ? String(roundSnowball(value)) : "");
      }}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        const trimmed = nextText.trim();
        if (trimmed === "") return;
        const next = Number(trimmed);
        if (Number.isFinite(next) && next > 0) {
          onCommit(next);
        }
      }}
      className={className}
    />
  );
}

export type SnowballInputSource = "investment" | "shares";

export function buildScenarioParams(
  base: DividendScenarioParams | undefined,
  source: SnowballInputSource,
  values: {
    investmentUsd?: number | null;
    sharePrice?: number | null;
    shares?: number | null;
    projectYears?: number | null;
    dividendCagrPct?: number | null;
    reinvestDividends?: boolean;
    priceCagrPct?: number | null;
  },
): DividendScenarioParams {
  const sharePrice = values.sharePrice ?? base?.sharePrice ?? null;
  const reinvestDividends = values.reinvestDividends ?? base?.reinvestDividends ?? false;
  const priceCagrPct = values.priceCagrPct ?? base?.priceCagrPct ?? null;
  const projectYears = values.projectYears ?? base?.projectYears ?? 10;
  const dividendCagrPct = values.dividendCagrPct ?? base?.dividendCagrPct ?? null;

  if (sharePrice != null && sharePrice > 0) {
    if (source === "shares" && values.shares != null && values.shares > 0) {
      const shares = roundSnowball(values.shares);
      return {
        investmentUsd: roundSnowball(shares * sharePrice),
        sharePrice: roundSnowball(sharePrice),
        shares,
        projectYears,
        dividendCagrPct,
        reinvestDividends,
        priceCagrPct,
      };
    }

    if (values.investmentUsd != null && values.investmentUsd > 0) {
      const investmentUsd = roundSnowball(values.investmentUsd);
      return {
        investmentUsd,
        sharePrice: roundSnowball(sharePrice),
        shares: roundSnowball(investmentUsd / sharePrice),
        projectYears,
        dividendCagrPct,
        reinvestDividends,
        priceCagrPct,
      };
    }
  }

  return {
    investmentUsd: values.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice,
    shares: values.shares ?? base?.shares ?? null,
    projectYears,
    dividendCagrPct,
    reinvestDividends,
    priceCagrPct,
  };
}

export function mergeScenarioParams(
  base: DividendScenarioParams | undefined,
  next: Partial<DividendScenarioParams>,
): DividendScenarioParams {
  return {
    investmentUsd: next.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice: next.sharePrice ?? base?.sharePrice ?? null,
    shares: next.shares ?? base?.shares ?? null,
    projectYears: next.projectYears ?? base?.projectYears ?? 10,
    dividendCagrPct: next.dividendCagrPct ?? base?.dividendCagrPct ?? null,
    reinvestDividends: next.reinvestDividends ?? base?.reinvestDividends ?? false,
    priceCagrPct: next.priceCagrPct ?? base?.priceCagrPct ?? null,
  };
}

export function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatAxisYear(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 4);
  return String(parsed.getFullYear());
}

export const DEFAULT_PADDING = {
  top: 16,
  right: 12,
  bottom: 28,
  left: 40,
} as const;
