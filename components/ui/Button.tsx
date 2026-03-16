"use client";

import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "xs" | "sm" | "default" | "lg";
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
            "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
          variant === "outline" &&
            "border border-input bg-background hover:bg-neutral-800 hover:text-white hover:border-neutral-400",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",

          // sizes
          size === "xs" && "h-7 px-2 text-[11px] rounded-md",
          size === "sm" && "h-9 px-3 text-sm rounded-md",
          size === "default" && "h-10 px-4 text-sm rounded-lg",
          size === "lg" && "h-12 px-6 text-base rounded-xl",

          className,
        )}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {!isLoading && children}
        {isLoading && !children && <span className="sr-only">Loading</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
