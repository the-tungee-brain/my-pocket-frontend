"use client";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
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
