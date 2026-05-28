"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthogClient";

export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);

  return null;
}
