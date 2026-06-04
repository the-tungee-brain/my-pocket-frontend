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
import { pageSectionClass } from "@/lib/pageLayout";
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

  const handleAddFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    addFolder(name);
    setNewFolderName("");
  };

  return (
    <PageShell className={cn(appStackClass, pageSectionClass, "pt-4 pb-8 sm:pt-6")}>
      <header className="space-y-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Watchlist
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Save symbols into folders, synced with your account — same workspace as
          the iOS app.
        </p>
      </header>

      {signedOut && (
        <div className="rounded-xl border border-border bg-muted-bg/30 px-4 py-3 text-sm text-muted">
          <p>
            Sign in to sync folders and quotes across devices. You can still save
            symbols locally from Research until then.
          </p>
          <Link
            href="/api/auth/signin"
            className="mt-2 inline-flex text-sm font-medium text-accent-strong hover:underline"
          >
            Sign in
          </Link>
        </div>
      )}

      {error && (
        <ErrorBanner message={error} onRetry={dismissError} />
      )}

      {isAuthenticated && accessToken && (
        <div className="space-y-3 rounded-xl border border-border bg-background/50 px-4 py-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted">
            Add symbol
          </label>
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
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="min-w-[12rem] flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
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
            >
              <FolderPlus className="h-4 w-4" aria-hidden />
              Add folder
            </Button>
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
            {isSyncing && (
              <span className="text-xs text-muted">Saving…</span>
            )}
          </div>
        </div>
      )}

      {isLoading && sortedFolderList.length === 0 && (
        <SkeletonList rows={4} rowClassName="h-16 rounded-xl" />
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

      {isAuthenticated && (
        <div className="space-y-4">
          {sortedFolderList.map((folder) => (
            <WatchlistFolderSection key={folder.id} folder={folder} />
          ))}
        </div>
      )}

    </PageShell>
  );
}
