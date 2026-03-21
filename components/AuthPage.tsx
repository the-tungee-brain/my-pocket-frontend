"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <Button
          onClick={() => signIn("google")}
          className="sm:w-auto"
          size="default"
        >
          Sign in with Google
        </Button>
      </main>
    </div>
  );
}
