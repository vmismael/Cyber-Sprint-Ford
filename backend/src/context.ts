import type { Context } from 'hono';
import type { Env } from './config/env';
import type { FieldCipher } from './lib/crypto';
import type { JwtService } from './lib/jwt';
import type { Logger } from './lib/logger';
import type { RateLimiter } from './lib/rateLimit';
import type { Repositories } from './repositories/types';
import type { Role } from './security/rbac';

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
