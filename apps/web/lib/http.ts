import { api } from "@/lib/api-client";

type HttpOptions = Parameters<typeof api.get>[1];

type HttpResponse<T> = {
  data: T;
};

async function wrap<T>(promise: Promise<T>): Promise<HttpResponse<T>> {
  return { data: await promise };
}

const http = {
  get<T>(url: string, opts?: HttpOptions) {
    return wrap(api.get<T>(url, opts));
  },
  post<T>(url: string, body?: unknown, opts?: HttpOptions) {
    return wrap(api.post<T>(url, body, opts));
  },
  put<T>(url: string, body?: unknown, opts?: HttpOptions) {
    return wrap(api.put<T>(url, body, opts));
  },
  patch<T>(url: string, body?: unknown, opts?: HttpOptions) {
    return wrap(api.patch<T>(url, body, opts));
  },
  delete<T>(url: string, opts?: HttpOptions) {
    return wrap(api.delete<T>(url, opts));
  },
};

export default http;
