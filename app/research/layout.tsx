"use client";

import { AppShell } from "@/app/AppShell";

export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
