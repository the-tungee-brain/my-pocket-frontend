import { API_BASE_URL } from "./config";

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

export async function streamAnalysis(
  body: unknown,
  accessToken: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const url = `${API_BASE_URL}/analyze-positions-by-symbol`;
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
    throw new Error(`Failed to start analysis (${res.status})`);
  }

  if (!res.body) {
    console.error("Stream start failed: response.body is null");
    throw new Error("Failed to start analysis (no body)");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) onChunk(chunk);
    }
  } catch (err) {
    console.error("Error while reading stream:", err);
    throw err;
  } finally {
    reader.releaseLock();
  }
}



