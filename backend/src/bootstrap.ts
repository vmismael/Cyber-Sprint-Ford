import { loadEnv, type Env } from './config/env';
import type { Deps } from './context';
import { createFieldCipher } from './lib/crypto';
import { createJwtService } from './lib/jwt';
import { createLogger, type LogSink } from './lib/logger';
import { createMemoryRateLimiter } from './lib/rateLimit';
import { createMemoryRepositories } from './repositories/memory';
import { createPostgresRepositories } from './repositories/postgres';
import type { Repositories } from './repositories/types';

export function buildDeps(opts: { env?: Env; repos?: Repositories; sink?: LogSink } = {}): Deps {
  const env = opts.env ?? loadEnv();
  const logger = createLogger({ service: 'ford-api', env: env.NODE_ENV, sink: opts.sink });
  const repos = opts.repos ?? (env.DATABASE_URL ? createPostgresRepositories(env.DATABASE_URL) : createMemoryRepositories());
  if (!env.DATABASE_URL && !opts.repos) logger.warn('system.memory_store', { note: 'DATABASE_URL ausente: dados em memória' });

  return {
    env,
    repos,
    logger,
    jwt: createJwtService(env.JWT_SECRET, env.JWT_ACCESS_TTL_SECONDS),
    cipher: createFieldCipher(env.DATA_ENCRYPTION_KEY),
    limiters: {
      auth: createMemoryRateLimiter({ limit: 10, windowMs: 60_000 }), // login/cadastro/refresh por IP
      api: createMemoryRateLimiter({ limit: 60, windowMs: 60_000 }), // escrita e leituras sensíveis por usuário
    },
  };
}
