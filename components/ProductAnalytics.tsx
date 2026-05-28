"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { identify, track } from "@/lib/analytics";

export function ProductAnalytics() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const userId = session.user?.email ?? session.user?.id;
    if (!userId) return;

    identify(userId, {
      has_app_access: Boolean(session.accessToken),
    });

    const signInKey = `tomcrest_sign_in_${userId}`;
    if (!sessionStorage.getItem(signInKey)) {
      sessionStorage.setItem(signInKey, "1");
      track("sign_in_completed", {
        has_app_access: Boolean(session.accessToken),
      });
    }
  }, [session?.accessToken, session?.user?.email, session?.user?.id, status]);

  return null;
}
