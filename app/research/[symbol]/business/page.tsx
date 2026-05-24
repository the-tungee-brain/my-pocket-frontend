import { BriefcaseBusiness } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { BusinessSection } from "../BusinessSection";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function BusinessPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <ResearchSectionCard
      title="How this business makes money"
      description="Revenue model, segments, and business drivers"
      icon={BriefcaseBusiness}
    >
      <BusinessSection symbol={symbol} />
    </ResearchSectionCard>
  );
}
