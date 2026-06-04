export type WatchlistSymbolDto = {
  id: string;
  ticker: string;
  sortOrder: number;
  companyName: string;
  price: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  createdAt: string | null;
};

export type WatchlistFolderDto = {
  id: string;
  name: string;
  iconName: string;
  swatchID: string;
  accentHex: number | null;
  isPinned: boolean;
  isCollapsed: boolean;
  sortOrder: number;
  createdAt: string;
  symbols: WatchlistSymbolDto[];
};

export type WatchlistWorkspaceResponse = {
  folders: WatchlistFolderDto[];
  asOf: string;
};

export type WatchlistSymbolSyncPayload = {
  id: string;
  ticker: string;
  sortOrder: number;
};

export type WatchlistFolderSyncPayload = {
  id: string;
  name: string;
  iconName: string;
  swatchID: string;
  accentHex: number | null;
  isPinned: boolean;
  isCollapsed: boolean;
  sortOrder: number;
  symbols: WatchlistSymbolSyncPayload[];
};

export type WatchlistWorkspaceSyncRequest = {
  folders: WatchlistFolderSyncPayload[];
};

export type WatchlistFolder = {
  id: string;
  name: string;
  iconName: string;
  swatchID: string;
  accentHex: number | null;
  isPinned: boolean;
  isCollapsed: boolean;
  sortOrder: number;
  createdAt: string | null;
  symbols: WatchlistSymbol[];
};

export type WatchlistSymbol = {
  id: string;
  ticker: string;
  companyName: string;
  sortOrder: number;
  createdAt: string | null;
  price: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
};

export type WatchlistSaveSheetState = {
  symbol: string;
  companyName?: string;
} | null;
