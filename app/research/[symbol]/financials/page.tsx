import { FileSpreadsheet } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { FundamentalsSection } from "../FundamentalsSection";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function FinancialsPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <ResearchSectionCard
      title="Fundamentals"
      description="Key financial metrics and what they mean for investors"
      icon={FileSpreadsheet}
    >
      <FundamentalsSection symbol={symbol} />
    </ResearchSectionCard>
  );
}
