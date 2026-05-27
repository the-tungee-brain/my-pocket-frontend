"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { identify, track } from "@/lib/analytics";

export function ProductAnalytics() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.accessToken) return;

    const userId = session.user?.email ?? session.user?.id;
    if (userId) {
      identify(userId);
      const signInKey = `tomcrest_sign_in_${userId}`;
      if (!sessionStorage.getItem(signInKey)) {
        sessionStorage.setItem(signInKey, "1");
        track("sign_in_completed");
      }
    }
  }, [session?.accessToken, session?.user?.email, session?.user?.id, status]);

  return null;
}
