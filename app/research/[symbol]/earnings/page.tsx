import { EarningsPageContent } from "../EarningsPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function EarningsPage({ params }: PageProps) {
  const { symbol } = await params;

  return <EarningsPageContent symbol={symbol} />;
}
