import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { AppContext, AppEnv } from '../context.js';
import { Errors } from '../lib/errors.js';
import { rateLimit, requireAuth, requirePermission } from '../middleware/security.js';
import type { Booking } from '../repositories/types.js';
import { can } from '../security/rbac.js';
import {
  BookingInputSchema,
  BookingListSchema,
  BookingSchema,
  PageQuerySchema,
  ProfileInputSchema,
  ProfileSchema,
  UuidParamSchema,
  problem,
} from '../schemas/index.js';
import { audit } from '../services/audit.js';

export const bookingRoutes = new OpenAPIHono<AppEnv>();

const bearer = [{ bearerAuth: [] }];

/** DTO explícito: o endereço sai decifrado só para quem já passou pela checagem de posse. */
function toDto(c: AppContext, b: Booking) {
  const { cipher } = c.get('deps');
  return {
    id: b.id,
    protocol: b.protocol,
    dealerId: b.dealerId,
    service: b.service,
    mode: b.mode,
    date: b.date,
    slot: b.slot,
    pickupAddress: b.pickupAddressEnc ? cipher.decrypt(b.pickupAddressEnc) : null,
    notes: b.notesEnc ? cipher.decrypt(b.notesEnc) : null,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  };
}

/**
 * Busca o agendamento e confere se ele pertence ao usuário (proteção contra IDOR/BOLA).
 * Quem não é dono recebe 404, não 403, para não confirmar que o ID existe.
 */
async function loadOwnedBooking(c: AppContext, id: string) {
  const user = c.get('user')!;
  const booking = await c.get('deps').repos.bookings.findById(id);
  const isOwner = booking?.userId === user.id;
  if (!booking || (!isOwner && !can(user.role, 'booking:read:any'))) {
    if (booking) await audit(c, 'booking.access_denied', { level: 'warn', status: 404, meta: { bookingId: id } });
    throw Errors.notFound('Agendamento');
  }
  return { booking, isOwner };
}

// ---------- Perfil ----------
bookingRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/me/profile',
    tags: ['Perfil'],
    summary: 'Perfil de uso do veículo do usuário autenticado',
    security: bearer,
    middleware: [requireAuth, requirePermission('profile:read:own')] as const,
    responses: {
      200: { description: 'Perfil', content: { 'application/json': { schema: ProfileSchema } } },
      401: problem('Não autenticado'),
      404: problem('Perfil ainda não criado'),
    },
  }),
  async (c) => {
    const p = await c.get('deps').repos.profiles.get(c.get('user')!.id);
    if (!p) throw Errors.notFound('Perfil');
    const { userId: _omit, ...rest } = p;
    return c.json({ ...rest, updatedAt: p.updatedAt.toISOString() }, 200);
  },
);

bookingRoutes.openapi(
  createRoute({
    method: 'put',
    path: '/me/profile',
    tags: ['Perfil'],
    summary: 'Cria ou substitui o perfil de uso',
    security: bearer,
    middleware: [requireAuth, requirePermission('profile:write:own'), rateLimit('api')] as const,
    request: { body: { content: { 'application/json': { schema: ProfileInputSchema } }, required: true } },
    responses: {
      200: { description: 'Perfil salvo', content: { 'application/json': { schema: ProfileSchema } } },
      401: problem('Não autenticado'),
      422: problem('Dados inválidos'),
    },
  }),
  async (c) => {
    const input = c.req.valid('json');
    const saved = await c.get('deps').repos.profiles.upsert({ userId: c.get('user')!.id, ...input });
    await audit(c, 'profile.updated', { status: 200, meta: { fields: Object.keys(input) } });
    const { userId: _omit, ...rest } = saved;
    return c.json({ ...rest, updatedAt: saved.updatedAt.toISOString() }, 200);
  },
);

// ---------- Agendamentos ----------
bookingRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/bookings',
    tags: ['Agendamentos'],
    summary: 'Lista agendamentos (cliente: os próprios; admin: todos)',
    security: bearer,
    middleware: [requireAuth] as const,
    request: { query: PageQuerySchema },
    responses: {
      200: { description: 'Lista paginada', content: { 'application/json': { schema: BookingListSchema } } },
      401: problem('Não autenticado'),
      403: problem('Sem permissão'),
    },
  }),
  async (c) => {
    const user = c.get('user')!;
    const page = c.req.valid('query');
    const { repos } = c.get('deps');
    let result;
    if (can(user.role, 'booking:read:any')) result = await repos.bookings.listAll(page);
    else if (can(user.role, 'booking:read:own')) result = await repos.bookings.listByUser(user.id, page);
    else {
      await audit(c, 'authz.permission_denied', { level: 'warn', status: 403, meta: { permission: 'booking:read' } });
      throw Errors.forbidden();
    }
    return c.json({ items: result.items.map((b) => toDto(c, b)), total: result.total, ...page }, 200);
  },
);

bookingRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/bookings',
    tags: ['Agendamentos'],
    summary: 'Cria agendamento (presencial ou leva e traz)',
    security: bearer,
    middleware: [requireAuth, requirePermission('booking:write:own'), rateLimit('api')] as const,
    request: { body: { content: { 'application/json': { schema: BookingInputSchema } }, required: true } },
    responses: {
      201: { description: 'Agendamento criado', content: { 'application/json': { schema: BookingSchema } } },
      401: problem('Não autenticado'),
      403: problem('Sem permissão'),
      422: problem('Dados inválidos'),
    },
  }),
  async (c) => {
    const input = c.req.valid('json');
    const { repos, cipher } = c.get('deps');
    const booking = await repos.bookings.create({
      userId: c.get('user')!.id, // dono vem do token, nunca do corpo
      dealerId: input.dealerId,
      service: input.service,
      mode: input.mode,
      date: input.date,
      slot: input.slot,
      pickupAddressEnc: input.pickupAddress ? cipher.encrypt(input.pickupAddress) : null,
      notesEnc: input.notes ? cipher.encrypt(input.notes) : null,
    });
    await audit(c, 'booking.created', { status: 201, meta: { bookingId: booking.id, mode: booking.mode } });
    c.header('Location', `/v1/bookings/${booking.id}`);
    return c.json(toDto(c, booking), 201);
  },
);

bookingRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/bookings/{id}',
    tags: ['Agendamentos'],
    summary: 'Detalhe de um agendamento do próprio usuário',
    security: bearer,
    middleware: [requireAuth] as const,
    request: { params: UuidParamSchema },
    responses: {
      200: { description: 'Agendamento', content: { 'application/json': { schema: BookingSchema } } },
      401: problem('Não autenticado'),
      404: problem('Não encontrado (ou não pertence ao usuário)'),
    },
  }),
  async (c) => {
    const { booking } = await loadOwnedBooking(c, c.req.valid('param').id);
    return c.json(toDto(c, booking), 200);
  },
);

bookingRoutes.openapi(
  createRoute({
    method: 'delete',
    path: '/bookings/{id}',
    tags: ['Agendamentos'],
    summary: 'Cancela um agendamento do próprio usuário',
    security: bearer,
    middleware: [requireAuth, requirePermission('booking:write:own')] as const,
    request: { params: UuidParamSchema },
    responses: {
      204: { description: 'Cancelado' },
      401: problem('Não autenticado'),
      404: problem('Não encontrado (ou não pertence ao usuário)'),
      409: problem('Já cancelado'),
    },
  }),
  async (c) => {
    const { booking, isOwner } = await loadOwnedBooking(c, c.req.valid('param').id);
    if (!isOwner) throw Errors.notFound('Agendamento');
    if (booking.status === 'cancelled') throw Errors.conflict('Agendamento já cancelado.');
    await c.get('deps').repos.bookings.cancel(booking.id);
    await audit(c, 'booking.cancelled', { status: 204, meta: { bookingId: booking.id } });
    return c.body(null, 204);
  },
);
