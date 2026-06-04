"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  fetchWatchlistWorkspace,
  syncWatchlistWorkspace,
} from "@/lib/watchlistApi";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  WATCHLIST_UPDATED_EVENT,
} from "@/lib/watchlist";
import {
  allTickersFromFolders,
  buildSyncRequest,
  containsTicker,
  folderIdsContaining,
  foldersFromResponse,
  mergeQuotesIntoFolders,
  mirrorFoldersToLocalStorage,
  newWatchlistId,
  normalizeTicker,
  readLocalWatchlistSymbols,
  seedFoldersFromLocalSymbols,
  sortedFolders,
} from "@/lib/watchlistWorkspace";
import type {
  WatchlistFolder,
  WatchlistSaveSheetState,
} from "@/app/types/watchlist";

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
  const foldersRef = useRef(folders);
  foldersRef.current = folders;

  const symbols = useMemo(() => {
    if (isAuthenticated) return allTickersFromFolders(folders);
    return localSymbols;
  }, [folders, isAuthenticated, localSymbols]);

  const sortedFolderList = useMemo(() => sortedFolders(folders), [folders]);

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

  const persistWorkspace = useCallback(
    async (applyResponse = false) => {
      if (!accessToken) return;
      isPersistingRef.current = true;
      setIsSyncing(true);
      try {
        const payload = buildSyncRequest(foldersRef.current);
        const response = await syncWatchlistWorkspace(accessToken, payload);
        if (applyResponse) {
          const next = foldersFromResponse(response);
          setFolders(next);
          mirrorFoldersToLocalStorage(next);
        }
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not save your watchlist.",
        );
      } finally {
        isPersistingRef.current = false;
        setIsSyncing(false);
        if (needsSyncAfterPersistRef.current) {
          needsSyncAfterPersistRef.current = false;
          scheduleSyncRef.current?.();
        }
      }
    },
    [accessToken],
  );

  const scheduleSyncRef = useRef<(() => void) | null>(null);
  scheduleSyncRef.current = () => {
    if (!accessToken || !hasLoaded) return;
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
        let next = foldersFromResponse(response);
        if (!includeQuotes && next.some((f) => f.symbols.length > 0)) {
          // placeholder quotes filled on refresh
        }
        setFolders(next);
        mirrorFoldersToLocalStorage(next);

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
    [accessToken, hasLoaded, persistWorkspace],
  );

  const refreshQuotes = useCallback(async () => {
    if (!accessToken) return;
    if (!foldersRef.current.some((f) => f.symbols.length > 0)) return;
    try {
      const response = await fetchWatchlistWorkspace(accessToken, true);
      setFolders((prev) => mergeQuotesIntoFolders(prev, response));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not refresh watchlist quotes.",
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
      if (!accessToken) return;
      updateFolders((prev) =>
        prev.map((folder) =>
          folder.id === folderId ? { ...folder, isCollapsed: collapsed } : folder,
        ),
      );
    },
    [accessToken, updateFolders],
  );

  useEffect(() => {
    if (status === "loading") return;
    setHasLoaded(false);
    void load({ includeQuotes: false });
  }, [accessToken, status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!accessToken || !hasLoaded) return;
    const hasSymbols = folders.some((f) => f.symbols.length > 0);
    if (!hasSymbols) return;

    void refreshQuotes();
    const timer = setInterval(() => void refreshQuotes(), QUOTE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [accessToken, hasLoaded, folders.length, refreshQuotes]);

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
      dismissError: () => setError(null),
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
    ],
  );

  return (
    <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
  );
}

export function useWatchlistContext(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlistContext must be used within WatchlistProvider");
  }
  return ctx;
}
