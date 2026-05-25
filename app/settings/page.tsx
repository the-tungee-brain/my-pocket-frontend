"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { StrategyProfileEditor } from "@/components/StrategyProfileEditor";
import { useStrategyJourney } from "@/app/hooks/useStrategyJourney";
import type { StrategyFormValues } from "@/lib/strategyProfileForm";

export default function SettingsPage() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const {
    catalog,
    profile,
    loading,
    error,
    saveStrategySettings,
  } = useStrategyJourney(accessToken, { enabled: !!accessToken });

  const handleSave = async (values: StrategyFormValues) => {
    if (!values.primaryStrategy) return;
    await saveStrategySettings(values);
  };

  if (!accessToken) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-sm text-muted">
        Sign in to manage your strategy settings.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl pb-8">
      <div className="mb-6">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portfolio
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
          Settings
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">
          Investment strategy
        </h1>
        <p className="mt-1 text-sm text-muted">
          Update your strategy, symbols, risk preferences, and options settings.
          Changes apply to your journey checklist and recommendations.
        </p>
      </div>

      {loading && catalog.length === 0 ? (
        <p className="text-sm text-muted">Loading strategy settings…</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <StrategyProfileEditor
          accessToken={accessToken}
          catalog={catalog}
          profile={profile}
          onSave={handleSave}
        />
      )}

      {!profile?.onboardingCompletedAt && profile == null && !loading && (
        <p className="mt-4 text-sm text-muted">
          No strategy saved yet.{" "}
          <Link href="/onboarding" className="text-accent-strong hover:underline">
            Complete onboarding
          </Link>
        </p>
      )}
    </div>
  );
}
