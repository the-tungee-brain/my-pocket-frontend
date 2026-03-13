"use client";
import { signOut } from "next-auth/react";
import { Button } from "./ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome Home!</h1>
        <Button className="sm:w-auto" onClick={() => signOut()}>
          Log Out
        </Button>
      </header>
    </div>
  );
}
