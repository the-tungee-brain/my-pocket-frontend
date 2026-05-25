"use client";

import { AppShell } from "@/app/AppShell";
import { PortfolioSectionProvider } from "@/app/contexts/PortfolioSectionContext";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioSectionProvider>
      <AppShell>{children}</AppShell>
    </PortfolioSectionProvider>
  );
}
