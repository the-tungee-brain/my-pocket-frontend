import { TrendingUp } from "lucide-react";
import { ResearchComingSoon } from "../ResearchComingSoon";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function EarningsPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <ResearchComingSoon
      symbol={symbol}
      title="Earnings"
      description="Quarterly results, EPS trends, and earnings surprises"
      icon={TrendingUp}
    />
  );
}
