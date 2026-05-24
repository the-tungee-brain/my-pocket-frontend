import { FC, PropsWithChildren } from "react";

interface ThinkingSpinnerProps {
  message?: string;
}

export const ThinkingSpinner: FC<PropsWithChildren<ThinkingSpinnerProps>> = ({
  message = "Thinking",
}) => {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted-bg/50 px-3 py-2.5">
      <div className="relative flex h-5 w-5 items-center justify-center">
        <span className="absolute h-5 w-5 animate-ping rounded-full bg-accent/20" />
        <span className="relative h-2 w-2 rounded-full bg-accent-strong" />
      </div>
      <span className="text-sm text-muted">{message}</span>
      <span className="flex items-center gap-1">
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-muted" />
      </span>
    </div>
  );
};
