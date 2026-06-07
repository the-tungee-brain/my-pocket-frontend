"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const iconButtonTransitionClass =
  "transition-[color,background-color] duration-200 ease-out";

export const iconButtonClass = [
  "inline-flex shrink-0 items-center justify-center border-0 bg-transparent text-muted",
  iconButtonTransitionClass,
  "hover:enabled:bg-muted-bg hover:enabled:text-foreground active:enabled:bg-muted-bg/80",
  "disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md";
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        iconButtonClass,
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        className,
      )}
      {...props}
    />
  ),
);

IconButton.displayName = "IconButton";
