import { FundamentalsPageContent } from "../FundamentalsPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function FinancialsPage({ params }: PageProps) {
  const { symbol } = await params;

  return <FundamentalsPageContent symbol={symbol} />;
}
