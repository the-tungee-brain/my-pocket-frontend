import type { LucideIcon } from "lucide-react";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";

type Props = {
  symbol: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ResearchComingSoon({
  symbol,
  title,
  description,
  icon,
}: Props) {
  return (
    <ResearchSectionCard title={title} description={description} icon={icon}>
      <div className="py-6 text-center">
        <p className="text-sm text-foreground">
          {title} for{" "}
          <span className="font-mono font-semibold">{symbol.toUpperCase()}</span>{" "}
          is coming soon.
        </p>
        <p className="mt-1 text-xs text-muted">
          This tab will be available in a future update.
        </p>
      </div>
    </ResearchSectionCard>
  );
}
