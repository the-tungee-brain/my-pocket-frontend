import type { Metadata } from "next";
import { CompanySnapshot } from "./CompanySnapshot";
import { PerformanceSnapshot } from "./PerformanceSnapshot";
import { SummarySection } from "./SummarySection";
import { BusinessSection } from "./BusinessSection";

export const metadata: Metadata = {
  title: "Stock Research",
  description: "Readable research page for a single stock.",
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
  return (
    <>
      <SummarySection symbol={symbol} />
      <section className="space-y-8">
        <BusinessSection symbol={symbol} />
        <PerformanceSnapshot symbol={symbol} />
      </section>
    </>
  );
}
