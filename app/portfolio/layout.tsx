"use client";

import { Suspense } from "react";
import { AppShell } from "@/app/AppShell";
import { PortfolioSectionProvider } from "@/app/contexts/PortfolioSectionContext";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioSectionProvider>
      <Suspense fallback={null}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </PortfolioSectionProvider>
  );
}
