"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LegacyMomentumBreakoutAlertsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/momentum-breakout?${query}` : "/momentum-breakout");
  }, [router, searchParams]);

  return null;
}
