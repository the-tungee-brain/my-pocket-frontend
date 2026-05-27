import { SymbolOptionsContent } from "@/components/SymbolOptionsContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function OptionsPage({ params }: PageProps) {
  const { symbol } = await params;
  return <SymbolOptionsContent symbol={symbol} />;
}
