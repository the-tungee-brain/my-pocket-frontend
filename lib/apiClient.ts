import { API_BASE_URL } from "./config";
import { isAbortError } from "./isAbortError";
import type { AccountPositionsResponse, RecentOrdersResponse } from "@/app/types/schwab";
import type {
  MorningBrief,
  PortfolioChanges,
  PortfolioIntelligence,
  SymbolIntelligence,
} from "@/app/types/intelligence";
import type {
  ChatSessionMessagesResponse,
  ChatSessionsResponse,
} from "@/app/types/chat";

type RecentOrdersOptions = {
  symbol?: string | null;
  daysBack?: number;
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

export async function fetchAccountPositions(
  accessToken: string,
  options: { refresh?: boolean } = {},
): Promise<AccountPositionsResponse> {
  const res = await apiFetch(
    `/get-account-positions${buildQuery({ refresh: options.refresh ? true : undefined })}`,
    { method: "GET", accessToken },
  );

  if (!res.ok) {
    throw new Error(`Failed to load positions (${res.status})`);
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
        options.includeOptions === false ? false : undefined,
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
): Promise<void> {
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

  await streamResponseBody(res, onChunk);
}

export async function streamAnalysis(
  body: any,
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<void> {
  return streamPost("/analyze-positions-by-symbol", body, accessToken, onChunk);
}

export async function streamResearchChat(
  body: {
    symbol: string;
    prompt: string;
    model?: string;
  },
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<void> {
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



