"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { InvestmentThesis } from "@/app/hooks/useFundamentals";
import { cn } from "@/lib/utils";

type InvestmentThesisSectionProps = {
  thesis: InvestmentThesis | null | undefined;
};

function BulletColumn({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: typeof TrendingUp;
  tone: "bull" | "bear";
}) {
  if (!items.length) return null;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "bull" ? "text-success" : "text-danger",
          )}
          aria-hidden
        />
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </h4>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="text-sm leading-snug text-foreground before:mr-2 before:text-muted before:content-['•']"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InvestmentThesisSection({ thesis }: InvestmentThesisSectionProps) {
  if (!thesis) return null;

  const { bullCase, bearCase } = thesis;
  if (!bullCase.length && !bearCase.length) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <BulletColumn title="Bull case" items={bullCase} icon={TrendingUp} tone="bull" />
      <BulletColumn title="Bear case" items={bearCase} icon={TrendingDown} tone="bear" />
    </div>
  );
}
