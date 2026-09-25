import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../context.js';
import { Errors } from '../lib/errors.js';
import { can, type Permission } from '../security/rbac.js';
import { audit, clientIp } from '../services/audit.js';

/**
 * Exige um access token válido. O perfil (role) usado nas decisões vem do banco,
 * não do token: se um admin rebaixar alguém, o efeito é imediato.
 */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const header = c.req.header('authorization') ?? '';
  const match = /^Bearer ([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/.exec(header);
  if (!match?.[1]) {
    throw Errors.unauthorized();
  }

  const { jwt, repos } = c.get('deps');
  const result = await jwt.verify(match[1]);
  if (!result.ok) {
    await audit(c, result.reason === 'expired' ? 'auth.token_expired' : 'auth.token_invalid', {
      level: 'warn',
      status: 401,
    });
    throw Errors.unauthorized(result.reason === 'expired' ? 'Sessão expirada.' : 'Token inválido.');
  }

  const user = await repos.users.findById(result.claims.sub);
  if (!user) throw Errors.unauthorized('Token inválido.');

  c.set('user', { id: user.id, role: user.role, name: user.name, email: user.email });
  await next();
});

/** Nega por padrão: só passa quem tem a permissão explícita na matriz RBAC. */
export const requirePermission = (permission: Permission) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get('user');
    if (!user) throw Errors.unauthorized();
    if (!can(user.role, permission)) {
      await audit(c, 'authz.permission_denied', { level: 'warn', status: 403, meta: { permission } });
      throw Errors.forbidden();
    }
    await next();
  });

/** Rate limit por IP (rotas públicas) ou por usuário (rotas autenticadas). */
export const rateLimit = (which: 'auth' | 'api') =>
  createMiddleware<AppEnv>(async (c, next) => {
    const limiter = c.get('deps').limiters[which];
    const key = `${which}:${c.get('user')?.id ?? clientIp(c)}`;
    const r = limiter.hit(key);
    c.header('RateLimit-Remaining', String(r.remaining));
    if (!r.allowed) {
      await audit(c, 'ratelimit.blocked', { level: 'warn', status: 429, meta: { limiter: which } });
      throw Errors.tooMany(r.retryAfterSec);
    }
    await next();
  });
