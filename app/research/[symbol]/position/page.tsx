import { SymbolPositionContent } from "@/components/SymbolPositionContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function PositionPage({ params }: PageProps) {
  const { symbol } = await params;
  return <SymbolPositionContent symbol={symbol} />;
}
