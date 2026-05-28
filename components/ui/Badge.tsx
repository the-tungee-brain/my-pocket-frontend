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
  default: "border-border bg-muted-bg text-foreground",
  accent: "border-accent/30 bg-accent-muted text-accent-strong",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning-muted text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  muted: "border-border bg-secondary/80 text-muted",
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
        "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
