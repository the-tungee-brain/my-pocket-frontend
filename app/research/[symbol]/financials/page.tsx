import { FileSpreadsheet } from "lucide-react";
import { ResearchComingSoon } from "../ResearchComingSoon";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function FinancialsPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <ResearchComingSoon
      symbol={symbol}
      title="Financial statements"
      description="Income statement, balance sheet, and cash flow"
      icon={FileSpreadsheet}
    />
  );
}
