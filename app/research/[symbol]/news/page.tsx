import { SymbolNewsContent } from "@/components/SymbolNewsContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function NewsPage({ params }: PageProps) {
  const { symbol } = await params;
  return <SymbolNewsContent symbol={symbol} />;
}
