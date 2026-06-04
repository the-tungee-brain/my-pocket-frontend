"use client";

import { useSession } from "next-auth/react";
import { MomentumBreakoutAlertsPanel } from "@/components/momentum-breakout/MomentumBreakoutAlertsPanel";
import { useMomentumBreakoutFeatureFlags } from "@/app/hooks/useMomentumBreakoutFeatureFlags";
import { PageShell } from "@/components/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";

export default function MomentumBreakoutAlertsPage() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { flags, loading: flagsLoading } = useMomentumBreakoutFeatureFlags(
    accessToken,
  );

  if (status === "loading" || flagsLoading) {
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

  if (!flags.alertsEnabled) {
    return (
      <PageShell className={appStackClass}>
        <Card className={pageSectionClass}>
          <CardBody className="space-y-2 text-sm text-muted">
            <p className="font-medium text-foreground">
              Stock breakout watchlist is temporarily unavailable.
            </p>
            <p>
              This feature is disabled for a controlled rollout. Check back later
              or contact support if you need access.
            </p>
          </CardBody>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className={appStackClass}>
      <MomentumBreakoutAlertsPanel accessToken={accessToken} />
    </PageShell>
  );
}
