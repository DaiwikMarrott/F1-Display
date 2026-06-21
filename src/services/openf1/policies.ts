export interface CachePolicy {
  ttlMs: number;
  staleMs: number;
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;

const POLICIES: Array<[RegExp, CachePolicy]> = [
  [/\/sessions(?:\?|$)/, { ttlMs: 15 * MINUTE, staleMs: 6 * 60 * MINUTE }],
  [/\/drivers(?:\?|$)/, { ttlMs: 60 * MINUTE, staleMs: 24 * 60 * MINUTE }],
  [/\/location(?:\?|$)/, { ttlMs: 5 * SECOND, staleMs: 30 * SECOND }],
  [/\/position(?:\?|$)/, { ttlMs: 3 * SECOND, staleMs: 30 * SECOND }],
  [/\/laps(?:\?|$)/, { ttlMs: 10 * SECOND, staleMs: 2 * MINUTE }],
  [/\/stints(?:\?|$)/, { ttlMs: 15 * SECOND, staleMs: 5 * MINUTE }],
  [/\/pit(?:\?|$)/, { ttlMs: 15 * SECOND, staleMs: 5 * MINUTE }],
];

const DEFAULT_POLICY: CachePolicy = {
  ttlMs: 30 * SECOND,
  staleMs: 5 * MINUTE,
};

export function getCachePolicy(url: string): CachePolicy {
  return POLICIES.find(([pattern]) => pattern.test(url))?.[1] ?? DEFAULT_POLICY;
}
