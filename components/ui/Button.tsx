"use client";

import { cn } from "@/lib/utils";
import { forwardRef, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
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
          "flex h-12 w-full items-center justify-center cursor-pointer gap-2 rounded-xl px-5 text-base font-semibold transition-colors",

          variant === "default" &&
            "bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]",
          variant === "outline" &&
            "border border-input bg-background hover:bg-neutral-800 hover:text-white hover:border-neutral-400",
          variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",

          size === "sm" && "h-9 rounded-md px-3 text-sm",
          size === "lg" && "h-14 rounded-full px-8 text-lg",
          size === "default" && "h-12",

          isLoading && "cursor-not-allowed opacity-50",
          className,
        )}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
