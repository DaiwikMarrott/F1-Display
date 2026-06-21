import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenF1Client } from './client';

function response(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => data,
  } as Response;
}

describe('OpenF1Client', () => {
  let now: number;
  let fetchFn: ReturnType<typeof vi.fn>;
  let sleep: ReturnType<typeof vi.fn>;
  let client: OpenF1Client;

  beforeEach(() => {
    now = 1_000;
    fetchFn = vi.fn();
    sleep = vi.fn().mockResolvedValue(undefined);
    client = new OpenF1Client({
      fetchFn,
      now: () => now,
      sleep,
      random: () => 0,
      baseBackoffMs: 100,
    });
  });

  it('deduplicates in-flight requests and caches successful responses', async () => {
    let resolveFetch: (value: Response) => void = () => undefined;
    fetchFn.mockReturnValue(new Promise<Response>(resolve => {
      resolveFetch = resolve;
    }));

    const first = client.request<{ id: number }[]>('/sessions', {
      cachePolicy: { ttlMs: 1_000, staleMs: 5_000 },
    });
    const second = client.request<{ id: number }[]>('/sessions', {
      cachePolicy: { ttlMs: 1_000, staleMs: 5_000 },
    });
    resolveFetch(response([{ id: 1 }]));

    expect((await first).data).toEqual([{ id: 1 }]);
    expect((await second).data).toEqual([{ id: 1 }]);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    const cached = await client.request<{ id: number }[]>('/sessions');
    expect(cached.quality.provenance).toBe('cache');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('returns stale data immediately and revalidates once', async () => {
    fetchFn
      .mockResolvedValueOnce(response([{ id: 1 }]))
      .mockResolvedValueOnce(response([{ id: 2 }]));

    await client.request('/position', { cachePolicy: { ttlMs: 100, staleMs: 1_000 } });
    now += 200;
    const stale = await client.request<{ id: number }[]>('/position', {
      cachePolicy: { ttlMs: 100, staleMs: 1_000 },
    });

    expect(stale.data).toEqual([{ id: 1 }]);
    expect(stale.quality.freshness).toBe('stale');
    await vi.waitFor(() => expect(fetchFn).toHaveBeenCalledTimes(2));
  });

  it('respects Retry-After and enters a shared cooldown after 429', async () => {
    fetchFn.mockResolvedValue(response([], 429, { 'Retry-After': '2' }));

    const result = await client.request('/laps', {
      maxRetries: 1,
      cachePolicy: { ttlMs: 100, staleMs: 100 },
    });

    expect(result.data).toBeNull();
    expect(sleep).toHaveBeenCalledWith(2_000);
    expect(client.getCooldownUntil()).toBe(3_000);

    const blocked = await client.request('/drivers');
    expect(blocked.data).toBeNull();
    expect(blocked.quality.message).toBe('OpenF1 rate-limit cooldown');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff when Retry-After is absent', async () => {
    fetchFn
      .mockResolvedValueOnce(response([], 429))
      .mockResolvedValueOnce(response([{ lap: 1 }]));

    const result = await client.request('/laps', { maxRetries: 1 });

    expect(sleep).toHaveBeenCalledWith(100);
    expect(result.data).toEqual([{ lap: 1 }]);
  });

  it('returns a structured error instead of throwing', async () => {
    fetchFn.mockResolvedValue(response({}, 500));

    const result = await client.request('/sessions');

    expect(result.data).toBeNull();
    expect(result.quality.availability).toBe('error');
    expect(result.error?.message).toContain('HTTP 500');
  });
});
