import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ACTIVE_LOGO_VARIANT,
  BRAND_MARK_SRC,
  type LogoVariant,
} from "@/lib/brand";

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
    mark: "h-8 w-8 rounded-[10px]",
    title: "text-sm",
    subtitle: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    mark: "h-9 w-9 rounded-[10px]",
    title: "text-sm",
    subtitle: "text-[11px]",
    gap: "gap-2.5",
  },
  lg: {
    mark: "h-11 w-11 rounded-xl",
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
      <Image
        src={BRAND_MARK_SRC}
        alt=""
        width={512}
        height={512}
        unoptimized
        className={cn("shrink-0 object-contain", styles.mark, markClassName)}
        aria-hidden
        priority
      />
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
