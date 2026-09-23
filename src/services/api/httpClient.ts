import { secureStorage } from '@/services/secureStorage';
import { assertUrlAllowed } from '@/utils/urlAllowlist';

/**
 * Cliente HTTP da API real (backend/ na Vercel).
 *
 * - A URL vem de EXPO_PUBLIC_API_URL. Sem ela, o app continua no modo mock.
 * - Fora do modo dev, só aceita https:// (TLS obrigatório — OWASP M5).
 * - Todo destino passa pela allowlist de domínios antes do fetch.
 * - Access token e refresh token ficam no SecureStore (Keystore/Keychain).
 * - Em 401, tenta renovar a sessão uma única vez (rotação de refresh token).
 */

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');
export const isLiveApi = API_URL.length > 0;

export const ACCESS_TOKEN_KEY = 'ford.auth.token';
export const REFRESH_TOKEN_KEY = 'ford.auth.refresh';

const TIMEOUT_MS = 12_000;

if (isLiveApi && !__DEV__ && !API_URL.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL precisa usar https:// em builds de produção.');
}

/** Erro com mensagem já segura para exibir ao usuário (vem do campo `detail` da API). */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly retryAfterSec?: number,
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Single-flight: várias requisições com 401 ao mesmo tempo disparam um só refresh.
  refreshing ??= (async () => {
    try {
      const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;
      const res = await rawFetch('/v1/auth/refresh', { method: 'POST', body: { refreshToken } });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      await secureStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      await secureStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

async function rawFetch(path: string, opts: Options & { token?: string | null } = {}) {
  const url = `${API_URL}${path}`;
  assertUrlAllowed(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: opts.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest<T>(path: string, opts: Options = {}): Promise<T> {
  if (!isLiveApi) throw new Error('API real não configurada.');

  const send = async () =>
    rawFetch(path, { ...opts, token: opts.auth ? await secureStorage.getItem(ACCESS_TOKEN_KEY) : null });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && opts.auth && (await tryRefresh())) res = await send();
  } catch {
    throw new ApiRequestError(0, 'Sem conexão com o servidor. Tente novamente.');
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let detail = 'Algo deu errado. Tente novamente.';
    try {
      const problem = (await res.json()) as { detail?: string };
      if (typeof problem.detail === 'string' && problem.detail.length <= 160) detail = problem.detail;
    } catch {
      // corpo não-JSON: mantém a mensagem genérica
    }
    const retry = Number(res.headers.get('Retry-After')) || undefined;
    throw new ApiRequestError(res.status, detail, retry);
  }
  return (await res.json()) as T;
}
