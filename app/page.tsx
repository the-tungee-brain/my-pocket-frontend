"use client";

import AuthPage from "@/components/AuthPage";
import HomePage from "@/components/HomePage";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  if (session?.accessToken) {
    return <HomePage />;
  }

  return <AuthPage />;
}
