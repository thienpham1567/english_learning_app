import { AppError } from "@repo/shared";

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  params?: Record<string, string | number | boolean | undefined>;
  raw?: boolean;
};

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const { params, raw, ...fetchOptions } = options ?? {};

  // Build URL with /api prefix and query params
  let fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;

  if (params) {
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
    if (filtered.length > 0) {
      const qs = new URLSearchParams(
        filtered.map(([k, v]) => [k, String(v)]),
      ).toString();
      fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${qs}`;
    }
  }

  // Auto-set Content-Type for JSON, skip for FormData (browser sets multipart boundary)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: HeadersInit = isFormData
    ? { ...((fetchOptions.headers as Record<string, string>) ?? {}) }
    : {
        "Content-Type": "application/json",
        ...((fetchOptions.headers as Record<string, string>) ?? {}),
      };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  // For raw mode, just check ok status and return Response
  if (raw) {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw AppError.fromJSON({ ...errorBody, statusCode: res.status });
    }
    return res as unknown as T;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw AppError.fromJSON({ ...errorBody, statusCode: res.status });
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(url: string, opts?: RequestOptions) =>
    request<T>("GET", url, undefined, opts),
  post: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", url, body, opts),
  put: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", url, body, opts),
  patch: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", url, body, opts),
  delete: <T>(url: string, opts?: RequestOptions) =>
    request<T>("DELETE", url, undefined, opts),
};
