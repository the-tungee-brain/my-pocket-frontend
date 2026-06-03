import { appSectionLabelClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type FinancialBulletListProps = {
  title: string;
  items: string[];
  variant?: "default" | "risk";
};

export function FinancialBulletList({
  title,
  items,
  variant = "default",
}: FinancialBulletListProps) {
  if (items.length === 0) return null;

  return (
    <section>
      <h3
        className={cn(
          appSectionLabelClass,
          variant === "risk" && "text-danger",
        )}
      >
        {title}
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-snug text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
