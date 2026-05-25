// app/AppProviders.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { PositionsProvider } from "./Providers";
import { ToastProvider } from "./contexts/ToastContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <PositionsProvider>{children}</PositionsProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
