"use client";

type Props = {
  title?: string;
  subtitle?: string;
};

export function TopMoversHeader({
  title = "Top Movers",
  subtitle = "Precomputed 5-day excess vs SPY · refreshes every minute",
}: Props) {
  return (
    <header className="space-y-1">
      <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-muted">{subtitle}</p>
    </header>
  );
}
