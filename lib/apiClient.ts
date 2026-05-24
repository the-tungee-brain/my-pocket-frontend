import { API_BASE_URL } from "./config";
import { isAbortError } from "./isAbortError";

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



