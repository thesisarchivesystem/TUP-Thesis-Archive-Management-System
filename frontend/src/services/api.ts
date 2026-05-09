import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

type CachedRequestConfig<D = unknown> = AxiosRequestConfig<D> & {
  cacheTtlMs?: number;
  skipCache?: boolean;
};

type CachedResponse = {
  expiresAt: number;
  response: AxiosResponse;
};

const DEFAULT_GET_CACHE_TTL_MS = 45_000;
const STATIC_LOOKUP_CACHE_TTL_MS = 120_000;
const MAX_GET_CACHE_ENTRIES = 80;
const getResponseCache = new Map<string, CachedResponse>();
const pendingGetRequests = new Map<string, Promise<AxiosResponse>>();

const uncachedGetPrefixes = ['/auth/me', '/ably/token', '/messages', '/notifications'];
const uncachedGetSuffixes = ['/manuscript'];

const clearGetResponseCache = () => {
  getResponseCache.clear();
  pendingGetRequests.clear();
};

const getCacheTtl = <D>(url: string, config?: CachedRequestConfig<D>) => {
  if (typeof config?.cacheTtlMs === 'number') {
    return config.cacheTtlMs;
  }

  if (url.includes('/categories') || url.includes('/profile')) {
    return STATIC_LOOKUP_CACHE_TTL_MS;
  }

  return DEFAULT_GET_CACHE_TTL_MS;
};

const pruneExpiredCacheEntries = () => {
  const now = Date.now();

  getResponseCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      getResponseCache.delete(key);
    }
  });

  while (getResponseCache.size > MAX_GET_CACHE_ENTRIES) {
    const oldestKey = getResponseCache.keys().next().value;
    if (!oldestKey) break;
    getResponseCache.delete(oldestKey);
  }
};

const isCacheableGet = <D>(url: string, config?: CachedRequestConfig<D>) => {
  if (config?.skipCache) return false;
  if (config?.responseType && config.responseType !== 'json') return false;

  const ttl = getCacheTtl(url, config);
  if (ttl <= 0) return false;

  return !uncachedGetPrefixes.some((prefix) => url.startsWith(prefix))
    && !uncachedGetSuffixes.some((suffix) => url.endsWith(suffix));
};

const buildGetCacheKey = <D>(url: string, config?: AxiosRequestConfig<D>) => {
  const token = useAuthStore.getState().token ?? 'guest';
  const requestUrl = api.getUri({ ...(config ?? {}), url });
  return `${token}:${requestUrl}`;
};

const rawGet = api.get.bind(api) as typeof api.get;

api.get = (function cachedGet<T = unknown, R = AxiosResponse<T>, D = unknown>(
  url: string,
  config?: AxiosRequestConfig<D>,
): Promise<R> {
  const cacheConfig = config as CachedRequestConfig<D> | undefined;

  if (!isCacheableGet(url, cacheConfig)) {
    return rawGet<T, R, D>(url, config);
  }

  pruneExpiredCacheEntries();

  const cacheKey = buildGetCacheKey(url, config);
  const cached = getResponseCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return Promise.resolve(cached.response as R);
  }

  const pending = pendingGetRequests.get(cacheKey);
  if (pending) {
    return pending as Promise<R>;
  }

  const request = rawGet<T, AxiosResponse<T>, D>(url, config)
    .then((response) => {
      getResponseCache.set(cacheKey, {
        expiresAt: Date.now() + getCacheTtl(url, cacheConfig),
        response,
      });

      pruneExpiredCacheEntries();
      return response;
    })
    .finally(() => {
      pendingGetRequests.delete(cacheKey);
    });

  pendingGetRequests.set(cacheKey, request as Promise<AxiosResponse>);

  return request as Promise<R>;
}) as typeof api.get;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = config.method?.toLowerCase();
  if (method && method !== 'get') {
    clearGetResponseCache();
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.code === 'account_disabled') {
      clearGetResponseCache();
      useAuthStore.getState().showForcedLogoutNotice(error.response?.data?.message);
    }

    if (error.response?.status === 401) {
      if (useAuthStore.getState().forcedLogoutNotice) {
        return Promise.reject(error);
      }

      clearGetResponseCache();
      useAuthStore.getState().logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
