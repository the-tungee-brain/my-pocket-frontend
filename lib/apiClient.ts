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
