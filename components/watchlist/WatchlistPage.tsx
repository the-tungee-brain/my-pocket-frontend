"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useWatchlistContext } from "@/app/contexts/WatchlistContext";
import { PageShell } from "@/components/PageShell";
import { SymbolSearchField } from "@/components/SymbolSearchField";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
import { WatchlistFolderSection } from "@/components/watchlist/WatchlistFolderSection";
import { appStackClass } from "@/lib/appUi";
import {
  moversMetaBodyClass,
  moversMetaCardClass,
  moversMetaEyebrowClass,
  moversMetaInsetClass,
  moversMetaTitleClass,
  moversRankedListLabelClass,
} from "@/lib/moversUi";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

export function WatchlistPage() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const {
    sortedFolderList,
    symbols,
    isLoading,
    isSyncing,
    error,
    isAuthenticated,
    requestAddSymbol,
    dismissError,
  } = useWatchlistContext();

  const [symbolQuery, setSymbolQuery] = useState("");

  const signedOut = status === "unauthenticated";
  const folderCount = sortedFolderList.length;
  const symbolCount = symbols.length;
  const syncLabel = signedOut
    ? "Local only"
    : isAuthenticated
      ? isSyncing
        ? "Saving"
        : "Synced"
      : "Offline";

  return (
    <PageShell className={cn(appStackClass, "pt-4 pb-8 sm:pt-6")}>
      <header className="space-y-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
          Watchlist
        </h1>
        <p className="text-sm text-muted">
          Saved symbols, folders, and live quote checks in one workspace.
        </p>
      </header>

      {signedOut && (
        <div className="app-panel space-y-2 px-4 py-3 text-sm text-muted">
          <p>
            Sign in to sync folders and quotes across devices. You can still
            save symbols locally from Research until then.
          </p>
          <Link
            href="/api/auth/signin"
            className="mt-2 inline-flex text-sm font-medium text-accent-strong hover:underline"
          >
            Sign in
          </Link>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={dismissError} />}

      {isAuthenticated && accessToken && (
        <section
          className={cn(moversMetaCardClass, "px-0")}
          aria-label="Watchlist controls"
        >
          <p className={moversMetaEyebrowClass}>Watchlist workspace</p>
          <h2 className={moversMetaTitleClass}>Folders built for scanning</h2>
          <p className={moversMetaBodyClass}>
            Add tickers, organize them by theme, then jump into Research when a
            quote or move deserves a closer look.
          </p>

          <dl
            className={cn(
              moversMetaInsetClass,
              "grid gap-2 text-xs sm:grid-cols-3",
            )}
          >
            <div>
              <dt className="text-muted">Folders</dt>
              <dd className="font-mono font-semibold text-foreground">
                {folderCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Symbols</dt>
              <dd className="font-mono font-semibold text-foreground">
                {symbolCount}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="font-mono font-semibold text-foreground">
                {syncLabel}
              </dd>
            </div>
          </dl>

          <div className="grid gap-3">
            <div className="space-y-2">
              <p className={moversMetaEyebrowClass}>Add symbol</p>
              <SymbolSearchField
                accessToken={accessToken}
                value={symbolQuery}
                onChange={setSymbolQuery}
                onSelect={(symbol) => {
                  requestAddSymbol(symbol);
                  setSymbolQuery(symbol);
                }}
                placeholder="Search symbol or company"
                limit={8}
              />
            </div>
          </div>
        </section>
      )}

      {isLoading && sortedFolderList.length === 0 && (
        <div className="app-panel p-4">
          <SkeletonList rows={4} rowClassName="h-14" />
        </div>
      )}

      {!isLoading && isAuthenticated && sortedFolderList.length === 0 && (
        <EmptyState
          icon={Star}
          title="No folders yet"
          description="Create a folder or add a symbol from search above. Symbols you saved locally before sign-in migrate on first load."
        />
      )}

      {!isAuthenticated && symbols.length === 0 && !isLoading && (
        <EmptyState
          icon={Star}
          title="No saved symbols"
          description="Star symbols on Research to track them here, or sign in for folders and live quotes."
          action={
            <Link
              href="/research"
              className="text-sm font-medium text-accent-strong hover:underline"
            >
              Go to Research
            </Link>
          }
        />
      )}

      {!isAuthenticated && symbols.length > 0 && (
        <section className="border border-border bg-background/40">
          <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
            Saved locally
          </h2>
          <ul className="divide-y divide-border/80">
            {symbols.map((sym) => (
              <li key={sym}>
                <Link
                  href={symbolHubPath(sym, "overview")}
                  className="flex px-4 py-3 font-mono text-sm font-semibold text-foreground hover:bg-muted-bg/40"
                >
                  {sym}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isAuthenticated && sortedFolderList.length > 0 && (
        <section className="app-stack">
          <div className="app-panel overflow-hidden">
            <p className={moversRankedListLabelClass}>Watchlist folders</p>
            <div className="space-y-4 py-3 sm:py-4">
              {sortedFolderList.map((folder) => (
                <WatchlistFolderSection key={folder.id} folder={folder} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}
