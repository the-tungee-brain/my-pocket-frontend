"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.accessToken) {
      router.replace("/portfolio");
    }
  }, [status, session?.accessToken, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center text-neutral-50">
        <p className="text-sm text-neutral-400">Loading…</p>
      </main>
    );
  }

  if (!session?.accessToken) {
    return <AuthPage />;
  }

  return null;
}
