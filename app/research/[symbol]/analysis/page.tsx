import { ResearchAnalysisPageContent } from "../ResearchAnalysisPageContent";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function AnalysisPage({ params }: PageProps) {
  const { symbol } = await params;

  return <ResearchAnalysisPageContent symbol={symbol} />;
}
