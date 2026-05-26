import type { AssetType } from "@/app/types/research";
import { cn } from "@/lib/utils";

const LABELS: Record<AssetType, string> = {
  STOCK: "Stock",
  ETF: "ETF",
  MUTUAL_FUND: "Fund",
  INDEX: "Index",
  CRYPTO: "Crypto",
  ADR: "ADR",
  BOND: "Bond",
  OPTION: "Option",
};

type Props = {
  assetType: AssetType;
  className?: string;
};

export function AssetTypeBadge({ assetType, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        assetType === "ETF"
          ? "border-accent/30 bg-accent-muted text-accent-strong"
          : "border-border bg-background text-muted",
        className,
      )}
    >
      {LABELS[assetType]}
    </span>
  );
}
