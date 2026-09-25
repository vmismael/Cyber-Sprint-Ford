import { maskEmail, maskName } from './mask.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Campos que nunca aparecem em log, em qualquer nível de aninhamento. */
const REDACT_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'secret',
  'jwt',
  'pickupaddress',
  'address',
  'phone',
  'latitude',
  'longitude',
]);

/** Campos mantidos, porém mascarados. */
const MASKERS: Record<string, (v: string) => string> = {
  email: maskEmail,
  name: maskName,
  clientname: maskName,
};

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    const k = key.toLowerCase();
    if (REDACT_KEYS.has(k)) out[key] = '[REDACTED]';
    else if (MASKERS[k] && typeof v === 'string') out[key] = MASKERS[k](v);
    else out[key] = redact(v, depth + 1);
  }
  return out;
}

export type LogSink = (line: string) => void;

export function createLogger(opts: { service: string; env: string; sink?: LogSink; minLevel?: LogLevel }) {
  const order: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const min = order.indexOf(opts.minLevel ?? 'info');
  const sink: LogSink = opts.sink ?? ((line) => process.stdout.write(line + '\n'));

  const write = (level: LogLevel, event: string, fields: Record<string, unknown> = {}) => {
    if (order.indexOf(level) < min) return;
    // Campos-base por último: nenhum campo do chamador pode sobrescrevê-los. Antes, um
    // `timestamp: undefined` vindo do audit() apagava o horário da linha de log.
    const entry = {
      ...(redact(fields) as Record<string, unknown>),
      timestamp: new Date().toISOString(),
      level,
      service: opts.service,
      env: opts.env,
      event,
    };
    sink(JSON.stringify(entry));
  };

  return {
    debug: (event: string, fields?: Record<string, unknown>) => write('debug', event, fields),
    info: (event: string, fields?: Record<string, unknown>) => write('info', event, fields),
    warn: (event: string, fields?: Record<string, unknown>) => write('warn', event, fields),
    error: (event: string, fields?: Record<string, unknown>) => write('error', event, fields),
  };
}
export type Logger = ReturnType<typeof createLogger>;
