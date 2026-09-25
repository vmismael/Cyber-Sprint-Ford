import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Erro de aplicação no formato RFC 9457 (application/problem+json).
 * `detail` só contém texto escrito para o cliente — nunca a mensagem de uma exceção.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly title: string,
    public readonly detail?: string,
    public readonly headers: Record<string, string> = {},
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(title);
  }
}

export const Errors = {
  unauthorized: (detail = 'Autenticação necessária.') =>
    new ApiError(401, 'Unauthorized', detail, { 'WWW-Authenticate': 'Bearer' }),
  invalidCredentials: () => new ApiError(401, 'Unauthorized', 'Credenciais inválidas.'),
  forbidden: () => new ApiError(403, 'Forbidden', 'Você não tem permissão para esta ação.'),
  notFound: (what = 'Recurso') => new ApiError(404, 'Not Found', `${what} não encontrado.`),
  conflict: (detail: string) => new ApiError(409, 'Conflict', detail),
  tooMany: (retryAfterSec: number) =>
    new ApiError(429, 'Too Many Requests', 'Muitas tentativas. Aguarde e tente novamente.', {
      'Retry-After': String(retryAfterSec),
    }),
};
