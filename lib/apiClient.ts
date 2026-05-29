import { API_BASE_URL } from "./config";
import { isAbortError } from "./isAbortError";
import { readSchwabReauthFromResponse } from "./schwabReauth";
import type { SchwabReauthDetail } from "./schwabReauth";
import type { AccountPositionsResponse, RecentOrdersResponse } from "@/app/types/schwab";
import type {
  MorningBrief,
  PortfolioChanges,
  PortfolioIntelligence,
  SymbolIntelligence,
} from "@/app/types/intelligence";
import type { PortfolioNewsResponse } from "@/app/types/portfolioNews";
import type { PressReleasesResponse } from "@/app/types/pressReleases";
import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import {
  overviewBundleEtagKey,
  parseEtagHeader,
  readOverviewBundleEtag,
  writeOverviewBundleEtag,
} from "@/lib/overviewBundleCache";
import type {
  InvestmentStrategy,
  JourneyStepStatus,
  SelectStrategyResponse,
  StrategyCatalogItem,
  StrategyRecommendations,
  StrategyScreenerFilters,
  StrategyStockScreenerResult,
  UserInvestmentProfile,
  UserInvestmentProfileUpdate,
  UserStrategyJourney,
} from "@/app/types/strategy";
import { DEFAULT_PAGE_SIZE } from "@/lib/strategyScreener";
import type {
  ChatSessionMessagesResponse,
  ChatSessionsResponse,
} from "@/app/types/chat";
import type { AccountPlan } from "@/app/types/account";

type RecentOrdersOptions = {
  symbol?: string | null;
  daysBack?: number;
  limit?: number;
  offset?: number;
  refresh?: boolean;
};

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export type ApiError = Error & {
  status?: number;
  reauth?: SchwabReauthDetail | null;
};

export async function fetchAccountPositions(
  accessToken: string,
  options: { refresh?: boolean } = {},
): Promise<AccountPositionsResponse> {
  const res = await apiFetch(
    `/get-account-positions${buildQuery({ refresh: options.refresh ? true : undefined })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    const reauth = await readSchwabReauthFromResponse(res);
    const error = new Error(
      reauth?.message ?? `Failed to load positions (${res.status})`,
    ) as ApiError;
    error.status = res.status;
    error.reauth = reauth;
    throw error;
  }

  return res.json() as Promise<AccountPositionsResponse>;
}

export async function fetchPortfolioBrief(
  accessToken: string,
  options: { refresh?: boolean } = {},
): Promise<PortfolioIntelligence> {
  const res = await apiFetch(
    `/portfolio/brief${buildQuery({ refresh: options.refresh ? true : undefined })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    const error = new Error(
      res.status === 404
        ? "Portfolio brief endpoint is not available."
        : `Failed to load portfolio brief (${res.status})`,
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<PortfolioIntelligence>;
}

export async function fetchPortfolioNews(
  accessToken: string,
): Promise<PortfolioNewsResponse> {
  const res = await apiFetch("/portfolio/news", {
    method: "GET",
    accessToken,
  });

  if (!res.ok) {
    const error = new Error(
      res.status === 404
        ? "Portfolio news endpoint is not available."
        : `Failed to load portfolio news (${res.status})`,
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<PortfolioNewsResponse>;
}

export async function fetchPressReleases(
  accessToken: string,
  symbol: string,
  options: { lookbackDays?: number } = {},
): Promise<PressReleasesResponse> {
  const res = await apiFetch(
    `/research/press-releases${buildQuery({
      symbol: symbol.toUpperCase(),
      lookbackDays: options.lookbackDays,
    })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    throw new Error(`Failed to load press releases (${res.status})`);
  }

  return res.json() as Promise<PressReleasesResponse>;
}

export async function fetchMorningBrief(
  accessToken: string,
  options: { refresh?: boolean } = {},
): Promise<MorningBrief> {
  const res = await apiFetch(
    `/portfolio/morning-brief${buildQuery({ refresh: options.refresh ? true : undefined })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    const error = new Error(
      res.status === 404
        ? "Morning brief endpoint is not available."
        : `Failed to load morning brief (${res.status})`,
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<MorningBrief>;
}

export async function fetchPortfolioChanges(
  accessToken: string,
  options: { compareDays?: number } = {},
): Promise<PortfolioChanges> {
  const res = await apiFetch(
    `/portfolio/changes${buildQuery({ compareDays: options.compareDays })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    throw new Error(`Failed to load portfolio changes (${res.status})`);
  }

  return res.json() as Promise<PortfolioChanges>;
}

export async function dismissPortfolioAlert(
  accessToken: string,
  alertId: string,
): Promise<void> {
  const res = await apiFetch(`/portfolio/alerts/${alertId}/dismiss`, {
    method: "POST",
    accessToken,
  });

  if (!res.ok) {
    throw new Error(`Failed to dismiss alert (${res.status})`);
  }
}

export async function fetchSymbolIntelligence(
  accessToken: string,
  symbol: string,
  options: { includeOptions?: boolean } = {},
): Promise<SymbolIntelligence> {
  const res = await apiFetch(
    `/research/intelligence${buildQuery({
      symbol: symbol.toUpperCase(),
      include_options:
        options.includeOptions === false ? false : true,
    })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    const error = new Error(
      res.status === 404
        ? "Symbol intelligence is not available yet."
        : `Failed to load symbol intelligence (${res.status})`,
    ) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  return res.json() as Promise<SymbolIntelligence>;
}

export async function fetchRecentOrders(
  accessToken: string,
  options: RecentOrdersOptions = {},
): Promise<RecentOrdersResponse> {
  const res = await apiFetch(
    `/recent-orders${buildQuery({
      symbol: options.symbol ?? undefined,
      days_back: options.daysBack,
      limit: options.limit,
      offset: options.offset,
      refresh: options.refresh ? true : undefined,
    })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    throw new Error(`Failed to load recent orders (${res.status})`);
  }

  return res.json() as Promise<RecentOrdersResponse>;
}

export async function apiFetch(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
) {
  const { accessToken, headers, ...rest } = options;

  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    baseHeaders.Authorization = `Bearer ${accessToken}`;
  }

  let extraHeaders: Record<string, string> = {};
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      extraHeaders[key] = value;
    });
  } else if (Array.isArray(headers)) {
    for (const [key, value] of headers) extraHeaders[key] = value;
  } else if (headers && typeof headers === "object") {
    extraHeaders = headers as Record<string, string>;
  }

  const finalHeaders: HeadersInit = { ...baseHeaders, ...extraHeaders };

  const url = `${API_BASE_URL}${path}`;

  return fetch(url, {
    ...rest,
    headers: finalHeaders,
  });
}

async function streamPost(
  path: string,
  body: unknown,
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<{ chatSessionId: string | null }> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Network error starting stream:", err);
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "Stream start failed:",
      res.status,
      res.statusText,
      "Body:",
      text,
    );
    throw new Error(`Failed to start stream (${res.status})`);
  }

  if (!res.body) {
    console.error("Stream start failed: response.body is null");
    throw new Error("Failed to start stream (no body)");
  }

  const chatSessionId = res.headers.get("X-Chat-Session-Id");

  await streamResponseBody(res, onChunk);
  return { chatSessionId };
}

export async function streamAnalysis(
  body: any,
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<{ chatSessionId: string | null }> {
  return streamPost("/analyze-positions-by-symbol", body, accessToken, onChunk);
}

export async function streamPlaybookAsk(
  body: {
    symbol: string;
    actionType: string;
    actionTitle: string;
    actionReason?: string;
    strategy: string;
    model?: string;
    chat_session_id?: string | null;
    new_chat_session?: boolean;
  },
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<{ chatSessionId: string | null }> {
  return streamPost("/strategy/playbook/ask", body, accessToken, onChunk);
}

export async function streamResearchChat(
  body: {
    symbol: string;
    prompt: string;
    model?: string;
    chat_session_id?: string | null;
    new_chat_session?: boolean;
  },
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<{ chatSessionId: string | null }> {
  return streamPost("/research/chat", body, accessToken, onChunk);
}

async function streamResponseBody(
  res: Response,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!res.body) {
    throw new Error("Failed to start stream (no body)");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        break;
      }

      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onChunk(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}

type StreamRequestOptions = {
  signal?: AbortSignal;
};

async function streamGetResponse(
  url: string,
  accessToken: string,
  onChunk: (text: string) => void,
  options: StreamRequestOptions = {},
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: options.signal,
    });
  } catch (err) {
    if (isAbortError(err)) throw err;
    console.error("Network error starting stream:", err);
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(
      "Stream start failed:",
      res.status,
      res.statusText,
      "Body:",
      text,
    );
    throw new Error(`Failed to start stream (${res.status})`);
  }

  if (!res.body) {
    throw new Error("Failed to start stream (no body)");
  }

  await streamResponseBody(res, onChunk, options.signal);
}

export async function streamGet(
  path: string,
  accessToken: string,
  onChunk: (text: string) => void,
  options: StreamRequestOptions = {},
): Promise<void> {
  const url = `${API_BASE_URL}${path}`;
  await streamGetResponse(url, accessToken, onChunk, options);
}

type ChatSessionListOptions = {
  kind?: "all" | "portfolio" | "research";
  limit?: number;
  offset?: number;
};

export async function listChatSessions(
  accessToken: string,
  options: ChatSessionListOptions = {},
): Promise<ChatSessionsResponse> {
  const params = new URLSearchParams();
  if (options.kind) params.set("kind", options.kind);
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.offset != null) params.set("offset", String(options.offset));

  const query = params.toString();
  const path = query ? `/chat/sessions?${query}` : "/chat/sessions";
  const res = await apiFetch(path, { method: "GET", accessToken });

  if (!res.ok) {
    throw new Error(`Failed to list chat sessions (${res.status})`);
  }

  return res.json() as Promise<ChatSessionsResponse>;
}

export async function getChatSessionMessages(
  accessToken: string,
  sessionId: string,
  limit = 100,
): Promise<ChatSessionMessagesResponse> {
  const res = await apiFetch(
    `/chat/sessions/${sessionId}/messages?limit=${limit}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    throw new Error(`Failed to load chat messages (${res.status})`);
  }

    return res.json() as Promise<ChatSessionMessagesResponse>;
}

export async function deleteChatSession(
  accessToken: string,
  sessionId: string,
): Promise<void> {
  const res = await apiFetch(`/chat/sessions/${sessionId}`, {
    method: "DELETE",
    accessToken,
  });

  if (!res.ok) {
    throw new Error(`Failed to delete chat session (${res.status})`);
  }
}

export async function clearChatSessionsByPrefix(
  accessToken: string,
  titlePrefix: string,
): Promise<number> {
  const params = new URLSearchParams({ title_prefix: titlePrefix });
  const res = await apiFetch(`/chat/sessions?${params.toString()}`, {
    method: "DELETE",
    accessToken,
  });

  if (!res.ok) {
    throw new Error(`Failed to clear chat sessions (${res.status})`);
  }

  const data = (await res.json()) as { deletedCount: number };
  return data.deletedCount;
}

export async function fetchStrategyCatalog(
  accessToken: string,
): Promise<StrategyCatalogItem[]> {
  const res = await apiFetch("/strategies", { method: "GET", accessToken });
  if (!res.ok) {
    throw new Error(`Failed to load strategies (${res.status})`);
  }
  return res.json() as Promise<StrategyCatalogItem[]>;
}

export async function fetchInvestmentProfile(
  accessToken: string,
): Promise<UserInvestmentProfile | null> {
  const res = await apiFetch("/user/investment-profile", {
    method: "GET",
    accessToken,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load investment profile (${res.status})`);
  }
  const data = await res.json();
  return (data ?? null) as UserInvestmentProfile | null;
}

export async function updateInvestmentProfile(
  accessToken: string,
  payload: UserInvestmentProfileUpdate,
): Promise<UserInvestmentProfile> {
  const res = await apiFetch("/user/investment-profile", {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update investment profile (${res.status})`);
  }
  return res.json() as Promise<UserInvestmentProfile>;
}

export async function selectStrategy(
  accessToken: string,
  strategy: InvestmentStrategy,
): Promise<SelectStrategyResponse> {
  const res = await apiFetch(`/strategies/${strategy}/select`, {
    method: "POST",
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to select strategy (${res.status})`);
  }
  return res.json() as Promise<SelectStrategyResponse>;
}

export async function fetchStrategyJourney(
  accessToken: string,
  strategy: InvestmentStrategy,
): Promise<UserStrategyJourney | null> {
  const res = await apiFetch(`/strategies/${strategy}/journey`, {
    method: "GET",
    accessToken,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to load strategy journey (${res.status})`);
  }
  return res.json() as Promise<UserStrategyJourney | null>;
}

export async function updateJourneyStep(
  accessToken: string,
  strategy: InvestmentStrategy,
  stepId: string,
  payload: { status: JourneyStepStatus; metadata?: Record<string, unknown> },
): Promise<UserStrategyJourney> {
  const res = await apiFetch(
    `/strategies/${strategy}/journey/steps/${stepId}`,
    {
      method: "PATCH",
      accessToken,
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to update journey step (${res.status})`);
  }
  return res.json() as Promise<UserStrategyJourney>;
}

export async function fetchStrategyRecommendations(
  accessToken: string,
  strategy: InvestmentStrategy,
  symbol?: string,
): Promise<StrategyRecommendations> {
  const res = await apiFetch(
    `/strategies/${strategy}/recommendations${buildQuery({ symbol })}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    throw new Error(`Failed to load strategy recommendations (${res.status})`);
  }
  return res.json() as Promise<StrategyRecommendations>;
}

export async function fetchStrategyStockScreener(
  accessToken: string,
  strategy: InvestmentStrategy,
  filters: StrategyScreenerFilters,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<StrategyStockScreenerResult> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    minMarketCap: String(filters.minMarketCap),
    requireDividend: String(filters.requireDividend),
  });
  if (filters.maxPe != null) {
    params.set("maxPe", String(filters.maxPe));
  }
  if (filters.minDividendYield != null) {
    params.set("minDividendYield", String(filters.minDividendYield));
  }
  if (filters.sectors != null) {
    params.set("sectors", filters.sectors.join(","));
  }

  const res = await apiFetch(
    `/strategies/${strategy}/stock-screener?${params.toString()}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    throw new Error(`Failed to run stock screener (${res.status})`);
  }
  return res.json() as Promise<StrategyStockScreenerResult>;
}

export async function fetchAccountPlan(
  accessToken: string,
): Promise<AccountPlan> {
  const res = await apiFetch("/account/plan", {
    method: "GET",
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to load account plan (${res.status})`);
  }
  return res.json() as Promise<AccountPlan>;
}

export type ResearchOverviewBundleFetchResult =
  | { status: "ok"; bundle: ResearchOverviewBundle }
  | { status: "not_modified" };

export async function fetchResearchOverviewBundle(
  accessToken: string,
  symbol: string,
  options: {
    holdingsLimit?: number;
    includeSummary?: boolean;
    skipEtag?: boolean;
  } = {},
): Promise<ResearchOverviewBundleFetchResult> {
  const symbolUpper = symbol.toUpperCase();
  const includeSummary = options.includeSummary ?? false;
  const etagKey = overviewBundleEtagKey(symbolUpper, includeSummary);
  const storedEtag = options.skipEtag ? null : readOverviewBundleEtag(etagKey);

  const res = await apiFetch(
    `/research/overview-bundle${buildQuery({
      symbol: symbolUpper,
      holdings_limit: options.holdingsLimit,
      include_summary: includeSummary ? true : undefined,
    })}`,
    {
      method: "GET",
      accessToken,
      headers: storedEtag ? { "If-None-Match": `"${storedEtag}"` } : undefined,
    },
  );

  if (res.status === 304) {
    return { status: "not_modified" };
  }

  if (!res.ok) {
    throw new Error(`Failed to load research overview (${res.status})`);
  }

  const etag = parseEtagHeader(res.headers.get("ETag"));
  writeOverviewBundleEtag(etagKey, etag);

  const bundle = (await res.json()) as ResearchOverviewBundle;
  return { status: "ok", bundle };
}

export async function deleteAccount(accessToken: string): Promise<void> {
  const res = await apiFetch("/account", {
    method: "DELETE",
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to delete account (${res.status})`);
  }
}

