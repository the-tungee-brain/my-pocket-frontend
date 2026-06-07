"use client";

import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { iconButtonTransitionClass } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";

export const compactTextButtonClass =
  "inline-flex h-7 items-center gap-1 px-2 text-[11px] font-semibold text-muted transition hover:bg-muted-bg hover:text-foreground";

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
          "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",

          // variants
          variant === "default" &&
            "bg-foreground text-background hover:bg-foreground/90",
          variant === "outline" &&
            "border border-border bg-transparent text-foreground hover:bg-muted-bg",
          variant === "ghost" &&
            "bg-transparent text-foreground hover:bg-muted-bg active:bg-muted-bg/80",
          variant === "icon" &&
            cn(
              "border-0 bg-transparent text-muted",
              iconButtonTransitionClass,
              "hover:enabled:bg-muted-bg hover:enabled:text-foreground active:enabled:bg-muted-bg/80",
            ),
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",

          // sizes
          size === "xs" && "h-7 px-2 text-[11px]",
          size === "sm" && "h-9 px-3 text-sm",
          size === "default" && "h-10 px-4 text-sm",
          size === "lg" && "h-12 px-6 text-base",
          size === "icon" && "h-8 w-8 p-0",

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
