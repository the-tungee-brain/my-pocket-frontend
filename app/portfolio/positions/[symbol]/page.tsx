import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function LegacyPortfolioSymbolRedirect({ params }: PageProps) {
  const { symbol } = await params;
  redirect(`/research/${encodeURIComponent(symbol.trim().toUpperCase())}/position`);
}
