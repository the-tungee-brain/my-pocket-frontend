"use client";

import { Suspense } from "react";
import { AppShell } from "@/app/AppShell";
import { SignedInRedirect } from "@/components/SignedInRedirect";

export default function EmergingLeadersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <SignedInRedirect>
        <AppShell>{children}</AppShell>
      </SignedInRedirect>
    </Suspense>
  );
}
