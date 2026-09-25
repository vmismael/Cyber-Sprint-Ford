import * as mock from '@/services/mocks/authApi';
import type { AuthUser, LoginPayload, SignupPayload } from '@/services/mocks/authApi';
import { apiRequest, isLiveApi } from './httpClient';

export type { AuthUser, LoginPayload, SignupPayload, UserRole } from '@/services/mocks/authApi';

export type AuthSession = {
  token: string;
  refreshToken: string | null;
  user: AuthUser;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

const toSession = (p: TokenPair): AuthSession => ({ token: p.accessToken, refreshToken: p.refreshToken, user: p.user });

/**
 * No modo real, o perfil de acesso (client/analyst/admin) é decidido pelo servidor
 * a partir do banco. O campo `isAnalyst` do formulário é ignorado: o cliente não
 * escolhe o próprio perfil.
 */
export async function login(payload: LoginPayload): Promise<AuthSession> {
  if (!isLiveApi) return { ...(await mock.login(payload)), refreshToken: null };
  const pair = await apiRequest<TokenPair>('/v1/auth/login', {
    method: 'POST',
    body: { email: payload.email, password: payload.password },
  });
  return toSession(pair);
}

export async function signup(payload: SignupPayload): Promise<AuthSession> {
  if (!isLiveApi) return { ...(await mock.signup(payload)), refreshToken: null };
  return toSession(await apiRequest<TokenPair>('/v1/auth/register', { method: 'POST', body: payload }));
}

/** Revoga a sessão no servidor. Falha de rede não impede o logout local. */
export async function revokeSession(refreshToken: string | null): Promise<void> {
  if (!isLiveApi) return;
  try {
    await apiRequest<void>('/v1/auth/logout', {
      method: 'POST',
      auth: true,
      body: refreshToken ? { refreshToken } : {},
    });
  } catch {
    // o token local é apagado de qualquer forma; o refresh expira no servidor
  }
}
