import { BriefcaseBusiness } from "lucide-react";
import { BusinessSection } from "../BusinessSection";

type PageProps = {
  params: Promise<{ symbol: string }>;
};

export default async function BusinessPage({ params }: PageProps) {
  const { symbol } = await params;

  return <BusinessSection symbol={symbol} />;
}
