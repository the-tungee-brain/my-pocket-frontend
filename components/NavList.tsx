"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BriefcaseBusiness,
  CircleDollarSign,
  Link2,
  Search,
  Star,
  Sprout,
  TrendingUp,
  Bell,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMomentumBreakoutFeatureFlags } from "@/app/hooks/useMomentumBreakoutFeatureFlags";
import { useWatchlist } from "@/app/hooks/useWatchlist";
import { useToast } from "@/app/contexts/ToastContext";
import { cn } from "@/lib/utils";
import { IconButton } from "./ui/IconButton";
import { SkeletonList } from "./ui/Skeleton";
import { EmptyState } from "./ui/EmptyState";
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
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
}

const navItemActive =
  "border border-border bg-muted-bg text-foreground shadow-sm";
const navItemInactive =
  "border border-transparent text-muted hover:bg-muted-bg/60 hover:text-foreground";

const navSectionHeaderClass = "mb-1 px-1";
const navSectionTitleClass =
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted";
const navSectionSubtitleClass = "mt-0.5 text-[10px] text-muted/80";
const navSymbolListClass = "space-y-1 overflow-y-auto px-1";
const navSymbolRowButtonClass =
  "flex w-full min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-left text-xs font-medium transition-all";
const navSymbolLabelClass = "min-w-0 flex-1 truncate font-mono text-xs";
/** Space for trailing icon actions (search, remove, alert badge). */
const navSymbolRowTrailingInset = "pr-[5.25rem]";
const navSymbolRowTrailingInsetCompact = "pr-11";
const navSymbolIconClass = (active: boolean) =>
  cn(
    "h-3.5 w-3.5 shrink-0",
    active ? "text-accent-strong" : "text-muted",
  );

export function NavList({
  loading,
  symbols,
  setSelectedSymbol,
  setSelectedView,
  containerClassName = "",
  portfolioButtonClassName = "",
  symbolAlertMap = {},
}: NavListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { flags: mbFlags } = useMomentumBreakoutFeatureFlags(accessToken);
  const { symbols: watchlist, remove: removeFromWatchlist } = useWatchlist();
  const { showToast } = useToast();

  const isPortfolio = pathname === "/portfolio";
  const isResearch = pathname.startsWith("/research");
  const isTopMovers = pathname.startsWith("/top-movers");
  const isEmergingLeaders = pathname.startsWith("/emerging-leaders");
  const isWatchlistPage = pathname === "/watchlist";
  const isMomentumBreakoutAlerts = pathname.startsWith(
    "/research/momentum-breakout-alerts",
  );
  const { symbol: hubSymbol } = pathname.match(/^\/research\/([^/]+)/)
    ? { symbol: pathname.split("/")[2]?.toUpperCase() ?? null }
    : { symbol: null };
  const legacySymbol = pathname.startsWith("/portfolio/positions/")
    ? pathname.split("/").at(-1)?.toUpperCase() ?? null
    : null;
  const activeResearchSymbol = hubSymbol;

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
        {isResearch && !isWatchlistPage && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        aria-current={isWatchlistPage ? "page" : undefined}
        onClick={() => {
          setSelectedView("research");
          setSelectedSymbol(null);
          router.replace("/watchlist");
        }}
        className={cn(
          "group mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isWatchlistPage ? navItemActive : navItemInactive,
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isWatchlistPage
              ? "border-accent/60 bg-accent-muted text-accent-strong"
              : "border-border bg-muted-bg text-muted",
          )}
        >
          <Star className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>Watchlist</span>
          <span className="truncate text-[10px] text-muted">
            Folders & live quotes
          </span>
        </div>
        {isWatchlistPage && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        aria-current={isTopMovers ? "page" : undefined}
        onClick={() => {
          setSelectedView("research");
          setSelectedSymbol(null);
          router.replace("/top-movers");
        }}
        className={cn(
          "group mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isTopMovers ? navItemActive : navItemInactive,
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isTopMovers
              ? "border-accent/60 bg-accent-muted text-accent-strong"
              : "border-border bg-muted-bg text-muted",
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>Top movers</span>
          <span className="truncate text-[10px] text-muted">Pipeline rankings</span>
        </div>
        {isTopMovers && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
        )}
      </button>

      <button
        type="button"
        disabled={loading}
        aria-current={isEmergingLeaders ? "page" : undefined}
        onClick={() => {
          setSelectedView("research");
          setSelectedSymbol(null);
          router.replace("/emerging-leaders");
        }}
        className={cn(
          "group mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
          isEmergingLeaders ? navItemActive : navItemInactive,
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
            isEmergingLeaders
              ? "border-accent/60 bg-accent-muted text-accent-strong"
              : "border-border bg-muted-bg text-muted",
          )}
        >
          <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span>Emerging leaders</span>
          <span className="truncate text-[10px] text-muted">
            Pre-breakout setups
          </span>
        </div>
        {isEmergingLeaders && (
          <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
        )}
      </button>

      {mbFlags.alertsEnabled && (
        <button
          type="button"
          disabled={loading}
          aria-current={isMomentumBreakoutAlerts ? "page" : undefined}
          onClick={() => {
            setSelectedView("research");
            setSelectedSymbol(null);
            router.replace("/research/momentum-breakout-alerts");
          }}
          className={cn(
            "group mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium transition-all",
            isMomentumBreakoutAlerts ? navItemActive : navItemInactive,
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-lg border text-[11px] font-semibold",
              isMomentumBreakoutAlerts
                ? "border-accent/60 bg-accent-muted text-accent-strong"
                : "border-border bg-muted-bg text-muted",
            )}
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span>MB trade plans</span>
            <span className="truncate text-[10px] text-muted">
              Active alerts & history
            </span>
          </div>
          {isMomentumBreakoutAlerts && (
            <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
          )}
        </button>
      )}

      <div className="my-3 h-px bg-border" />

      <div className={navSectionHeaderClass}>
        <div className="flex items-center justify-between">
          <span className={navSectionTitleClass}>Positions</span>
          {symbols.length > 0 && (
            <span className="rounded-full bg-muted-bg px-2 py-px text-[10px] text-muted">
              {symbols.length}
            </span>
          )}
        </div>
        <p className={navSectionSubtitleClass}>From Schwab</p>
      </div>

      {loading && (
        <SkeletonList
          rows={3}
          rowClassName="h-8 rounded-lg"
          className="px-2 py-2"
        />
      )}

      {!loading && symbols.length === 0 && (
        <div className="px-2">
          <EmptyState
            icon={Link2}
            title="No positions yet"
            description="Connect Schwab in Settings to import holdings. Read-only OAuth — your login credentials stay with Schwab."
            variant="solid"
            className="px-4 py-6"
            action={
              <Link
                href="/settings"
                className="inline-flex text-xs font-medium text-accent-strong transition hover:underline"
              >
                Go to Settings
              </Link>
            }
          />
        </div>
      )}

      <div className={cn("mt-1 min-h-0 flex-1", navSymbolListClass)}>
        {symbols.map((sym) => {
          const isActive = hubSymbol === sym || legacySymbol === sym;
          const alertSummary = symbolAlertMap[sym];

          return (
            <NavSymbolRow
              key={sym}
              sym={sym}
              isActive={isActive}
              loading={loading}
              icon={CircleDollarSign}
              iconClassName={navSymbolIconClass(isActive)}
              trailingInset={navSymbolRowTrailingInset}
              onSelect={() => {
                setSelectedView("research");
                setSelectedSymbol(null);
                router.replace(symbolHubPath(sym, "position"));
              }}
              trailing={
                <>
                  {alertSummary && (
                    <AlertBadge summary={alertSummary} compact className="mr-0.5" />
                  )}
                  <IconButton
                    size="sm"
                    aria-label={`Research ${sym}`}
                    title={`Research ${sym}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedView("research");
                      setSelectedSymbol(null);
                      router.replace(symbolHubPath(sym, "overview"));
                    }}
                    className="hover:enabled:text-accent-strong"
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  </IconButton>
                </>
              }
            />
          );
        })}
      </div>

      <div className="my-3 h-px bg-border" />

      <div className={navSectionHeaderClass}>
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/watchlist"
            className={cn(
              navSectionTitleClass,
              "transition hover:text-foreground",
              pathname === "/watchlist" && "text-foreground",
            )}
          >
            Watchlist
          </Link>
          {watchlist.length > 0 && (
            <span className="rounded-full bg-muted-bg px-2 py-px text-[10px] text-muted">
              {watchlist.length}
            </span>
          )}
        </div>
        <p className={navSectionSubtitleClass}>
          <Link
            href="/watchlist"
            className="text-accent-strong/90 transition hover:text-accent-strong hover:underline"
          >
            Folders & quotes
          </Link>
        </p>
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
        <div className={cn("mb-1 max-h-44", navSymbolListClass)}>
          {watchlist.map((sym) => {
            const isActive = activeResearchSymbol === sym;

            return (
              <NavSymbolRow
                key={sym}
                sym={sym}
                isActive={isActive}
                icon={Star}
                iconClassName={cn(
                  navSymbolIconClass(isActive),
                  isActive && "fill-accent-strong",
                )}
                trailingInset={navSymbolRowTrailingInsetCompact}
                onSelect={() => {
                  setSelectedView("research");
                  setSelectedSymbol(null);
                  router.replace(symbolHubPath(sym, "overview"));
                }}
                trailing={
                  <IconButton
                    size="sm"
                    aria-label={`Remove ${sym} from watchlist`}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFromWatchlist(sym);
                      showToast(`${sym} removed from watchlist`);
                    }}
                    className="hover:enabled:text-danger"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </IconButton>
                }
              />
            );
          })}
        </div>
      )}

    </div>
  );
}

function NavSymbolRow({
  sym,
  isActive,
  loading = false,
  icon: Icon,
  iconClassName,
  onSelect,
  trailing,
  trailingInset = navSymbolRowTrailingInset,
}: {
  sym: string;
  isActive: boolean;
  loading?: boolean;
  icon: typeof CircleDollarSign;
  iconClassName: string;
  onSelect: () => void;
  trailing?: ReactNode;
  trailingInset?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={loading}
        aria-current={isActive ? "page" : undefined}
        onClick={onSelect}
        className={cn(
          navSymbolRowButtonClass,
          trailing ? trailingInset : "pr-2.5",
          isActive ? navItemActive : navItemInactive,
        )}
      >
        <Icon className={iconClassName} aria-hidden="true" />
        <span className={navSymbolLabelClass}>{sym}</span>
      </button>
      {trailing ? (
        <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
          <div className="pointer-events-auto flex items-center gap-0.5">
            {trailing}
          </div>
        </div>
      ) : null}
    </div>
  );
}
