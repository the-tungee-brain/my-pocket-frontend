"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { symbolHubPath } from "@/lib/symbolRoutes";

type Props = {
  symbols: string[];
};

export function NewsHintBanner({ symbols }: Props) {
  const exampleSymbol = symbols[0];

  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-3 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-sm">
      <Newspaper
        className="mt-0.5 h-4 w-4 shrink-0 text-muted"
        aria-hidden="true"
      />
      <p className="text-muted">
        <span className="font-medium text-foreground">News is per symbol.</span>{" "}
        Pick a holding from the sidebar, then open the{" "}
        <span className="font-medium text-foreground">News</span> tab in the symbol hub.
        {exampleSymbol ? (
          <>
            {" "}
            For example,{" "}
            <Link
              href={symbolHubPath(exampleSymbol, "news")}
              className="font-medium text-accent-strong hover:underline"
            >
              view news for {exampleSymbol}
            </Link>
            .
          </>
        ) : null}
      </p>
    </div>
  );
}
