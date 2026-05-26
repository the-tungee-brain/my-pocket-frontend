import { FC, PropsWithChildren } from "react";
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
      className={cn(
        "flex items-center gap-3 rounded-lg bg-muted-bg/50 px-3 py-2.5",
        className,
      )}
    >
      <div className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-ping rounded-full bg-accent/20 motion-reduce:animate-none motion-reduce:opacity-40" />
        <span className="relative h-2 w-2 rounded-full bg-accent-strong" />
      </div>
      <span className="text-sm text-muted">{message}</span>
      <span className="flex items-center gap-1 motion-reduce:hidden">
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted" />
      </span>
    </div>
  );
};
