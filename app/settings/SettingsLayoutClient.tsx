"use client";

import { Suspense } from "react";
import { AppShell } from "@/app/AppShell";

export function SettingsLayoutClient({
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
