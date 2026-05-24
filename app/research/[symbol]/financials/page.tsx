import { FinancialsPageContent } from "../FinancialsPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function FinancialsPage({ params }: PageProps) {
  const { symbol } = await params;

  return <FinancialsPageContent symbol={symbol} />;
}
