import { appKpiClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type Tone = "default" | "positive" | "negative" | "warning";

type KpiStatProps = {
  label: string;
  value: string;
  subValue?: string;
  tone?: Tone;
  variant?: "default" | "hero";
  className?: string;
};

const toneClass: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-success",
  negative: "text-danger",
  warning: "text-warning",
};

export function KpiStat({
  label,
  value,
  subValue,
  tone = "default",
  variant = "default",
  className,
}: KpiStatProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        isHero ? "app-kpi--hero min-w-0" : appKpiClass,
        className,
      )}
    >
      <p
        className={cn(
          "font-medium uppercase tracking-wide text-muted",
          isHero ? "text-xs" : "text-[10px]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "font-semibold tabular-nums",
          toneClass[tone],
          isHero ? "mt-1 text-3xl sm:text-4xl" : "mt-0.5 text-base sm:text-lg",
        )}
      >
        {value}
      </p>
      {subValue && (
        <p className={cn("mt-0.5 tabular-nums text-muted", isHero ? "text-sm" : "text-xs")}>
          {subValue}
        </p>
      )}
    </div>
  );
}
