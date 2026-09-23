import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AppEnv } from '../context';
import { rateLimit, requireAuth } from '../middleware/security';
import { LoginSchema, RefreshSchema, RegisterSchema, TokenPairSchema, UserSchema, problem } from '../schemas';
import * as auth from '../services/auth';

export const authRoutes = new OpenAPIHono<AppEnv>();

const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } }, required: true });

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/auth/register',
    tags: ['Auth'],
    summary: 'Cria conta de cliente',
    middleware: [rateLimit('auth')] as const,
    request: { body: json(RegisterSchema) },
    responses: {
      201: { description: 'Conta criada', content: { 'application/json': { schema: TokenPairSchema } } },
      409: problem('E-mail já cadastrado'),
      422: problem('Dados inválidos'),
      429: problem('Limite de tentativas'),
    },
  }),
  async (c) => c.json(await auth.register(c, c.req.valid('json')), 201),
);

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/auth/login',
    tags: ['Auth'],
    summary: 'Autentica e devolve access token (JWT) + refresh token',
    middleware: [rateLimit('auth')] as const,
    request: { body: json(LoginSchema) },
    responses: {
      200: { description: 'Autenticado', content: { 'application/json': { schema: TokenPairSchema } } },
      401: problem('Credenciais inválidas'),
      422: problem('Dados inválidos'),
      429: problem('Conta bloqueada ou limite de tentativas'),
    },
  }),
  async (c) => c.json(await auth.login(c, c.req.valid('json')), 200),
);

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/auth/refresh',
    tags: ['Auth'],
    summary: 'Troca o refresh token por um novo par (rotação)',
    middleware: [rateLimit('auth')] as const,
    request: { body: json(RefreshSchema) },
    responses: {
      200: { description: 'Novo par de tokens', content: { 'application/json': { schema: TokenPairSchema } } },
      401: problem('Refresh token inválido, expirado ou reutilizado'),
      429: problem('Limite de tentativas'),
    },
  }),
  async (c) => c.json(await auth.refresh(c, c.req.valid('json').refreshToken), 200),
);

authRoutes.openapi(
  createRoute({
    method: 'post',
    path: '/auth/logout',
    tags: ['Auth'],
    summary: 'Revoga a sessão (refresh token informado) ou todas as sessões do usuário',
    security: [{ bearerAuth: [] }],
    middleware: [requireAuth] as const,
    request: {
      body: { content: { 'application/json': { schema: RefreshSchema.partial() } }, required: false },
    },
    responses: {
      204: { description: 'Sessão encerrada' },
      401: problem('Não autenticado'),
    },
  }),
  async (c) => {
    await auth.logout(c, c.req.valid('json')?.refreshToken);
    return c.body(null, 204);
  },
);

authRoutes.openapi(
  createRoute({
    method: 'get',
    path: '/me',
    tags: ['Auth'],
    summary: 'Usuário autenticado',
    security: [{ bearerAuth: [] }],
    middleware: [requireAuth] as const,
    responses: {
      200: { description: 'Usuário', content: { 'application/json': { schema: UserSchema } } },
      401: problem('Não autenticado'),
    },
  }),
  (c) => c.json(auth.publicUser(c.get('user')!), 200),
);
