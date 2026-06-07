"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function RedirectingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute h-8 w-8 animate-ping rounded-full bg-loading-accent" />
          <span className="relative h-3 w-3 rounded-full bg-loading-highlight" />
        </div>
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </main>
  );
}

export function SignedInRedirect({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const allowDevMomentumBreakoutFixture =
    process.env.NODE_ENV === "development" &&
    pathname === "/research/momentum-breakout-alerts" &&
    Boolean(searchParams.get("mbFixture"));

  useEffect(() => {
    if (allowDevMomentumBreakoutFixture) return;
    if (status === "loading") return;
    if (!session?.accessToken) {
      router.replace("/");
    }
  }, [allowDevMomentumBreakoutFixture, router, session?.accessToken, status]);

  if (allowDevMomentumBreakoutFixture) {
    return children;
  }

  if (status === "loading") {
    return <RedirectingScreen />;
  }

  if (!session?.accessToken) {
    return <RedirectingScreen />;
  }

  return children;
}
