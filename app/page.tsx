"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { useSession } from "next-auth/react";
import { resolveSchwabOAuthLandingPath } from "@/lib/schwabOAuthRedirect";

function RedirectingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute h-8 w-8 animate-ping bg-loading-accent" />
          <span className="relative h-3 w-3 bg-loading-highlight" />
        </div>
        <p className="text-sm text-muted">Loading…</p>
      </div>
    </main>
  );
}

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const landingPath = resolveSchwabOAuthLandingPath(params.get("status"));
    if (landingPath) {
      window.location.replace(landingPath);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("status")) return;

    if (session?.accessToken) {
      router.replace("/portfolio");
    }
  }, [status, session?.accessToken, router]);

  if (status === "loading") {
    return <RedirectingScreen />;
  }

  if (session?.accessToken) {
    return <RedirectingScreen />;
  }

  return <AuthPage />;
}

export default function Home() {
  return (
    <Suspense fallback={<RedirectingScreen />}>
      <HomeContent />
    </Suspense>
  );
}
