import { ResearchSymbolShell } from "./ResearchSymbolShell";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ symbol: string }>;
};

export default async function ResearchSymbolLayout({
  children,
  params,
}: LayoutProps) {
  const { symbol } = await params;

  return <ResearchSymbolShell symbol={symbol}>{children}</ResearchSymbolShell>;
}
