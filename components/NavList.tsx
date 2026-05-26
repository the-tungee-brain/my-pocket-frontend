"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Link2,
  Loader2,
  Search,
  Star,
  X,
} from "lucide-react";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { useWatchlist } from "@/app/hooks/useWatchlist";
import { useToast } from "@/app/contexts/ToastContext";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { AlertBadge } from "./AlertBadge";
import type { SymbolAlertSummary } from "@/lib/intelligence";
import { symbolHubPath } from "@/lib/symbolRoutes";

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
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
}

const navItemActive =
  "border border-border bg-muted-bg text-foreground shadow-sm";
const navItemInactive =
  "border border-transparent text-muted hover:bg-muted-bg/60 hover:text-foreground";

export function NavList({
  loading,
  symbols,
  setSelectedSymbol,
  setSelectedView,
  containerClassName = "",
  portfolioButtonClassName = "",
  symbolButtonClassName = "",
  symbolAlertMap = {},
}: NavListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { symbols: watchlist, remove: removeFromWatchlist } = useWatchlist();
  const { showToast } = useToast();

  const {
    authorized: schwabAuthorized,
    loading: schwabLoading,
  } = useSchwabStatus();

  const {
    connect: connectSchwab,
    connecting: schwabConnecting,
    clearConnectError: clearSchwabConnectError,
  } = useSchwabConnect();

  const isPortfolio = pathname === "/portfolio";
  const isResearch = pathname.startsWith("/research");
  const { symbol: hubSymbol } = pathname.match(/^\/research\/([^/]+)/)
    ? { symbol: pathname.split("/")[2]?.toUpperCase() ?? null }
    : { symbol: null };
  const legacySymbol = pathname.startsWith("/portfolio/positions/")
    ? pathname.split("/").at(-1)?.toUpperCase() ?? null
    : null;
  const activeResearchSymbol = hubSymbol;

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

      <div className="mb-1 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Positions
          </span>
          {symbols.length > 0 && (
            <span className="rounded-full bg-muted-bg px-2 py-px text-[10px] text-muted">
              {symbols.length}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] text-muted/80">From Schwab</p>
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
          <p>Connect Schwab to load your holdings here.</p>
          {!schwabAuthorized && !schwabLoading && (
            <Button
              size="xs"
              variant="outline"
              className="mt-2 w-full"
              disabled={schwabConnecting}
              onClick={handleConnectSchwab}
            >
              {schwabConnecting ? "Connecting…" : "Connect Schwab"}
            </Button>
          )}
        </div>
      )}

      <div className="mt-1 flex-1 space-y-1 overflow-y-auto px-1">
        {symbols.map((sym) => {
          const isActive = hubSymbol === sym || legacySymbol === sym;
          const alertSummary = symbolAlertMap[sym];

          return (
            <div
              key={sym}
              className={cn(
                "group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-all",
                isActive ? navItemActive : navItemInactive,
              )}
            >
              <button
                type="button"
                disabled={loading}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setSelectedView("research");
                  setSelectedSymbol(null);
                  router.replace(symbolHubPath(sym, "position"));
                }}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 text-left",
                  symbolButtonClassName,
                )}
              >
                <CircleDollarSign
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-accent-strong" : "text-muted",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate font-mono">{sym}</span>
                {alertSummary && (
                  <AlertBadge summary={alertSummary} compact className="ml-auto" />
                )}
              </button>
              <button
                type="button"
                aria-label={`Research ${sym}`}
                title={`Research ${sym}`}
                onClick={() => {
                  setSelectedView("research");
                  setSelectedSymbol(null);
                  router.replace(symbolHubPath(sym, "overview"));
                }}
                className="shrink-0 rounded p-1 text-muted transition hover:bg-muted-bg hover:text-accent-strong"
              >
                <Search className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="my-3 h-px bg-border" />

      <div className="mb-1 px-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Watchlist
          </span>
          {watchlist.length > 0 && (
            <span className="rounded-full bg-muted-bg px-2 py-px text-[10px] text-muted">
              {watchlist.length}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] text-muted/80">Saved for research</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-background/50 px-3 py-3 text-[11px] text-muted">
          <p>Save symbols from Research to track them here.</p>
          {!isResearch && (
            <Link
              href="/research"
              className="mt-2 inline-flex text-xs font-medium text-accent-strong transition hover:underline"
            >
              Go to Research
            </Link>
          )}
        </div>
      ) : (
        <div className="mb-1 max-h-36 space-y-1 overflow-y-auto px-1">
          {watchlist.map((sym) => {
            const isActive = activeResearchSymbol === sym;

            return (
              <div
                key={sym}
                className={cn(
                  "group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-all",
                  isActive ? navItemActive : navItemInactive,
                )}
              >
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setSelectedView("research");
                    setSelectedSymbol(null);
                    router.replace(symbolHubPath(sym, "overview"));
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      isActive ? "fill-accent-strong text-accent-strong" : "text-muted",
                    )}
                    aria-hidden="true"
                  />
                  <span className="font-mono">{sym}</span>
                </button>
                <IconButton
                  size="sm"
                  aria-label={`Remove ${sym} from watchlist`}
                  onClick={() => {
                    removeFromWatchlist(sym);
                    showToast(`${sym} removed from watchlist`);
                  }}
                  className="hover:enabled:text-danger"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </IconButton>
              </div>
            );
          })}
        </div>
      )}

      {showSchwabStatus && (
        <div className="mt-auto shrink-0 border-t border-border px-1 pt-2">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
              schwabAuthorized
                ? "border-accent/25 bg-accent-muted/20"
                : "border-border bg-background/50",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                schwabAuthorized
                  ? "bg-accent-muted text-accent-strong"
                  : "bg-muted-bg text-muted",
              )}
            >
              {schwabLoading || schwabConnecting ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : schwabAuthorized ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-tight text-foreground">
                Schwab
              </p>
              <p className="truncate text-[10px] leading-tight text-muted">
                {schwabLoading
                  ? "Checking connection…"
                  : schwabConnecting
                    ? "Connecting…"
                    : schwabAuthorized
                      ? "Account linked"
                      : "Not linked"}
              </p>
            </div>

            {!schwabAuthorized && !schwabLoading && (
              <button
                type="button"
                disabled={schwabConnecting}
                onClick={handleConnectSchwab}
                className="shrink-0 rounded-md bg-accent-muted px-2 py-1 text-[10px] font-semibold text-accent-strong transition hover:bg-accent-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
