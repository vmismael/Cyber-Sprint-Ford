import type { Context } from 'hono';
import type { Env } from './config/env.js';
import type { FieldCipher } from './lib/crypto.js';
import type { JwtService } from './lib/jwt.js';
import type { Logger } from './lib/logger.js';
import type { RateLimiter } from './lib/rateLimit.js';
import type { Repositories } from './repositories/types.js';
import type { Role } from './security/rbac.js';

export type Deps = {
  env: Env;
  repos: Repositories;
  logger: Logger;
  jwt: JwtService;
  cipher: FieldCipher;
  limiters: { auth: RateLimiter; api: RateLimiter };
};

export type AuthUser = { id: string; role: Role; name: string; email: string };

export type AppEnv = {
  Variables: {
    deps: Deps;
    requestId: string;
    user?: AuthUser;
  };
};

export type AppContext = Context<AppEnv>;
