import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function ResearchSymbolPage({ params }: PageProps) {
  const { symbol } = await params;
  redirect(`/research/${encodeURIComponent(symbol.toUpperCase())}/overview`);
}
