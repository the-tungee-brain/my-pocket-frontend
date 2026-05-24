"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/AuthPage";
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

function HomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
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
