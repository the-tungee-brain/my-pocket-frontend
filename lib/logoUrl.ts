const FINNHUB_STOCK_LOGO_URL =
  "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/{symbol}.png";

export function finnhubStockLogoUrl(symbol: string): string {
  return FINNHUB_STOCK_LOGO_URL.replace(
    "{symbol}",
    symbol.trim().toUpperCase(),
  );
}

/** Prefer TICKER_SYMBOLS logo from snapshot; fall back to Finnhub's public logo CDN (not an API call). */
export function resolveResearchLogoUrl(
  symbol: string,
  logo?: string | null,
): string {
  const value = logo?.trim();
  if (
    value &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    return value;
  }
  return finnhubStockLogoUrl(symbol);
}
