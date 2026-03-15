import { FC, PropsWithChildren } from "react";

interface ThinkingSpinnerProps {
  message?: string;
}

export const ThinkingSpinner: FC<PropsWithChildren<ThinkingSpinnerProps>> = ({
  message = "Thinking",
}) => {
  return (
    <div className="mt-1 flex items-center gap-2 text-sm text-neutral-400">
      <span>{message}</span>
      <span className="flex items-center gap-1">
        <span className="h-1.25 w-1.25 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
        <span className="h-1.25 w-1.25 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
        <span className="h-1.25 w-1.25 animate-bounce rounded-full bg-neutral-400" />
      </span>
    </div>
  );
};
