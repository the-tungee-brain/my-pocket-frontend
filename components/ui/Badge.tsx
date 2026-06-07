import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "muted";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClass: Record<BadgeVariant, string> = {
  default: "border-border bg-transparent text-foreground",
  accent: "border-border bg-transparent text-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning-muted text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  muted: "border-border bg-transparent text-muted",
};

export function Badge({
  children,
  variant = "default",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
