const FINNHUB_STOCK_LOGO_URL =
  "https://static2.finnhub.io/file/publicdatany/finnhubimage/stock_logo/{symbol}.png";

function isLikelyImageUrl(url: string): boolean {
  try {
    const lower = url.trim().toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return false;
    }
    return (
      /\.(png|jpe?g|svg|webp|gif)(\?|$)/i.test(lower) ||
      lower.includes("finnhubimage") ||
      lower.includes("/logo")
    );
  } catch {
    return false;
  }
}

export function finnhubStockLogoUrl(symbol: string): string {
  return FINNHUB_STOCK_LOGO_URL.replace(
    "{symbol}",
    symbol.trim().toUpperCase(),
  );
}

/** Prefer a real image URL; fall back to Finnhub's public logo CDN. */
export function resolveResearchLogoUrl(
  symbol: string,
  logo?: string | null,
): string {
  if (logo && isLikelyImageUrl(logo)) {
    return logo;
  }
  return finnhubStockLogoUrl(symbol);
}
