import { z } from '@hono/zod-openapi';
import { ROLES } from '../security/rbac.js';
import { DELIVERY_MODES, SERVICE_KINDS } from '../repositories/types.js';

/**
 * Todos os schemas de entrada são estritos: campo desconhecido = 422.
 * Isso bloqueia mass assignment (ex.: mandar "role": "admin" no cadastro).
 */

// ---------- Comuns ----------
export const ProblemSchema = z
  .object({
    type: z.string().openapi({ example: 'about:blank' }),
    title: z.string().openapi({ example: 'Forbidden' }),
    status: z.number().int().openapi({ example: 403 }),
    detail: z.string().optional().openapi({ example: 'Você não tem permissão para esta ação.' }),
    requestId: z.string().optional(),
    errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  })
  .openapi('Problem');

export const problem = (description: string) => ({
  description,
  content: { 'application/problem+json': { schema: ProblemSchema } },
});

export const PageQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(100).default(20).openapi({ example: 20 }),
  offset: z.coerce.number().int().min(0).max(10_000).default(0).openapi({ example: 0 }),
});

export const UuidParamSchema = z.strictObject({
  id: z.uuid().openapi({ param: { name: 'id', in: 'path' }, example: '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f' }),
});

// ---------- Auth ----------
const email = z
  .email('E-mail inválido.')
  .max(254)
  .transform((v) => v.trim().toLowerCase())
  .openapi({ example: 'cliente@exemplo.com' });

const password = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .max(72, 'A senha pode ter no máximo 72 caracteres.') // limite do bcrypt
  .regex(/[A-Za-z]/, 'A senha precisa ter ao menos uma letra.')
  .regex(/\d/, 'A senha precisa ter ao menos um número.')
  .openapi({ example: 'Senha1234' });

export const RegisterSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[\p{L}][\p{L}\s'.-]*$/u, 'Nome contém caracteres inválidos.')
      .openapi({ example: 'Maria Souza' }),
    email,
    password,
  })
  .openapi('RegisterRequest');

export const LoginSchema = z
  .strictObject({ email, password: z.string().min(1).max(72) })
  .openapi('LoginRequest');

export const RefreshSchema = z
  .strictObject({ refreshToken: z.string().min(20).max(200) })
  .openapi('RefreshRequest');

export const UserSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    email: z.string(),
    role: z.enum(ROLES),
  })
  .openapi('User');

export const TokenPairSchema = z
  .object({
    accessToken: z.string(),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().openapi({ example: 900 }),
    refreshToken: z.string(),
    user: UserSchema,
  })
  .openapi('TokenPair');

// ---------- Perfil ----------
export const ProfileInputSchema = z
  .strictObject({
    vehicleModel: z.enum(['ranger', 'maverick', 'territory', 'mustang', 'raptor']),
    usageStyle: z.enum(['urban', 'rural', 'mixed', 'performance']),
    monthlyKm: z.number().int().min(0).max(50_000),
    plan: z.enum(['agro', 'urban', 'premium']),
  })
  .openapi('ProfileInput');

export const ProfileSchema = ProfileInputSchema.extend({ updatedAt: z.string() }).openapi('Profile');

// ---------- Agendamentos ----------
const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // bloqueia caracteres de controle e marcação HTML
    .regex(/^[^<>\u0000-\u001F]*$/, 'Texto contém caracteres não permitidos.');

export const BookingInputSchema = z
  .strictObject({
    dealerId: z.string().regex(/^[a-z0-9_-]{2,40}$/i).openapi({ example: 'dealer_sp_01' }),
    service: z.enum(SERVICE_KINDS),
    mode: z.enum(DELIVERY_MODES),
    date: z.iso.date().openapi({ example: '2026-10-05' }),
    slot: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).openapi({ example: '09:30' }),
    pickupAddress: safeText(200).min(5).optional(),
    notes: safeText(500).optional(),
  })
  .refine((b) => b.mode !== 'pickup-delivery' || !!b.pickupAddress, {
    message: 'Endereço de coleta é obrigatório no leva e traz.',
    path: ['pickupAddress'],
  })
  .openapi('BookingInput');

export const BookingSchema = z
  .object({
    id: z.uuid(),
    protocol: z.string(),
    dealerId: z.string(),
    service: z.enum(SERVICE_KINDS),
    mode: z.enum(DELIVERY_MODES),
    date: z.string(),
    slot: z.string(),
    pickupAddress: z.string().nullable(),
    notes: z.string().nullable(),
    status: z.enum(['confirmed', 'cancelled']),
    createdAt: z.string(),
  })
  .openapi('Booking');

export const BookingListSchema = z
  .object({ items: z.array(BookingSchema), total: z.number().int(), limit: z.number().int(), offset: z.number().int() })
  .openapi('BookingList');

// ---------- Leads ----------
export const LeadSchema = z
  .object({
    id: z.string(),
    clientName: z.string().openapi({ example: 'C**** E***** M*****' }),
    vehicleModel: z.string(),
    plan: z.string(),
    service: z.string(),
    aiScore: z.number(),
    riskLabel: z.enum(['baixo', 'moderado', 'alto']),
    lastActivity: z.string(),
    status: z.string(),
    estimatedRevenue: z.number(),
  })
  .openapi('Lead');

export const LeadDetailSchema = LeadSchema.extend({
  email: z.string().openapi({ example: 'c***@e***.com' }),
  phone: z.string().openapi({ example: '(**) *****-4321' }),
  vehicleYear: z.number().int(),
  odometerKm: z.number().int(),
}).openapi('LeadDetail');

export const LeadQuerySchema = PageQuerySchema.extend({
  risk: z.enum(['baixo', 'moderado', 'alto']).optional(),
});

// ---------- Administração ----------
export const RoleUpdateSchema = z.strictObject({ role: z.enum(ROLES) }).openapi('RoleUpdate');

export const AuditQuerySchema = PageQuerySchema.extend({
  event: z.string().regex(/^[a-z_.]{3,60}$/).optional(),
});

export const AuditEventSchema = z
  .object({
    id: z.string(),
    timestamp: z.string(),
    level: z.string(),
    event: z.string(),
    userId: z.string().nullable(),
    role: z.string().nullable(),
    requestId: z.string().nullable(),
    ipHash: z.string().nullable(),
    route: z.string().nullable(),
    status: z.number().nullable(),
    meta: z.record(z.string(), z.unknown()),
  })
  .openapi('AuditEvent');
