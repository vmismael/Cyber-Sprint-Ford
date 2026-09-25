import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../context';
import { Errors } from '../lib/errors';
import { maskEmail, maskName, maskPhone } from '../lib/mask';
import { rateLimit, requireAuth, requirePermission } from '../middleware/security';
import type { Lead } from '../repositories/types';
import {
  AuditEventSchema,
  AuditQuerySchema,
  LeadDetailSchema,
  LeadQuerySchema,
  LeadSchema,
  PageQuerySchema,
  RoleUpdateSchema,
  UserSchema,
  UuidParamSchema,
  problem,
} from '../schemas';
import { audit } from '../services/audit';
import { publicUser } from '../services/auth';

export const backofficeRoutes = new OpenAPIHono<AppEnv>();

const bearer = [{ bearerAuth: [] }];

/** O analista trabalha com o lead sem ver o dado pessoal completo (LGPD — minimização). */
const toLeadDto = (l: Lead) => ({
  id: l.id,
  clientName: maskName(l.clientName),
  vehicleModel: l.vehicleModel,
  plan: l.plan,
  service: l.service,
  aiScore: l.aiScore,
  riskLabel: l.riskLabel,
  lastActivity: l.lastActivity,
  status: l.status,
  estimatedRevenue: l.estimatedRevenue,
});

// ---------- Leads (analista e admin) ----------
backofficeRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/leads',
    tags: ['Leads'],
    summary: 'Leads priorizados pelo modelo de IA (dados pessoais mascarados)',
    security: bearer,
    middleware: [requireAuth, requirePermission('lead:read'), rateLimit('api')] as const,
    request: { query: LeadQuerySchema },
    responses: {
      200: {
        description: 'Lista paginada',
        content: {
          'application/json': {
            schema: z.object({ items: z.array(LeadSchema), total: z.number(), limit: z.number(), offset: z.number() }),
          },
        },
      },
      401: problem('Não autenticado'),
      403: problem('Somente analista ou administrador'),
    },
  }),
  async (c) => {
    const { risk, ...page } = c.req.valid('query');
    const r = await c.get('deps').repos.leads.list(page, risk);
    return c.json({ items: r.items.map(toLeadDto), total: r.total, ...page }, 200);
  },
);

backofficeRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/leads/{id}',
    tags: ['Leads'],
    summary: 'Detalhe do lead (acesso registrado na trilha de auditoria)',
    security: bearer,
    middleware: [requireAuth, requirePermission('lead:read'), rateLimit('api')] as const,
    request: {
      params: z.strictObject({
        id: z.string().regex(/^lead_\d{3,6}$/).openapi({ param: { name: 'id', in: 'path' }, example: 'lead_001' }),
      }),
    },
    responses: {
      200: { description: 'Lead', content: { 'application/json': { schema: LeadDetailSchema } } },
      401: problem('Não autenticado'),
      403: problem('Somente analista ou administrador'),
      404: problem('Lead não encontrado'),
    },
  }),
  async (c) => {
    const lead = await c.get('deps').repos.leads.findById(c.req.valid('param').id);
    if (!lead) throw Errors.notFound('Lead');
    await audit(c, 'lead.accessed', { status: 200, meta: { leadId: lead.id } });
    return c.json(
      {
        ...toLeadDto(lead),
        email: maskEmail(lead.email),
        phone: maskPhone(lead.phone),
        vehicleYear: lead.vehicleYear,
        odometerKm: lead.odometerKm,
      },
      200,
    );
  },
);

// ---------- Administração (somente admin) ----------
backofficeRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/admin/users',
    tags: ['Administração'],
    summary: 'Lista usuários',
    security: bearer,
    middleware: [requireAuth, requirePermission('user:read')] as const,
    request: { query: PageQuerySchema },
    responses: {
      200: {
        description: 'Lista paginada',
        content: {
          'application/json': {
            schema: z.object({ items: z.array(UserSchema), total: z.number(), limit: z.number(), offset: z.number() }),
          },
        },
      },
      401: problem('Não autenticado'),
      403: problem('Somente administrador'),
    },
  }),
  async (c) => {
    const page = c.req.valid('query');
    const r = await c.get('deps').repos.users.list(page);
    // DTO explícito: hash de senha e contadores de login nunca saem da API.
    return c.json({ items: r.items.map(publicUser), total: r.total, ...page }, 200);
  },
);

backofficeRoutes.openapi(
  createRoute({
    method: 'patch',
    path: '/admin/users/{id}/role',
    tags: ['Administração'],
    summary: 'Altera o perfil de acesso de um usuário',
    security: bearer,
    middleware: [requireAuth, requirePermission('user:role:write')] as const,
    request: {
      params: UuidParamSchema,
      body: { content: { 'application/json': { schema: RoleUpdateSchema } }, required: true },
    },
    responses: {
      200: { description: 'Perfil alterado', content: { 'application/json': { schema: UserSchema } } },
      401: problem('Não autenticado'),
      403: problem('Somente administrador'),
      404: problem('Usuário não encontrado'),
      409: problem('Administrador não pode alterar o próprio perfil'),
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const { role } = c.req.valid('json');
    const { repos } = c.get('deps');
    if (id === c.get('user')!.id) throw Errors.conflict('Administrador não pode alterar o próprio perfil.');

    const target = await repos.users.findById(id);
    if (!target) throw Errors.notFound('Usuário');
    const previous = target.role;
    const updated = await repos.users.updateRole(id, role);
    await repos.refreshTokens.revokeAllForUser(id); // força novo login com o perfil novo
    await audit(c, 'user.role_changed', { status: 200, meta: { targetUserId: id, from: previous, to: role } });
    return c.json(publicUser(updated!), 200);
  },
);

backofficeRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/admin/audit-events',
    tags: ['Administração'],
    summary: 'Trilha de auditoria (eventos de segurança e de negócio)',
    security: bearer,
    middleware: [requireAuth, requirePermission('audit:read')] as const,
    request: { query: AuditQuerySchema },
    responses: {
      200: {
        description: 'Eventos mais recentes primeiro',
        content: {
          'application/json': {
            schema: z.object({
              items: z.array(AuditEventSchema),
              total: z.number(),
              limit: z.number(),
              offset: z.number(),
            }),
          },
        },
      },
      401: problem('Não autenticado'),
      403: problem('Somente administrador'),
    },
  }),
  async (c) => {
    const { event, ...page } = c.req.valid('query');
    const r = await c.get('deps').repos.audit.list(page, event);
    return c.json(
      {
        items: r.items.map((e) => ({ ...e, timestamp: new Date(e.timestamp).toISOString() })),
        total: r.total,
        ...page,
      },
      200,
    );
  },
);
