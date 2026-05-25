export function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatFriendlyDate(
  value: string,
  options: { weekday?: boolean; alwaysShowYear?: boolean } = {},
): string {
  const date = parseDateInput(value);
  if (!date) return value;

  const now = new Date();
  const showYear =
    options.alwaysShowYear ?? date.getFullYear() !== now.getFullYear();

  return date.toLocaleDateString(undefined, {
    weekday: options.weekday ? "short" : undefined,
    month: "short",
    day: "numeric",
    year: showYear ? "numeric" : undefined,
  });
}

/** Option expirations: weekday, full date, and days-to-expiration when near-term. */
export function formatOptionExpiration(value: string): string {
  const date = parseDateInput(value);
  if (!date) return value;

  const label = formatFriendlyDate(value, {
    weekday: true,
    alwaysShowYear: true,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expirationDay = new Date(date);
  expirationDay.setHours(0, 0, 0, 0);
  const daysToExpiration = Math.round(
    (expirationDay.getTime() - today.getTime()) / 86_400_000,
  );

  if (daysToExpiration === 0) return `${label} · expires today`;
  if (daysToExpiration === 1) return `${label} · 1 day left`;
  if (daysToExpiration > 1 && daysToExpiration <= 45) {
    return `${label} · ${daysToExpiration} days left`;
  }
  if (daysToExpiration < 0) return `${label} · expired`;

  return label;
}
