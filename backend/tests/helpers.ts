import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { buildDeps } from '../src/bootstrap.js';
import { loadEnv } from '../src/config/env.js';
import { createMemoryRepositories } from '../src/repositories/memory.js';
import type { Role } from '../src/security/rbac.js';

export const TEST_ENV = loadEnv({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-secret-que-tem-mais-de-32-caracteres-ok',
  JWT_ACCESS_TTL_SECONDS: '900',
  DATA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  LOG_IP_SALT: 'sal-de-teste-1234567',
  ALLOWED_ORIGINS: 'https://ford-intelligence.vercel.app',
});

export const PASSWORD = 'Senha1234';

export function setup() {
  const repos = createMemoryRepositories();
  const logs: string[] = [];
  const deps = buildDeps({ env: TEST_ENV, repos, sink: (l) => logs.push(l) });
  const app = createApp(deps);

  const call = (path: string, init: RequestInit & { token?: string; json?: unknown; ip?: string } = {}) => {
    const headers = new Headers(init.headers);
    headers.set('x-forwarded-for', init.ip ?? '203.0.113.10');
    if (init.token) headers.set('authorization', `Bearer ${init.token}`);
    if (init.json !== undefined) headers.set('content-type', 'application/json');
    return app.request(path, {
      ...init,
      headers,
      body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    });
  };

  /** Cria usuário direto no repositório (perfis analyst/admin não se cadastram pela API pública). */
  let seq = 0;
  const createUser = async (role: Role, email: string) => {
    const user = await repos.users.create({ name: 'Usuário Teste', email, passwordHash: await bcrypt.hash(PASSWORD, 4), role });
    const res = await call('/v1/auth/login', { method: 'POST', json: { email, password: PASSWORD }, ip: `198.51.100.${++seq}` });
    const body = (await res.json()) as { accessToken: string; refreshToken: string };
    return { user, token: body.accessToken, refreshToken: body.refreshToken };
  };

  return { app, deps, repos, logs, call, createUser };
}
