import { FundamentalsPageContent } from "../FundamentalsPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function FundamentalsPage({ params }: PageProps) {
  const { symbol } = await params;

  return <FundamentalsPageContent symbol={symbol} />;
}
