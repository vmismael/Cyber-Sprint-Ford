/**
 * Rate limiter de janela deslizante em memória.
 *
 * Limitação conhecida: na Vercel cada instância tem sua própria memória, então o
 * limite vale por instância. O bloqueio de conta por tentativas de login fica no
 * banco (ver AuthService), que é o controle que precisa valer entre instâncias.
 * Para produção, trocar o store por Redis (Upstash) sem mudar a interface.
 */
export interface RateLimiter {
  hit(key: string): { allowed: boolean; remaining: number; retryAfterSec: number };
  reset(key?: string): void;
}

export function createMemoryRateLimiter(opts: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const now = opts.now ?? Date.now;
  const hits = new Map<string, number[]>();

  return {
    hit(key) {
      const t = now();
      const windowStart = t - opts.windowMs;
      const recent = (hits.get(key) ?? []).filter((ts) => ts > windowStart);

      if (recent.length >= opts.limit) {
        hits.set(key, recent);
        const oldest = recent[0] ?? t;
        return { allowed: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((oldest + opts.windowMs - t) / 1000)) };
      }
      recent.push(t);
      hits.set(key, recent);

      // Limpeza oportunista para a memória não crescer sem limite.
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (!v.some((ts) => ts > windowStart)) hits.delete(k);
      }
      return { allowed: true, remaining: opts.limit - recent.length, retryAfterSec: 0 };
    },
    reset(key) {
      if (key) hits.delete(key);
      else hits.clear();
    },
  };
}
