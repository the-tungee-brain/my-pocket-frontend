"use client";

import { AppShell } from "@/app/AppShell";

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
