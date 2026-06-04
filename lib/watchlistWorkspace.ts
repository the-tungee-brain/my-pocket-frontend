import type {
  WatchlistFolder,
  WatchlistFolderDto,
  WatchlistSymbol,
  WatchlistSymbolDto,
  WatchlistWorkspaceResponse,
  WatchlistWorkspaceSyncRequest,
} from "@/app/types/watchlist";
import { getWatchlist, WATCHLIST_UPDATED_EVENT } from "@/lib/watchlist";

export function newWatchlistId(): string {
  return crypto.randomUUID();
}

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function foldersFromResponse(
  response: WatchlistWorkspaceResponse,
): WatchlistFolder[] {
  return response.folders.map(folderFromDto);
}

function folderFromDto(dto: WatchlistFolderDto): WatchlistFolder {
  return {
    id: dto.id,
    name: dto.name,
    iconName: dto.iconName,
    swatchID: dto.swatchID,
    accentHex: dto.accentHex,
    isPinned: dto.isPinned,
    isCollapsed: dto.isCollapsed,
    sortOrder: dto.sortOrder,
    createdAt: dto.createdAt,
    symbols: dto.symbols.map(symbolFromDto),
  };
}

function symbolFromDto(dto: WatchlistSymbolDto): WatchlistSymbol {
  return {
    id: dto.id,
    ticker: normalizeTicker(dto.ticker),
    companyName: dto.companyName?.trim() || normalizeTicker(dto.ticker),
    sortOrder: dto.sortOrder,
    createdAt: dto.createdAt,
    price: dto.price,
    dayChange: dto.dayChange,
    dayChangePercent: dto.dayChangePercent,
  };
}

export function buildSyncRequest(folders: WatchlistFolder[]): WatchlistWorkspaceSyncRequest {
  const ordered = [...folders].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  return {
    folders: ordered.map((folder, folderIndex) => ({
      id: folder.id,
      name: folder.name,
      iconName: folder.iconName,
      swatchID: folder.swatchID,
      accentHex: folder.accentHex,
      isPinned: folder.isPinned,
      isCollapsed: folder.isCollapsed,
      sortOrder: folderIndex,
      symbols: [...folder.symbols]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((symbol, symbolIndex) => ({
          id: symbol.id,
          ticker: symbol.ticker,
          sortOrder: symbolIndex,
        })),
    })),
  };
}

export function allTickersFromFolders(folders: WatchlistFolder[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const folder of folders) {
    for (const symbol of folder.symbols) {
      const upper = symbol.ticker;
      if (!seen.has(upper)) {
        seen.add(upper);
        out.push(upper);
      }
    }
  }
  return out.sort();
}

export function seedFoldersFromLocalSymbols(symbols: string[]): WatchlistFolder[] {
  const items = symbols.map((ticker, index) => ({
    id: newWatchlistId(),
    ticker: normalizeTicker(ticker),
    companyName: normalizeTicker(ticker),
    sortOrder: index,
    createdAt: new Date().toISOString(),
    price: null,
    dayChange: null,
    dayChangePercent: null,
  }));

  return [
    {
      id: newWatchlistId(),
      name: "Saved",
      iconName: "star.fill",
      swatchID: "slate",
      accentHex: null,
      isPinned: true,
      isCollapsed: false,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      symbols: items,
    },
  ];
}

export function mergeQuotesIntoFolders(
  folders: WatchlistFolder[],
  response: WatchlistWorkspaceResponse,
): WatchlistFolder[] {
  const quoteById = new Map<string, WatchlistSymbolDto>();
  for (const folder of response.folders) {
    for (const symbol of folder.symbols) {
      quoteById.set(symbol.id, symbol);
    }
  }

  return folders.map((folder) => ({
    ...folder,
    symbols: folder.symbols.map((symbol) => {
      const quote = quoteById.get(symbol.id);
      if (!quote) return symbol;
      return {
        ...symbol,
        companyName: quote.companyName || symbol.companyName,
        price: quote.price,
        dayChange: quote.dayChange,
        dayChangePercent: quote.dayChangePercent,
      };
    }),
  }));
}

export function mirrorFoldersToLocalStorage(folders: WatchlistFolder[]): void {
  if (typeof window === "undefined") return;
  const tickers = allTickersFromFolders(folders);
  try {
    localStorage.setItem("powerpocket-watchlist", JSON.stringify(tickers));
    window.dispatchEvent(new Event(WATCHLIST_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function readLocalWatchlistSymbols(): string[] {
  return getWatchlist();
}

export function sortedFolders(folders: WatchlistFolder[]): WatchlistFolder[] {
  const pinned = folders
    .filter((f) => f.isPinned)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const regular = folders
    .filter((f) => !f.isPinned)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return [...pinned, ...regular];
}

export function containsTicker(folders: WatchlistFolder[], ticker: string): boolean {
  const upper = normalizeTicker(ticker);
  return folders.some((folder) =>
    folder.symbols.some((symbol) => symbol.ticker === upper),
  );
}

export function folderIdsContaining(
  folders: WatchlistFolder[],
  ticker: string,
): string[] {
  const upper = normalizeTicker(ticker);
  return folders
    .filter((folder) => folder.symbols.some((symbol) => symbol.ticker === upper))
    .map((folder) => folder.id);
}
