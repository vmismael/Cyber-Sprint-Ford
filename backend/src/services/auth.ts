import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { AppContext } from '../context';
import { randomToken, sha256 } from '../lib/crypto';
import { ApiError, Errors } from '../lib/errors';
import type { User } from '../repositories/types';
import { audit } from './audit';

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;

// Hash fixo usado quando o e-mail não existe: o tempo de resposta fica igual ao de
// uma senha errada, e ninguém descobre quais e-mails têm conta (anti-enumeração).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

const bcryptCost = (c: AppContext) => (c.get('deps').env.NODE_ENV === 'test' ? 4 : 12);

export const publicUser = (u: Pick<User, 'id' | 'name' | 'email' | 'role'>) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});

async function issueTokens(c: AppContext, user: User, familyId: string = randomUUID()) {
  const { jwt, repos, env } = c.get('deps');
  const accessToken = await jwt.sign(user.id, user.role);
  const refreshToken = randomToken();
  const stored = await repos.refreshTokens.create({
    userId: user.id,
    tokenHash: sha256(refreshToken), // só o hash é persistido
    familyId,
    expiresAt: new Date(Date.now() + env.REFRESH_TTL_DAYS * 86_400_000),
  });
  return {
    body: {
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn: jwt.ttlSeconds,
      refreshToken,
      user: publicUser(user),
    },
    storedId: stored.id,
  };
}

export async function register(c: AppContext, input: { name: string; email: string; password: string }) {
  const { repos } = c.get('deps');
  if (await repos.users.findByEmail(input.email)) throw Errors.conflict('Conta já existe.');

  const user = await repos.users.create({
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, bcryptCost(c)),
    role: 'client', // cadastro público sempre cria cliente; só admin promove
  });
  await audit(c, 'auth.register', { status: 201, userId: user.id, role: user.role });
  return (await issueTokens(c, user)).body;
}

export async function login(c: AppContext, input: { email: string; password: string }) {
  const { repos } = c.get('deps');
  const user = await repos.users.findByEmail(input.email);

  if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const retry = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
    await audit(c, 'auth.login_failed', { level: 'warn', status: 429, userId: user.id, meta: { reason: 'locked' } });
    throw Errors.tooMany(retry);
  }

  const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const lock = attempts >= MAX_FAILED_LOGINS;
      await repos.users.setLoginFailures(user.id, lock ? 0 : attempts, lock ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000) : null);
      if (lock) {
        await audit(c, 'auth.lockout_activated', {
          level: 'warn',
          status: 401,
          userId: user.id,
          meta: { minutes: LOCKOUT_MINUTES },
        });
      }
    }
    await audit(c, 'auth.login_failed', {
      level: 'warn',
      status: 401,
      userId: user?.id ?? null,
      meta: { reason: user ? 'invalid_password' : 'unknown_email' },
    });
    throw Errors.invalidCredentials(); // mesma mensagem nos dois casos
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) await repos.users.setLoginFailures(user.id, 0, null);
  await audit(c, 'auth.login_success', { status: 200, userId: user.id, role: user.role });
  return (await issueTokens(c, user)).body;
}

export async function refresh(c: AppContext, refreshToken: string) {
  const { repos } = c.get('deps');
  const stored = await repos.refreshTokens.findByHash(sha256(refreshToken));
  if (!stored) throw Errors.unauthorized('Sessão inválida.');

  if (stored.revokedAt) {
    // Token já usado sendo reapresentado = provável roubo. Derruba a família inteira.
    await repos.refreshTokens.revokeFamily(stored.familyId);
    await audit(c, 'auth.refresh_reuse_detected', { level: 'warn', status: 401, userId: stored.userId });
    throw Errors.unauthorized('Sessão inválida.');
  }
  if (stored.expiresAt.getTime() <= Date.now()) throw Errors.unauthorized('Sessão expirada.');

  const user = await repos.users.findById(stored.userId);
  if (!user) throw Errors.unauthorized('Sessão inválida.');

  const next = await issueTokens(c, user, stored.familyId);
  await repos.refreshTokens.revoke(stored.id, next.storedId); // rotação: o antigo morre
  await audit(c, 'auth.token_refreshed', { status: 200, userId: user.id, role: user.role });
  return next.body;
}

export async function logout(c: AppContext, refreshToken?: string) {
  const { repos } = c.get('deps');
  const user = c.get('user');
  if (!user) throw Errors.unauthorized();

  if (refreshToken) {
    const stored = await repos.refreshTokens.findByHash(sha256(refreshToken));
    if (stored && stored.userId !== user.id) throw new ApiError(403, 'Forbidden', 'Sessão não pertence ao usuário.');
    if (stored) await repos.refreshTokens.revokeFamily(stored.familyId);
  } else {
    await repos.refreshTokens.revokeAllForUser(user.id);
  }
  await audit(c, 'auth.logout', { status: 204 });
}
