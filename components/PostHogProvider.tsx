"use client";

import { useEffect } from "react";
import { initPostHogClient } from "@/lib/posthogClient";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void initPostHogClient();
  }, []);

  return children;
}
