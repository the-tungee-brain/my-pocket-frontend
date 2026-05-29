export type PortfolioHoldingsNewsItem = {
  symbol: string;
  headline: string;
  source?: string | null;
  summary?: string | null;
  url?: string | null;
  weightPct?: number | null;
  publishedAt?: string | null;
};

export type PortfolioNewsResponse = {
  items: PortfolioHoldingsNewsItem[];
};
