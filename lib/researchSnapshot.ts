import { apiFetch } from "@/lib/apiClient";

export type ResearchSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  price: number;
  changePct: number;
  marketCap: string;
  range52w: string;
  logo?: string;
  weburl?: string;
};

const snapshotCache = new Map<string, ResearchSnapshot>();

export function getCachedResearchSnapshot(
  symbol: string,
): ResearchSnapshot | null {
  return snapshotCache.get(symbol.trim().toUpperCase()) ?? null;
}

export async function fetchResearchSnapshot(
  symbol: string,
  accessToken: string,
): Promise<ResearchSnapshot | null> {
  const key = symbol.trim().toUpperCase();
  if (!key) return null;

  const cached = snapshotCache.get(key);
  if (cached) return cached;

  try {
    const res = await apiFetch(
      `/research/snapshot?symbol=${encodeURIComponent(key)}`,
      {
        method: "GET",
        accessToken,
      },
    );

    if (!res.ok) return null;

    const data: ResearchSnapshot = await res.json();
    snapshotCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}
