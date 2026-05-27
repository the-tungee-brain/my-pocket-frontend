"use client";

import { Suspense } from "react";
import { AppShell } from "@/app/AppShell";
import { SignedInRedirect } from "@/components/SignedInRedirect";
import { PortfolioSectionProvider } from "@/app/contexts/PortfolioSectionContext";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortfolioSectionProvider>
      <Suspense fallback={null}>
        <SignedInRedirect>
          <AppShell>{children}</AppShell>
        </SignedInRedirect>
      </Suspense>
    </PortfolioSectionProvider>
  );
}
