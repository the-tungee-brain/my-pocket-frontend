"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, Sprout, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/top-movers",
    label: "Top movers",
    sub: "Leaders now",
    icon: TrendingUp,
  },
  {
    href: "/emerging-leaders",
    label: "Emerging leaders",
    sub: "Pre-breakout setups",
    icon: Sprout,
  },
  {
    href: "/emerging-leaders-validation",
    label: "EL validation",
    sub: "Forward-return proof",
    icon: ClipboardCheck,
  },
] as const;

export function MoversSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Movers sections">
      {LINKS.map(({ href, label, sub, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-w-[9.5rem] flex-col border px-3 py-2 transition-colors",
              active
                ? "border-accent/40 bg-accent-muted/50 text-foreground"
                : "border-border bg-background/60 text-muted hover:border-border hover:bg-muted-bg/50 hover:text-foreground",
            )}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {label}
            </span>
            <span className="mt-0.5 text-[10px]">{sub}</span>
          </Link>
        );
      })}
    </nav>
  );
}
