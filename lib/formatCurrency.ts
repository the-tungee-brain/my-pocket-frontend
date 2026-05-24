export function formatUsd(
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  });
}

export function formatSignedUsd(value: number) {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${formatUsd(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
