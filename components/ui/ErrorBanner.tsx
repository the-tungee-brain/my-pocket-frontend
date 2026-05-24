"use client";

import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div className={cn("space-y-3", className)} role="alert">
      <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
        {message}
      </p>
      {onRetry && (
        <Button size="xs" variant="outline" onClick={onRetry}>
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
