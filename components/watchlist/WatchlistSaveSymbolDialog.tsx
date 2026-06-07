"use client";

import { FolderPlus, Star, X } from "lucide-react";
import { useState } from "react";
import { useWatchlistContext } from "@/app/contexts/WatchlistContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { watchlistSwatchClass } from "@/lib/watchlistSwatches";
import { folderIdsContaining } from "@/lib/watchlistWorkspace";

export function WatchlistSaveSymbolDialog() {
  const {
    saveSheet,
    closeSaveSheet,
    sortedFolderList,
    toggleSymbolInFolder,
    addFolder,
  } = useWatchlistContext();
  const [newFolderName, setNewFolderName] = useState("");

  if (!saveSheet) return null;

  const { symbol, companyName } = saveSheet;
  const displayName = companyName?.trim() || symbol;
  const selectedFolderIds = folderIdsContaining(sortedFolderList, symbol);

  const handleNewFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    addFolder(name);
    setNewFolderName("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watchlist-save-title"
    >
      <div className="w-full max-w-md border border-border bg-background shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2
              id="watchlist-save-title"
              className="text-base font-semibold text-foreground"
            >
              Save to folder
            </h2>
            <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
              {symbol}
            </p>
            <p className="truncate text-xs text-muted">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={closeSaveSheet}
            className="p-1.5 text-muted transition hover:bg-muted-bg hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(60vh,24rem)] overflow-y-auto px-4 py-3">
          {sortedFolderList.length === 0 ? (
            <p className="text-sm text-muted">
              Create a folder below to save this symbol.
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedFolderList.map((folder) => {
                const selected = selectedFolderIds.includes(folder.id);
                return (
                  <li key={folder.id}>
                    <button
                      type="button"
                      onClick={() =>
                        toggleSymbolInFolder(symbol, folder.id, displayName)
                      }
                      className={cn(
                        "flex w-full items-center gap-3 border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-accent/50 bg-accent-muted/30"
                          : "border-border hover:border-accent/30 hover:bg-muted-bg/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br",
                          watchlistSwatchClass(folder.swatchID),
                        )}
                      >
                        <Star
                          className={cn(
                            "h-4 w-4",
                            selected
                              ? "fill-accent-strong text-accent-strong"
                              : "text-foreground/70",
                          )}
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-foreground">
                          {folder.name}
                        </span>
                        <span className="text-xs text-muted">
                          {folder.symbols.length} symbol
                          {folder.symbols.length === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-muted">
                        {selected ? "Saved" : "Add"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-2 border-t border-border px-4 py-3">
          <label
            htmlFor="watchlist-new-folder-name"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            New folder
          </label>
          <div className="flex gap-2">
            <input
              id="watchlist-new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNewFolder();
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNewFolder}
              disabled={!newFolderName.trim()}
            >
              <FolderPlus className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            className="w-full"
            onClick={closeSaveSheet}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
