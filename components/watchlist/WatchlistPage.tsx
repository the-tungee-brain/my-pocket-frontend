"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FolderPlus, RefreshCw, Star } from "lucide-react";
import { useWatchlistContext } from "@/app/contexts/WatchlistContext";
import { WatchlistFolderSection } from "@/components/watchlist/WatchlistFolderSection";
import { SymbolSearchField } from "@/components/SymbolSearchField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/PageShell";
import { SkeletonList } from "@/components/ui/Skeleton";
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
    load,
    refreshQuotes,
    requestAddSymbol,
    dismissError,
    addFolder,
  } = useWatchlistContext();

  const [symbolQuery, setSymbolQuery] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

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

  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    addFolder(name);
    setNewFolderName("");
  };

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
          className={moversMetaCardClass}
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

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)]">
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
            <div className="space-y-2">
              <p className={moversMetaEyebrowClass}>New folder</p>
              <div className="flex gap-2">
                <input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  aria-label="New folder name"
                  className="min-h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFolder();
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFolder}
                  disabled={!newFolderName.trim()}
                  aria-label="Add folder"
                >
                  <FolderPlus className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isLoading={isLoading}
              onClick={() => void load({ includeQuotes: true })}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Reload
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void refreshQuotes()}
              disabled={symbols.length === 0}
            >
              Refresh quotes
            </Button>
            {isSyncing && <span className="text-xs text-muted">Saving…</span>}
          </div>
        </section>
      )}

      {isLoading && sortedFolderList.length === 0 && (
        <div className="app-panel p-4">
          <SkeletonList rows={4} rowClassName="h-14 rounded-lg" />
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
        <section className="rounded-xl border border-border bg-background/40">
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
            <div className="space-y-4 p-3 sm:p-4">
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
