import { createDataQuality } from '../../types/dataQuality';
import type { DataQuality } from '../../types/dataQuality';
import { getCachePolicy } from './policies';
import type { CachePolicy } from './policies';
import { deterministicUnit } from '../../utils/deterministic';

const DEFAULT_BASE_URL = 'https://api.openf1.org/v1';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
  updatedAt: number;
}

export interface OpenF1Result<T> {
  data: T | null;
  quality: DataQuality;
  error?: Error;
}

export interface OpenF1RequestOptions {
  cachePolicy?: CachePolicy;
  forceRefresh?: boolean;
  maxRetries?: number;
}

export interface OpenF1ClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseBackoffMs?: number;
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function parseRetryAfter(value: string | null, now: number): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

export class OpenF1Client {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly baseBackoffMs: number;
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<OpenF1Result<unknown>>>();
  private cooldownUntil = 0;

  constructor(options: OpenF1ClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.baseBackoffMs = options.baseBackoffMs ?? 500;
  }

  async request<T>(pathOrUrl: string, options: OpenF1RequestOptions = {}): Promise<OpenF1Result<T>> {
    const url = this.toUrl(pathOrUrl);
    const policy = options.cachePolicy ?? getCachePolicy(url);
    const cached = this.cache.get(url) as CacheEntry<T> | undefined;
    const now = this.now();

    if (!options.forceRefresh && cached && now < cached.expiresAt) {
      return this.cachedResult(cached, 'fresh');
    }

    if (!options.forceRefresh && cached && now < cached.staleUntil) {
      if (now >= this.cooldownUntil) {
        void this.startRequest<T>(url, policy, options.maxRetries ?? 2);
      }
      return this.cachedResult(cached, 'stale');
    }

    if (now < this.cooldownUntil) {
      if (cached) return this.cachedResult(cached, 'stale', 'OpenF1 rate-limit cooldown');
      return {
        data: null,
        quality: createDataQuality('unavailable', {
          availability: 'error',
          freshness: 'unknown',
          message: 'OpenF1 rate-limit cooldown',
        }),
        error: new Error('OpenF1 rate-limit cooldown'),
      };
    }

    return this.startRequest<T>(url, policy, options.maxRetries ?? 2);
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
    this.cooldownUntil = 0;
  }

  getCooldownUntil(): number {
    return this.cooldownUntil;
  }

  private toUrl(pathOrUrl: string): string {
    if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
    return `${this.baseUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
  }

  private cachedResult<T>(
    entry: CacheEntry<T>,
    freshness: 'fresh' | 'stale',
    message?: string,
  ): OpenF1Result<T> {
    return {
      data: entry.data,
      quality: createDataQuality('cache', {
        freshness,
        updatedAt: entry.updatedAt,
        availability: 'ready',
        message: message ?? (freshness === 'stale' ? 'Refreshing stale OpenF1 data' : 'Cached OpenF1 data'),
      }),
    };
  }

  private startRequest<T>(
    url: string,
    policy: CachePolicy,
    maxRetries: number,
  ): Promise<OpenF1Result<T>> {
    const existing = this.inFlight.get(url) as Promise<OpenF1Result<T>> | undefined;
    if (existing) return existing;

    const request = this.fetchWithRetry<T>(url, policy, maxRetries)
      .finally(() => {
        this.inFlight.delete(url);
      });

    this.inFlight.set(url, request as Promise<OpenF1Result<unknown>>);
    return request;
  }

  private async fetchWithRetry<T>(
    url: string,
    policy: CachePolicy,
    maxRetries: number,
  ): Promise<OpenF1Result<T>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        const response = await this.fetchFn(url);
        if (response.status === 429) {
          const retryAfter = parseRetryAfter(response.headers.get('Retry-After'), this.now());
          const exponential = this.baseBackoffMs * 2 ** attempt;
          const jitter = Math.floor(deterministicUnit(url, attempt) * Math.max(1, exponential * 0.2));
          const delay = Math.max(retryAfter ?? 0, exponential + jitter);
          this.cooldownUntil = Math.max(this.cooldownUntil, this.now() + delay);
          lastError = new Error(`OpenF1 rate limited request: ${url}`);
          if (attempt < maxRetries) {
            await this.sleep(delay);
            continue;
          }
          break;
        }

        if (!response.ok) {
          throw new Error(`OpenF1 HTTP ${response.status}: ${url}`);
        }

        const data = await response.json() as T;
        const updatedAt = this.now();
        this.cache.set(url, {
          data,
          updatedAt,
          expiresAt: updatedAt + policy.ttlMs,
          staleUntil: updatedAt + policy.ttlMs + policy.staleMs,
        });
        return {
          data,
          quality: createDataQuality('openf1', {
            freshness: 'fresh',
            updatedAt,
            availability: Array.isArray(data) && data.length === 0 ? 'empty' : 'ready',
          }),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown OpenF1 error');
        break;
      }
    }

    const cached = this.cache.get(url) as CacheEntry<T> | undefined;
    if (cached) return this.cachedResult(cached, 'stale', lastError?.message);

    return {
      data: null,
      quality: createDataQuality('unavailable', {
        availability: 'error',
        freshness: 'unknown',
        message: lastError?.message ?? 'OpenF1 request failed',
      }),
      error: lastError ?? new Error('OpenF1 request failed'),
    };
  }
}

export const openF1Client = new OpenF1Client();

export async function getOpenF1Data<T>(
  pathOrUrl: string,
  options?: OpenF1RequestOptions,
): Promise<T> {
  const result = await openF1Client.request<T>(pathOrUrl, options);
  if (result.data === null) throw result.error ?? new Error(result.quality.message ?? 'OpenF1 request failed');
  return result.data;
}
