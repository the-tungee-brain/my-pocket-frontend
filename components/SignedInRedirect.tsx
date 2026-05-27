"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function SignedInRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.accessToken) {
      router.replace("/");
    }
  }, [router, session?.accessToken, status]);

  if (status === "loading" || !session?.accessToken) {
    return null;
  }

  return children;
}
