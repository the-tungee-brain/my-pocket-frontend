import { EtfHoldingsPageContent } from "../EtfHoldingsPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function HoldingsPage({ params }: PageProps) {
  const { symbol } = await params;

  return <EtfHoldingsPageContent symbol={symbol} limit={25} />;
}
