import { cn } from "@/lib/utils";
import { ACTIVE_LOGO_VARIANT, type LogoVariant } from "@/lib/brand";
import { TomcrestMark } from "./TomcrestMark";

type TomcrestLogoProps = {
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
  markClassName?: string;
};

const sizeStyles = {
  sm: {
    shell: "h-8 w-8 rounded-lg",
    mark: "h-4 w-4",
    title: "text-sm",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    shell: "h-9 w-9 rounded-lg",
    mark: "h-4 w-4",
    title: "text-sm",
    subtitle: "text-[11px]",
    gap: "gap-2.5",
  },
  lg: {
    shell: "h-11 w-11 rounded-xl",
    mark: "h-5 w-5",
    title: "text-base",
    subtitle: "text-xs",
    gap: "gap-3",
  },
} as const;

export function TomcrestLogo({
  variant = ACTIVE_LOGO_VARIANT,
  size = "md",
  showSubtitle = false,
  subtitle = "Portfolio workspace",
  className,
  markClassName,
}: TomcrestLogoProps) {
  const styles = sizeStyles[size];

  if (variant === "wordmark") {
    return (
      <div className={cn("flex min-w-0 flex-col", className)}>
        <TomcrestWordmark titleClassName={styles.title} />
        {showSubtitle && (
          <p className={cn("truncate text-muted", styles.subtitle)}>
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center", styles.gap, className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-accent/25 bg-gradient-to-br from-accent-muted to-transparent text-accent-strong shadow-[0_0_20px_color-mix(in_oklab,var(--accent)_15%,transparent)]",
          styles.shell,
        )}
      >
        <TomcrestMark
          variant={variant}
          className={cn(styles.mark, markClassName)}
        />
      </div>
      <div className="min-w-0">
        <TomcrestWordmark titleClassName={styles.title} />
        {showSubtitle && (
          <p className={cn("truncate text-muted", styles.subtitle)}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function TomcrestWordmark({
  titleClassName,
  className,
}: {
  titleClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "truncate font-semibold tracking-tight",
        titleClassName,
        className,
      )}
    >
      <span>Tom</span>
      <span className="text-accent-strong">crest</span>
    </div>
  );
}
