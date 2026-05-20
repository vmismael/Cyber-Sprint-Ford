const store = new Map<string, number[]>();

export function checkRateLimit(key: string, maxCalls: number, windowMs: number): void {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxCalls) {
    const retryAfterSecs = Math.ceil((windowMs - (now - Math.min(...timestamps))) / 1000);
    throw new Error(`Limite de requisições excedido. Tente novamente em ${retryAfterSecs}s.`);
  }
  timestamps.push(now);
  store.set(key, timestamps);
}
