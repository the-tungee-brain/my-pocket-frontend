"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorBanner({ message, onRetry, className }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border border-danger/25 border-l-[3px] border-l-danger bg-danger/5 px-4 py-3",
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-danger"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button
          size="xs"
          variant="outline"
          onClick={onRetry}
          className="self-start border-danger/30 hover:border-danger/50"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
