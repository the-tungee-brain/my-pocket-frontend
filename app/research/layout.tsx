"use client";

import { Suspense } from "react";
import { AppShell } from "@/app/AppShell";

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
