import { DividendsPageContent } from "../DividendsPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function DividendsPage({ params }: PageProps) {
  const { symbol } = await params;

  return <DividendsPageContent symbol={symbol} />;
}
