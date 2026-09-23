import type { AppContext } from '../context';
import { hmacSha256 } from '../lib/crypto';
import type { Role } from '../security/rbac';

/** Eventos auditados. Espelham o AuditEventType do app mobile, com prefixo de domínio. */
export type AuditEventName =
  | 'auth.register'
  | 'auth.login_success'
  | 'auth.login_failed'
  | 'auth.lockout_activated'
  | 'auth.logout'
  | 'auth.token_refreshed'
  | 'auth.token_expired'
  | 'auth.token_invalid'
  | 'auth.refresh_reuse_detected'
  | 'authz.permission_denied'
  | 'ratelimit.blocked'
  | 'user.role_changed'
  | 'profile.updated'
  | 'booking.created'
  | 'booking.cancelled'
  | 'booking.access_denied'
  | 'lead.accessed'
  | 'retention.purged'
  | 'system.unhandled_error';

export function clientIp(c: AppContext): string {
  // Na Vercel o IP real do cliente chega em x-forwarded-for (primeiro valor), definido pela própria plataforma.
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown';
}

/**
 * Registra um evento de segurança/negócio em dois destinos:
 * 1. stdout em JSON (coletado pelos logs da Vercel);
 * 2. tabela audit_log (fonte dos dashboards e da trilha de auditoria).
 * Falha ao persistir nunca derruba a requisição, mas vira log de erro.
 */
export async function audit(
  c: AppContext,
  event: AuditEventName,
  opts: {
    level?: 'info' | 'warn' | 'error';
    status?: number;
    userId?: string | null;
    role?: Role | null;
    meta?: Record<string, unknown>;
  } = {},
) {
  const { repos, logger, env } = c.get('deps');
  const user = c.get('user');
  const level = opts.level ?? 'info';
  const record = {
    timestamp: new Date(),
    level,
    event,
    userId: opts.userId !== undefined ? opts.userId : (user?.id ?? null),
    role: opts.role !== undefined ? opts.role : (user?.role ?? null),
    requestId: c.get('requestId') ?? null,
    ipHash: `hmac:${hmacSha256(clientIp(c), env.LOG_IP_SALT).slice(0, 16)}`,
    route: `${c.req.method} ${c.req.routePath ?? c.req.path}`,
    status: opts.status ?? null,
    meta: opts.meta ?? {},
  };

  logger[level](event, { ...record, timestamp: undefined });
  try {
    await repos.audit.insert(record);
  } catch {
    logger.error('audit.persist_failed', { event, requestId: record.requestId });
  }
}
