"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  Layers,
  Link2,
  LogOut,
  RefreshCw,
  Shield,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { SchwabConnectionSettings } from "@/components/SchwabConnectionSettings";
import { AccountPlanCard } from "@/components/AccountPlanCard";
import {
  SettingsSectionTabBar,
  type SettingsTabId,
} from "@/components/SettingsSectionTabBar";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useDeleteAccount } from "@/app/hooks/useDeleteAccount";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import type { InvestmentStrategy } from "@/app/types/strategy";
import type { StrategyFormValues } from "@/lib/strategyProfileForm";
import { PageShell } from "@/components/PageShell";
import { cn } from "@/lib/utils";

const STRATEGY_ICONS: Record<InvestmentStrategy, typeof RefreshCw> = {
  wheel: RefreshCw,
  "csp-income": CircleDollarSign,
  "covered-call": TrendingUp,
  dividend: CircleDollarSign,
  "etf-core": Layers,
};

const StrategyProfileEditor = dynamic(
  () =>
    import("@/components/StrategyProfileEditor").then(
      (mod) => mod.StrategyProfileEditor,
    ),
  {
    loading: () => <SettingsPanelSkeleton />,
  },
);

function SettingsPanelSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

function parseSettingsTab(value: string | null): SettingsTabId | null {
  if (value === "connection" || value === "strategy" || value === "account") {
    return value;
  }
  return null;
}

export function SettingsPageContent() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTabId>("connection");

  const {
    catalog,
    profile,
    loading,
    error,
    saveStrategySettings,
  } = useStrategyContext();

  const { authorized, loading: schwabLoading } = useSchwabStatus();
  const { plan, loading: planLoading } = useAccountPlan(accessToken);
  const {
    deleteAccount,
    deleting: deletingAccount,
    deleteError,
    clearDeleteError,
  } = useDeleteAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const tab = parseSettingsTab(searchParams.get("tab"));
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = useCallback((tab: SettingsTabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", `${url.pathname}?${url.search}`);
  }, []);

  const handleSave = async (values: StrategyFormValues) => {
    if (!values.primaryStrategy) return;
    await saveStrategySettings(values);
  };

  const strategyLabel = useMemo(() => {
    if (!profile?.primaryStrategy) return null;
    return (
      catalog.find((item) => item.id === profile.primaryStrategy)?.title ??
      profile.primaryStrategy
    );
  }, [catalog, profile?.primaryStrategy]);

  const StrategyIcon = profile?.primaryStrategy
    ? STRATEGY_ICONS[profile.primaryStrategy]
    : null;

  if (!accessToken) {
    return (
      <PageShell className="py-8">
        <SettingsEmptyState message="Sign in to manage your account settings." />
      </PageShell>
    );
  }

  return (
    <PageShell className="pb-24 md:pb-8">
      <div className="mb-6">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to portfolio
        </Link>
      </div>

      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
          Settings
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">Account</h1>
        <p className="mt-1 text-sm text-muted">
          Brokerage connection, investment strategy, and account preferences.
        </p>
      </header>

      <div className="mb-6 grid gap-2 sm:grid-cols-2">
        <StatusChip
          icon={schwabLoading ? Link2 : authorized ? Check : Link2}
          label="Schwab"
          value={
            schwabLoading
              ? "Checking…"
              : authorized
                ? "Connected"
                : "Not connected"
          }
          active={authorized === true}
          onClick={() => handleTabChange("connection")}
        />
        <StatusChip
          icon={StrategyIcon ?? RefreshCw}
          label="Strategy"
          value={strategyLabel ?? (loading ? "Loading…" : "Not set up")}
          active={!!profile?.primaryStrategy}
          onClick={() => handleTabChange("strategy")}
        />
      </div>

      <SettingsSectionTabBar
        activeTab={activeTab}
        onChange={handleTabChange}
        className="mb-6"
      />

      {activeTab === "connection" && (
        <section aria-labelledby="settings-connection-heading">
          <SettingsSectionHeader
            id="settings-connection-heading"
            title="Brokerage connection"
            description="Link Schwab to sync positions, cash, and activity into Tomcrest."
          />
          <SchwabConnectionSettings />
        </section>
      )}

      {activeTab === "strategy" && (
        <section aria-labelledby="settings-strategy-heading">
          <SettingsSectionHeader
            id="settings-strategy-heading"
            title="Investment strategy"
            description="Your strategy drives the journey checklist, symbol picks, and portfolio guidance."
          />

          {loading && catalog.length === 0 ? (
            <SettingsPanelSkeleton />
          ) : error ? (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : !profile?.primaryStrategy && !loading ? (
            <Card surface="subtle" className="mx-0 p-5">
              <p className="text-sm text-foreground">No strategy saved yet</p>
              <p className="mt-1 text-sm text-muted">
                Complete onboarding to pick a strategy and watchlist symbols.
              </p>
              <Link
                href="/onboarding"
                className="mt-4 inline-flex h-8 items-center justify-center rounded-md bg-foreground px-3 text-xs font-semibold text-background transition hover:opacity-90"
              >
                Start onboarding
              </Link>
            </Card>
          ) : (
            <StrategyProfileEditor
              accessToken={accessToken}
              catalog={catalog}
              profile={profile}
              onSave={handleSave}
              variant="settings"
            />
          )}
        </section>
      )}

      {activeTab === "account" && (
        <section aria-labelledby="settings-account-heading" className="space-y-4">
          <SettingsSectionHeader
            id="settings-account-heading"
            title="Account & privacy"
            description="Plan, security details, and session controls."
          />

          <AccountPlanCard plan={plan} loading={planLoading} />

          <Card surface="subtle" className="mx-0">
            <CardBody className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted-bg text-muted">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Security & data access
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  Read-only Schwab OAuth, what we store, and how to disconnect.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                  <Link
                    href="/security"
                    className="text-accent-strong hover:underline"
                  >
                    Security overview
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-accent-strong hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-accent-strong hover:underline"
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
            </CardBody>
          </Card>

          <Card surface="subtle" className="mx-0">
            <CardBody className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Sign out</p>
                <p className="mt-0.5 text-sm text-muted">
                  End your Tomcrest session on this device.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
            </CardBody>
          </Card>

          <Card surface="subtle" className="mx-0 border-destructive/30">
            <CardBody className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Delete account
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Permanently remove your Tomcrest account, Schwab connection,
                    chat history, strategy settings, and portfolio data we store.
                    This cannot be undone.
                  </p>

                  {deleteError && (
                    <p className="mt-3 text-sm text-destructive">{deleteError}</p>
                  )}

                  {!confirmDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        clearDeleteError();
                        setConfirmDelete(true);
                      }}
                    >
                      Delete account
                    </Button>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={deletingAccount}
                        onClick={() => void deleteAccount()}
                      >
                        {deletingAccount ? "Deleting…" : "Yes, delete my account"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deletingAccount}
                        onClick={() => {
                          clearDeleteError();
                          setConfirmDelete(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      )}
    </PageShell>
  );
}

function SettingsSectionHeader({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 id={id} className="text-sm font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function StatusChip({
  icon: Icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: typeof Link2;
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
        active
          ? "border-accent/30 bg-accent-muted/20 hover:border-accent/40"
          : "border-border bg-secondary/40 hover:border-border/80",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-accent-muted text-accent-strong" : "bg-muted-bg text-muted",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </button>
  );
}

function SettingsEmptyState({ message }: { message: string }) {
  return (
    <Card surface="subtle" className="mx-0 px-4 py-8 text-center text-sm text-muted">
      {message}
    </Card>
  );
}
