"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

function RedirectingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute h-8 w-8 animate-ping rounded-full bg-accent/20" />
          <span className="relative h-3 w-3 rounded-full bg-accent-strong" />
        </div>
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </main>
  );
}

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

  if (status === "loading") {
    return <RedirectingScreen />;
  }

  if (!session?.accessToken) {
    return <RedirectingScreen />;
  }

  return children;
}
