"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  WatchlistFolder,
  WatchlistSaveSheetState,
  WatchlistWorkspaceResponse,
} from "@/app/types/watchlist";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  WATCHLIST_UPDATED_EVENT,
} from "@/lib/watchlist";
import {
  fetchWatchlistWorkspace,
  isWatchlistConflictError,
  syncWatchlistWorkspace,
} from "@/lib/watchlistApi";
import {
  allTickersFromFolders,
  buildSyncRequest,
  containsTicker,
  foldersFromResponse,
  mergeQuotesIntoFolders,
  mirrorFoldersToLocalStorage,
  newWatchlistId,
  normalizeTicker,
  readLocalWatchlistSymbols,
  seedFoldersFromLocalSymbols,
  sortedFolders,
  workspaceVersionFromResponse,
} from "@/lib/watchlistWorkspace";

const SYNC_DEBOUNCE_MS = 700;
const QUOTE_REFRESH_MS = 45_000;

type WatchlistContextValue = {
  folders: WatchlistFolder[];
  sortedFolderList: WatchlistFolder[];
  symbols: string[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  isAuthenticated: boolean;
  saveSheet: WatchlistSaveSheetState;
  isWatchlisted: (symbol: string) => boolean;
  load: (options?: { includeQuotes?: boolean }) => Promise<void>;
  refreshQuotes: () => Promise<void>;
  requestAddSymbol: (symbol: string, companyName?: string) => void;
  closeSaveSheet: () => void;
  addSymbolToFolder: (
    symbol: string,
    folderId: string,
    companyName?: string,
  ) => void;
  removeSymbolFromFolder: (symbol: string, folderId: string) => void;
  removeSymbolFromAll: (symbol: string) => void;
  toggleSymbolInFolder: (
    symbol: string,
    folderId: string,
    companyName?: string,
  ) => void;
  toggleSymbol: (symbol: string, companyName?: string) => boolean;
  addFolder: (name: string) => void;
  setFolderCollapsed: (folderId: string, collapsed: boolean) => void;
  dismissError: () => void;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const isAuthenticated = status === "authenticated" && !!accessToken;

  const [folders, setFolders] = useState<WatchlistFolder[]>([]);
  const [localSymbols, setLocalSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSheet, setSaveSheet] = useState<WatchlistSaveSheetState>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPersistingRef = useRef(false);
  const needsSyncAfterPersistRef = useRef(false);
  const syncBlockedByConflictRef = useRef(false);
  const workspaceVersionRef = useRef<number | null>(null);
  const latestServerFoldersRef = useRef<WatchlistFolder[] | null>(null);
  const foldersRef = useRef(folders);
  foldersRef.current = folders;

  const symbols = useMemo(() => {
    if (isAuthenticated) return allTickersFromFolders(folders);
    return localSymbols;
  }, [folders, isAuthenticated, localSymbols]);

  const sortedFolderList = useMemo(() => sortedFolders(folders), [folders]);
  const symbolCount = symbols.length;

  const refreshLocalSymbols = useCallback(() => {
    setLocalSymbols(getWatchlist());
  }, []);

  const isWatchlisted = useCallback(
    (symbol: string) => {
      const upper = normalizeTicker(symbol);
      if (!upper) return false;
      if (isAuthenticated) return containsTicker(folders, upper);
      return localSymbols.includes(upper);
    },
    [folders, isAuthenticated, localSymbols],
  );

  const applyWorkspaceVersion = useCallback(
    (response: WatchlistWorkspaceResponse) => {
      workspaceVersionRef.current = workspaceVersionFromResponse(response);
    },
    [],
  );

  const persistWorkspace = useCallback(
    async (applyResponse = false) => {
      if (!accessToken) return;
      if (syncBlockedByConflictRef.current) return;
      isPersistingRef.current = true;
      setIsSyncing(true);
      try {
        const payload = buildSyncRequest(
          foldersRef.current,
          workspaceVersionRef.current,
        );
        const response = await syncWatchlistWorkspace(accessToken, payload);
        applyWorkspaceVersion(response);
        if (applyResponse) {
          const next = foldersFromResponse(response);
          setFolders(next);
          mirrorFoldersToLocalStorage(next);
          latestServerFoldersRef.current = next;
        }
        setError(null);
      } catch (err) {
        if (isWatchlistConflictError(err)) {
          syncBlockedByConflictRef.current = true;
          if (err.currentVersion !== null) {
            workspaceVersionRef.current = err.currentVersion;
          }
          needsSyncAfterPersistRef.current = false;
          if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = null;
          }
          try {
            const latest = await fetchWatchlistWorkspace(accessToken, false);
            applyWorkspaceVersion(latest);
            latestServerFoldersRef.current = foldersFromResponse(latest);
          } catch {
            latestServerFoldersRef.current = null;
          }
          setError(
            "Watchlist changed on another device. Your local edits are preserved, but auto-save is paused. Reload to use the latest server copy or try again to overwrite it.",
          );
          return;
        }
        setError(
          err instanceof Error ? err.message : "Could not save your watchlist.",
        );
      } finally {
        isPersistingRef.current = false;
        setIsSyncing(false);
        if (
          needsSyncAfterPersistRef.current &&
          !syncBlockedByConflictRef.current
        ) {
          needsSyncAfterPersistRef.current = false;
          scheduleSyncRef.current?.();
        }
      }
    },
    [accessToken, applyWorkspaceVersion],
  );

  const scheduleSyncRef = useRef<(() => void) | null>(null);
  scheduleSyncRef.current = () => {
    if (!accessToken || !hasLoaded) return;
    if (syncBlockedByConflictRef.current) return;
    if (isPersistingRef.current) {
      needsSyncAfterPersistRef.current = true;
      return;
    }
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncTimerRef.current = null;
      void persistWorkspace(false);
    }, SYNC_DEBOUNCE_MS);
  };

  const scheduleSync = useCallback(() => {
    scheduleSyncRef.current?.();
  }, []);

  const handleErrorRetry = useCallback(() => {
    if (!syncBlockedByConflictRef.current) {
      setError(null);
      return;
    }
    syncBlockedByConflictRef.current = false;
    setError(null);
    void persistWorkspace(false);
  }, [persistWorkspace]);

  const updateFolders = useCallback(
    (updater: (prev: WatchlistFolder[]) => WatchlistFolder[]) => {
      setFolders((prev) => {
        const next = updater(prev);
        if (accessToken) mirrorFoldersToLocalStorage(next);
        return next;
      });
      if (accessToken) scheduleSync();
      else refreshLocalSymbols();
    },
    [accessToken, scheduleSync, refreshLocalSymbols],
  );

  const load = useCallback(
    async (options?: { includeQuotes?: boolean }) => {
      const includeQuotes = options?.includeQuotes ?? false;
      const local = readLocalWatchlistSymbols();

      if (!accessToken) {
        setFolders([]);
        setLocalSymbols(local);
        workspaceVersionRef.current = null;
        latestServerFoldersRef.current = null;
        syncBlockedByConflictRef.current = false;
        setHasLoaded(true);
        return;
      }

      setIsLoading(true);
      const migrating = !hasLoaded;
      try {
        const response = await fetchWatchlistWorkspace(
          accessToken,
          includeQuotes,
        );
        applyWorkspaceVersion(response);
        syncBlockedByConflictRef.current = false;
        let next = foldersFromResponse(response);
        if (!includeQuotes && next.some((f) => f.symbols.length > 0)) {
          // placeholder quotes filled on refresh
        }
        setFolders(next);
        mirrorFoldersToLocalStorage(next);
        latestServerFoldersRef.current = next;

        if (next.length === 0 && local.length > 0 && migrating) {
          next = seedFoldersFromLocalSymbols(local);
          setFolders(next);
          mirrorFoldersToLocalStorage(next);
          foldersRef.current = next;
          await persistWorkspace(true);
        }
        setError(null);
      } catch (err) {
        if (migrating && local.length > 0) {
          const seeded = seedFoldersFromLocalSymbols(local);
          setFolders(seeded);
          mirrorFoldersToLocalStorage(seeded);
          setError("Using offline symbols until sync succeeds.");
        } else {
          setError(
            err instanceof Error ? err.message : "Could not load watchlist.",
          );
        }
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    },
    [accessToken, hasLoaded, persistWorkspace, applyWorkspaceVersion],
  );

  const refreshQuotes = useCallback(async () => {
    if (!accessToken) return;
    if (!foldersRef.current.some((f) => f.symbols.length > 0)) return;
    try {
      const response = await fetchWatchlistWorkspace(accessToken, true);
      const version = workspaceVersionFromResponse(response);
      if (version !== null) {
        const currentVersion = workspaceVersionRef.current;
        if (currentVersion === null || version >= currentVersion) {
          workspaceVersionRef.current = version;
        }
      }
      setFolders((prev) => mergeQuotesIntoFolders(prev, response));
      if (!syncBlockedByConflictRef.current) setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh watchlist quotes.",
      );
    }
  }, [accessToken]);

  const addSymbolToFolder = useCallback(
    (symbol: string, folderId: string, companyName?: string) => {
      const upper = normalizeTicker(symbol);
      if (!upper) return;

      if (!accessToken) {
        addToWatchlist(upper);
        refreshLocalSymbols();
        return;
      }

      updateFolders((prev) =>
        prev.map((folder) => {
          if (folder.id !== folderId) return folder;
          if (folder.symbols.some((s) => s.ticker === upper)) return folder;
          return {
            ...folder,
            symbols: [
              ...folder.symbols,
              {
                id: newWatchlistId(),
                ticker: upper,
                companyName: companyName?.trim() || upper,
                sortOrder: folder.symbols.length,
                createdAt: new Date().toISOString(),
                price: null,
                dayChange: null,
                dayChangePercent: null,
              },
            ],
          };
        }),
      );
    },
    [accessToken, updateFolders, refreshLocalSymbols],
  );

  const removeSymbolFromFolder = useCallback(
    (symbol: string, folderId: string) => {
      const upper = normalizeTicker(symbol);
      if (!upper) return;

      if (!accessToken) {
        removeFromWatchlist(upper);
        refreshLocalSymbols();
        return;
      }

      updateFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? {
                ...folder,
                symbols: folder.symbols.filter((s) => s.ticker !== upper),
              }
            : folder,
        ),
      );
    },
    [accessToken, updateFolders, refreshLocalSymbols],
  );

  const removeSymbolFromAll = useCallback(
    (symbol: string) => {
      const upper = normalizeTicker(symbol);
      if (!upper) return;

      if (!accessToken) {
        removeFromWatchlist(upper);
        refreshLocalSymbols();
        return;
      }

      updateFolders((prev) =>
        prev.map((folder) => ({
          ...folder,
          symbols: folder.symbols.filter((s) => s.ticker !== upper),
        })),
      );
    },
    [accessToken, updateFolders, refreshLocalSymbols],
  );

  const requestAddSymbol = useCallback(
    (symbol: string, companyName?: string) => {
      const upper = normalizeTicker(symbol);
      if (!upper) return;

      if (!accessToken) {
        addToWatchlist(upper);
        refreshLocalSymbols();
        return;
      }

      const folderList = sortedFolders(foldersRef.current);
      if (folderList.length === 0) {
        updateFolders(() => {
          const seeded = seedFoldersFromLocalSymbols([upper]);
          const folder = seeded[0];
          if (!folder) return [];
          return [
            {
              ...folder,
              symbols: [
                {
                  id: newWatchlistId(),
                  ticker: upper,
                  companyName: companyName?.trim() || upper,
                  sortOrder: 0,
                  createdAt: new Date().toISOString(),
                  price: null,
                  dayChange: null,
                  dayChangePercent: null,
                },
              ],
            },
          ];
        });
        return;
      }

      if (folderList.length === 1) {
        addSymbolToFolder(upper, folderList[0].id, companyName);
        return;
      }

      setSaveSheet({ symbol: upper, companyName });
    },
    [accessToken, addSymbolToFolder, updateFolders, refreshLocalSymbols],
  );

  const toggleSymbolInFolder = useCallback(
    (symbol: string, folderId: string, companyName?: string) => {
      const upper = normalizeTicker(symbol);
      const inFolder = foldersRef.current
        .find((f) => f.id === folderId)
        ?.symbols.some((s) => s.ticker === upper);
      if (inFolder) removeSymbolFromFolder(upper, folderId);
      else addSymbolToFolder(upper, folderId, companyName);
    },
    [addSymbolToFolder, removeSymbolFromFolder],
  );

  const toggleSymbol = useCallback(
    (symbol: string, companyName?: string) => {
      const upper = normalizeTicker(symbol);
      if (!upper) return false;

      if (isWatchlisted(upper)) {
        removeSymbolFromAll(upper);
        return false;
      }
      requestAddSymbol(upper, companyName);
      return true;
    },
    [isWatchlisted, removeSymbolFromAll, requestAddSymbol],
  );

  const addFolder = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !accessToken) return;
      updateFolders((prev) => [
        ...prev,
        {
          id: newWatchlistId(),
          name: trimmed,
          iconName: "folder.fill",
          swatchID: "slate",
          accentHex: null,
          isPinned: false,
          isCollapsed: false,
          sortOrder: prev.length,
          createdAt: new Date().toISOString(),
          symbols: [],
        },
      ]);
    },
    [accessToken, updateFolders],
  );

  const setFolderCollapsed = useCallback(
    (folderId: string, collapsed: boolean) => {
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId
            ? { ...folder, isCollapsed: collapsed }
            : folder,
        ),
      );
    },
    [],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: This load should reset only when auth identity/status changes.
  useEffect(() => {
    if (status === "loading") return;
    setHasLoaded(false);
    workspaceVersionRef.current = null;
    latestServerFoldersRef.current = null;
    syncBlockedByConflictRef.current = false;
    void load({ includeQuotes: false });
  }, [accessToken, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!accessToken || !hasLoaded) return;
    if (symbolCount === 0) return;

    void refreshQuotes();
    const timer = setInterval(() => void refreshQuotes(), QUOTE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [accessToken, hasLoaded, symbolCount, refreshQuotes]);

  useEffect(() => {
    const onUpdate = () => {
      if (!accessToken) refreshLocalSymbols();
    };
    window.addEventListener(WATCHLIST_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [accessToken, refreshLocalSymbols]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      folders,
      sortedFolderList,
      symbols,
      isLoading,
      isSyncing,
      error,
      isAuthenticated,
      saveSheet,
      isWatchlisted,
      load,
      refreshQuotes,
      requestAddSymbol,
      closeSaveSheet: () => setSaveSheet(null),
      addSymbolToFolder,
      removeSymbolFromFolder,
      removeSymbolFromAll,
      toggleSymbolInFolder,
      toggleSymbol,
      addFolder,
      setFolderCollapsed,
      dismissError: handleErrorRetry,
    }),
    [
      folders,
      sortedFolderList,
      symbols,
      isLoading,
      isSyncing,
      error,
      isAuthenticated,
      saveSheet,
      isWatchlisted,
      load,
      refreshQuotes,
      requestAddSymbol,
      addSymbolToFolder,
      removeSymbolFromFolder,
      removeSymbolFromAll,
      toggleSymbolInFolder,
      toggleSymbol,
      addFolder,
      setFolderCollapsed,
      handleErrorRetry,
    ],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlistContext(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error(
      "useWatchlistContext must be used within WatchlistProvider",
    );
  }
  return ctx;
}
