const cache = new Map<string, { value: unknown; cachedAt: number }>();

/**
 * Returns the cached value for `key` if it exists and has not expired.
 * Otherwise runs `fn`, stores the result with the given TTL, and returns it.
 */
export async function withTtlCache<T>(
  key: string,
  ttlMs: number,
  fn: () => T | Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && now - entry.cachedAt < ttlMs) {
    return entry.value as T;
  }
  const value = await fn();
  cache.set(key, { value, cachedAt: now });
  return value;
}
