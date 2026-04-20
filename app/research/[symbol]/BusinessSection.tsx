"use client";

import { useBusinessDetails } from "@/app/hooks/useBusinessDetails";
import { Briefcase } from "lucide-react";
import { useSession } from "next-auth/react";

type BusinessSectionProps = {
  symbol: string | null;
  accessToken?: string | null;
};

export function BusinessSection({ symbol }: BusinessSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { business, isLoading, error } = useBusinessDetails(symbol, {
    accessToken,
  });

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Briefcase className="h-4 w-4 text-neutral-500" />
          How this business makes money
        </h3>
        <p className="text-sm text-neutral-500">Loading business details...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Briefcase className="h-4 w-4 text-neutral-500" />
          How this business makes money
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Briefcase className="h-4 w-4 text-neutral-500" />
        How this business makes money
      </h3>

      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {business.whatTheyDo}
      </p>

      <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-700 dark:text-neutral-300">
        {business.segments.map((seg) => (
          <li key={seg}>{seg}</li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {business.revenueNotes}
      </p>
    </section>
  );
}
