"use client";

import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "icon";
  size?: "xs" | "sm" | "default" | "lg" | "icon";
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "sm",
      isLoading = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(
          // base
          "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",

          // variants
          variant === "default" &&
            "bg-foreground text-background hover:opacity-90",
          variant === "outline" &&
            "border border-border bg-background hover:bg-muted-bg hover:text-foreground",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "icon" &&
            "border-0 bg-transparent text-muted transition-opacity hover:enabled:opacity-70 active:enabled:opacity-50",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",

          // sizes
          size === "xs" && "h-7 px-2 text-[11px] rounded-md",
          size === "sm" && "h-9 px-3 text-sm rounded-md",
          size === "default" && "h-10 px-4 text-sm rounded-lg",
          size === "lg" && "h-12 px-6 text-base rounded-xl",
          size === "icon" && "h-8 w-8 p-0 rounded-md",

          className,
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        )}
        {children}
        {isLoading && !children && <span className="sr-only">Loading</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
