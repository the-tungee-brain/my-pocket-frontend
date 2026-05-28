"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { capturePageLeave, capturePageView } from "@/lib/posthogClient";

export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const query = searchParams?.toString();
    const url = query
      ? `${window.location.origin}${pathname}?${query}`
      : `${window.location.origin}${pathname}`;

    if (lastUrl.current === url) {
      return;
    }

    lastUrl.current = url;
    capturePageView(url);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handlePageLeave = () => {
      if (!lastUrl.current) {
        return;
      }
      capturePageLeave(lastUrl.current);
    };

    window.addEventListener("pagehide", handlePageLeave);
    return () => window.removeEventListener("pagehide", handlePageLeave);
  }, []);

  return null;
}
