"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseBusiness, CircleDollarSign, Search } from "lucide-react";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { tabQuerySuffix, useTabs } from "@/app/contexts/TabContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { ErrorBanner } from "./ui/ErrorBanner";

export type MainView = "portfolio" | "symbol" | "research";

interface NavListProps {
  loading: boolean;
  symbols: string[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
  containerClassName?: string;
  portfolioButtonClassName?: string;
  symbolButtonClassName?: string;
}

const navItemActive =
  "bg-muted-bg text-foreground shadow-sm ring-1 ring-border";
const navItemInactive = "text-muted hover:bg-muted-bg/60 hover:text-foreground";

export function NavList({
  loading,
  symbols,
  setSelectedSymbol,
  setSelectedView,
  containerClassName = "",
  portfolioButtonClassName = "",
  symbolButtonClassName = "",
}: NavListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeTab } = useTabs();

  const {
    authorized: schwabAuthorized,
    loading: schwabLoading,
    error: schwabStatusError,
    refetch: refetchSchwabStatus,
  } = useSchwabStatus();

  const {
    connect: connectSchwab,
    connecting: schwabConnecting,
    connectError: schwabConnectError,
    clearConnectError: clearSchwabConnectError,
  } = useSchwabConnect();

  const isPortfolio = pathname === "/portfolio";
  const isResearch = pathname.startsWith("/research");
  const activeSymbol = pathname.startsWith("/portfolio/positions/")
    ? pathname.split("/").at(-1)
    : null;

  const showSchwabStatus =
    schwabAuthorized !== null && schwabAuthorized !== undefined;

  const handleConnectSchwab = () => {
    clearSchwabConnectError();
    void connectSchwab();
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl bg-secondary/60 py-3",
        containerClassName,
      )}
    >
      <button
        type="button"
        disabled={loading}
        aria-current={isPortfolio ? "page" : undefined}
        onClick={() => {
          setSelectedView("portfolio");
          setSelectedSymbol(null);
          router.replace("/portfolio");
        }}
        className={cn(
          "group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isPortfolio ? navItemActive : navItemInactive,
          portfolioButtonClassName,
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isPortfolio
              ? "border-accent/60 bg-accent-muted text-accent-strong"
              : "border-border bg-muted-bg text-muted",
          )}
        >
          <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>My portfolio</span>
          <span className="truncate text-[10px] text-muted">Overview</span>
        </div>
        {isPortfolio && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        aria-current={isResearch ? "page" : undefined}
        onClick={() => {
          setSelectedView("research");
          setSelectedSymbol(null);
          router.replace("/research");
        }}
        className={cn(
          "group mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isResearch ? navItemActive : navItemInactive,
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isResearch
              ? "border-accent/60 bg-accent-muted text-accent-strong"
              : "border-border bg-muted-bg text-muted",
          )}
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>Research</span>
          <span className="truncate text-[10px] text-muted">
            Company snapshots
          </span>
        </div>
        {isResearch && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
        )}
      </button>

      <div className="my-3 h-px bg-border" />

      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Positions
        </span>
        {symbols.length > 0 && (
          <span className="rounded-full bg-muted-bg px-2 py-px text-[10px] text-muted">
            {symbols.length}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-2 px-2 py-2">
          <div className="h-8 animate-pulse rounded-lg bg-muted-bg" />
          <div className="h-8 animate-pulse rounded-lg bg-muted-bg/80" />
          <div className="h-8 animate-pulse rounded-lg bg-muted-bg/60" />
        </div>
      )}

      {!loading && symbols.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-background/50 px-3 py-3 text-[11px] text-muted">
          Connect Schwab to load your holdings here.
        </div>
      )}

      <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1">
        {symbols.map((sym) => {
          const isActive = activeSymbol === sym;

          return (
            <button
              key={sym}
              type="button"
              disabled={loading}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                setSelectedView("symbol");
                setSelectedSymbol(sym);
                router.replace(`/portfolio/positions/${sym}${tabQuerySuffix(activeTab)}`);
              }}
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-all",
                isActive ? navItemActive : navItemInactive,
                symbolButtonClassName,
              )}
            >
              <span className="flex items-center gap-2">
                <CircleDollarSign
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-accent-strong" : "text-muted",
                  )}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs">{sym}</span>
              </span>

              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
              )}
            </button>
          );
        })}
      </div>

      {showSchwabStatus && (
        <>
          <div className="mt-3 h-px bg-border" />
          <div className="mt-2 px-4 text-[11px]">
            {schwabStatusError && (
              <ErrorBanner
                message={schwabStatusError}
                onRetry={refetchSchwabStatus}
                className="mb-2"
              />
            )}

            {schwabConnectError && (
              <ErrorBanner
                message={schwabConnectError}
                onRetry={handleConnectSchwab}
                className="mb-2"
              />
            )}

            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Schwab
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                  schwabAuthorized
                    ? "bg-accent-muted text-accent-strong"
                    : "border border-border bg-muted-bg text-muted",
                )}
              >
                {schwabLoading
                  ? "Checking…"
                  : schwabAuthorized
                    ? "Connected"
                    : "Not connected"}
              </span>
            </div>

            {!schwabAuthorized && !schwabLoading && (
              <Button
                size="xs"
                variant="outline"
                className="w-full"
                disabled={schwabConnecting}
                onClick={handleConnectSchwab}
              >
                {schwabConnecting ? "Connecting…" : "Connect"}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
