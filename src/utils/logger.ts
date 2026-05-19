const SENSITIVE = new Set(['email', 'password', 'token', 'cpf', 'phone']);

function redact(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : redact(v);
  }
  return out;
}

function prepare(args: unknown[]): unknown[] {
  return args.map((a) => (a !== null && typeof a === 'object' ? redact(a) : a));
}

export const logger = {
  log: (...args: unknown[]) => {
    if (!__DEV__) return;
    console.log(...prepare(args));
  },
  warn: (...args: unknown[]) => {
    if (!__DEV__) return;
    console.warn(...prepare(args));
  },
  error: (...args: unknown[]) => {
    if (!__DEV__) return;
    console.error(...prepare(args));
  },
  security: (...args: unknown[]) => {
    if (!__DEV__) return;
    console.warn('[SECURITY]', ...prepare(args));
  },
};
