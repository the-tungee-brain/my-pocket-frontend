const FINNHUB_STOCK_LOGO_URL =
  "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/{symbol}.png";

/** Finnhub CDN filenames for a few renamed tickers (e.g. FB → META). */
const FINNHUB_LOGO_SYMBOL_ALIASES: Record<string, string> = {
  META: "FB",
};

export function isFinnhubStockLogoUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("finnhubimage/stock_logo");
}

export function finnhubStockLogoUrl(symbol: string): string {
  const symbolUpper = symbol.trim().toUpperCase();
  const finnhubSymbol =
    FINNHUB_LOGO_SYMBOL_ALIASES[symbolUpper] ?? symbolUpper;
  return FINNHUB_STOCK_LOGO_URL.replace("{symbol}", finnhubSymbol);
}

function isCanonicalFinnhubLogoUrl(symbol: string, url: string): boolean {
  return url === finnhubStockLogoUrl(symbol);
}

/** Prefer TICKER_SYMBOLS logo; rewrite stale Finnhub CDN filenames; else Finnhub CDN. */
export function resolveResearchLogoUrl(
  symbol: string,
  logo?: string | null,
): string {
  const value = logo?.trim();
  if (
    value &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    if (isFinnhubStockLogoUrl(value) && !isCanonicalFinnhubLogoUrl(symbol, value)) {
      return finnhubStockLogoUrl(symbol);
    }
    return value;
  }
  return finnhubStockLogoUrl(symbol);
}

export function snapshotHasStaleFinnhubLogo(
  symbol: string,
  logo?: string | null,
): boolean {
  const value = logo?.trim();
  if (!value || !isFinnhubStockLogoUrl(value)) return false;
  return !isCanonicalFinnhubLogoUrl(symbol, value);
}
