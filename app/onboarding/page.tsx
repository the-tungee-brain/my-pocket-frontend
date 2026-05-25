"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StrategyOnboardingWizard } from "@/components/StrategyOnboardingWizard";
import { useStrategyJourney } from "@/app/hooks/useStrategyJourney";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const {
    catalog,
    chooseStrategy,
    completeOnboarding,
    saveProfile,
    loading,
  } = useStrategyJourney(accessToken, { enabled: !!accessToken });

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-muted">
        Sign in to set up your investing strategy.
      </div>
    );
  }

  if (loading && catalog.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-muted">
        Loading strategies…
      </div>
    );
  }

  return (
    <StrategyOnboardingWizard
      accessToken={accessToken}
      catalog={catalog}
      onSaveDraft={async (payload) => {
        if (!payload.primaryStrategy) return;
        await chooseStrategy(payload.primaryStrategy);
        await saveProfile(payload);
      }}
      onComplete={async (payload) => {
        if (!payload.primaryStrategy) return;
        await chooseStrategy(payload.primaryStrategy);
        await completeOnboarding(payload);
        router.replace("/portfolio");
      }}
      onClose={() => router.replace("/portfolio")}
    />
  );
}
