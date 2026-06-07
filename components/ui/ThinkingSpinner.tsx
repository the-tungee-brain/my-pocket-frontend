import type { FC, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

interface ThinkingSpinnerProps {
  message?: string;
  className?: string;
}

export const ThinkingSpinner: FC<PropsWithChildren<ThinkingSpinnerProps>> = ({
  message = "Thinking",
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex items-center gap-3 bg-loading-base/70 px-3 py-2.5",
        className,
      )}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-ping bg-loading-accent motion-reduce:animate-none motion-reduce:opacity-40" />
        <span className="relative h-2 w-2 bg-loading-highlight" />
      </div>
      <span className="text-sm text-muted">{message}</span>
      <span className="sr-only">{message}</span>
      <span className="flex items-center gap-1 motion-reduce:hidden">
        <span className="h-1 w-1 animate-bounce bg-loading-highlight [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce bg-loading-highlight [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce bg-loading-highlight" />
      </span>
    </div>
  );
};
