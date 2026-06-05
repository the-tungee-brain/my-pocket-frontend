"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { MomentumBreakoutAlertsPanel } from "@/components/momentum-breakout/MomentumBreakoutAlertsPanel";
import { useMomentumBreakoutFeatureFlags } from "@/app/hooks/useMomentumBreakoutFeatureFlags";
import { PageShell } from "@/components/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { appStackClass } from "@/lib/appUi";
import { getMomentumBreakoutDevFixture } from "@/lib/momentumBreakoutDevFixtures";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export default function MomentumBreakoutAlertsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const fixture = getMomentumBreakoutDevFixture(searchParams.get("mbFixture"));
  const accessToken =
    fixture?.accessToken ?? (session?.accessToken as string | undefined);
  const { flags, loading: flagsLoading } = useMomentumBreakoutFeatureFlags(
    fixture ? undefined : accessToken,
  );
  const effectiveFlags = fixture?.flags ?? flags;

  if (!fixture && (status === "loading" || flagsLoading)) {
    return (
      <PageShell className={appStackClass}>
        <Card className={pageSectionClass}>
          <CardBody className="text-sm text-muted">Loading…</CardBody>
        </Card>
      </PageShell>
    );
  }

  if (!accessToken) {
    return (
      <PageShell className={appStackClass}>
        <Card className={pageSectionClass}>
          <CardBody className="text-sm text-muted">
            Sign in to view your stock breakout watchlist.
          </CardBody>
        </Card>
      </PageShell>
    );
  }

  if (!effectiveFlags.alertsEnabled) {
    return (
      <PageShell className={appStackClass}>
        <Card className={pageSectionClass}>
          <CardBody className="space-y-2 text-sm text-muted">
            <p className="font-medium text-foreground">
              Stock breakout watchlist is temporarily unavailable.
            </p>
            <p>
              This feature is disabled for a controlled rollout. Check back
              later or contact support if you need access.
            </p>
          </CardBody>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className={cn(appStackClass, "pt-4 pb-10 sm:pt-6")}>
      <MomentumBreakoutAlertsPanel
        accessToken={accessToken}
        flags={effectiveFlags}
        fixture={fixture}
      />
    </PageShell>
  );
}
