"use client";

import { useBusinessDetails } from "@/app/hooks/useBusinessDetails";
import { useSession } from "next-auth/react";

type BusinessSectionProps = {
  symbol: string | null;
};

export function BusinessSection({ symbol }: BusinessSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { business, isLoading, error } = useBusinessDetails(symbol, {
    accessToken,
  });

  if (isLoading) {
    return <p className="text-sm text-muted">Loading business details…</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">{error}</p>;
  }

  if (!business) {
    return (
      <p className="text-sm text-muted">Business details are not available.</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground">
        {business.whatTheyDo}
      </p>

      <ul className="list-disc space-y-1.5 pl-4 text-sm text-foreground">
        {business.segments.map((seg) => (
          <li key={seg}>{seg}</li>
        ))}
      </ul>

      <p className="text-sm leading-relaxed text-muted">{business.revenueNotes}</p>
    </div>
  );
}
