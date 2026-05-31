/** Trading-day DTE presets (backtest holds each leg this many sessions). */
export const WHEEL_BACKTEST_DTE_PRESETS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "1 month" },
  { value: 90, label: "3 months" },
] as const;

export type WheelBacktestDteDays =
  (typeof WHEEL_BACKTEST_DTE_PRESETS)[number]["value"];

export const DEFAULT_WHEEL_BACKTEST_DTE_DAYS: WheelBacktestDteDays = 30;

export function isWheelBacktestDteDays(
  value: number,
): value is WheelBacktestDteDays {
  return WHEEL_BACKTEST_DTE_PRESETS.some((preset) => preset.value === value);
}

export function normalizeWheelBacktestDteDays(
  raw: number | null | undefined,
): WheelBacktestDteDays | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  if (isWheelBacktestDteDays(raw)) return raw;
  const legacy: Record<number, WheelBacktestDteDays> = {
    5: 7,
    10: 14,
    21: 14,
    45: 30,
    63: 90,
  };
  return legacy[raw] ?? null;
}

export function wheelBacktestDteLabel(days: number): string {
  const preset = WHEEL_BACKTEST_DTE_PRESETS.find((p) => p.value === days);
  if (preset) {
    return `${preset.label} (${preset.value} trading days)`;
  }
  return `${days} trading days`;
}
