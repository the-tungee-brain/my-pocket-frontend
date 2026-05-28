import { Suspense } from "react";
import { WheelBacktestPageContent } from "@/components/WheelBacktestPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function WheelBacktestPage({ params }: PageProps) {
  const { symbol } = await params;
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted">Loading wheel backtest…</p>
      }
    >
      <WheelBacktestPageContent symbol={symbol} />
    </Suspense>
  );
}
