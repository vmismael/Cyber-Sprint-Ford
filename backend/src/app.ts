import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import type { AppContext, AppEnv, Deps } from './context.js';
import { ApiError } from './lib/errors.js';
import { authRoutes } from './routes/auth.js';
import { backofficeRoutes } from './routes/backoffice.js';
import { bookingRoutes } from './routes/bookings.js';
import { audit } from './services/audit.js';

function problemResponse(c: AppContext, err: ApiError) {
  for (const [k, v] of Object.entries(err.headers)) c.header(k, v);
  return c.json(
    {
      type: 'about:blank',
      title: err.title,
      status: err.status,
      ...(err.detail ? { detail: err.detail } : {}),
      requestId: c.get('requestId'),
      ...err.extra,
    },
    err.status,
    { 'Content-Type': 'application/problem+json' },
  );
}

export function createApp(deps: Deps) {
  const app = new OpenAPIHono<AppEnv>({
    // Erro de validação vira 422 padronizado. Só devolve caminho + mensagem,
    // nunca o valor recebido (evita refletir input malicioso ou dado pessoal).
    defaultHook: (result) => {
      if (!result.success) {
        throw new ApiError(422, 'Unprocessable Entity', 'Dados inválidos.', {}, {
          errors: result.error.issues.map((i) => ({ path: i.path.join('.') || '(body)', message: i.message })),
        });
      }
    },
  });

  const docsEnabled = deps.env.DOCS_ENABLED ?? deps.env.NODE_ENV !== 'production';

  // ---------- Middlewares globais (a ordem importa) ----------
  app.use('*', requestId({ limitLength: 64 }));
  app.use('*', async (c, next) => {
    c.set('deps', deps);
    await next();
  });

  // Log de acesso estruturado: uma linha JSON por requisição.
  app.use('*', async (c, next) => {
    const start = performance.now();
    await next();
    deps.logger.info('http.request', {
      requestId: c.get('requestId'),
      method: c.req.method,
      route: c.req.routePath,
      status: c.res.status,
      latencyMs: Math.round(performance.now() - start),
      userId: c.get('user')?.id ?? null,
    });
  });

  app.use(
    '*',
    secureHeaders({
      strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
      xFrameOptions: 'DENY',
      referrerPolicy: 'no-referrer',
      crossOriginResourcePolicy: 'same-origin',
      // API só devolve JSON: CSP fechada. A página /docs recebe CSP própria abaixo.
      contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    }),
  );

  // App nativo não envia Origin (CORS não se aplica). Para a versão web, só origens da allowlist.
  app.use(
    '*',
    cors({
      origin: (origin) => (deps.env.ALLOWED_ORIGINS.includes(origin) ? origin : null),
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Location', 'Retry-After', 'RateLimit-Remaining', 'X-Request-Id'],
      maxAge: 600,
    }),
  );

  app.use(
    '*',
    bodyLimit({
      maxSize: 32 * 1024,
      onError: () => {
        throw new ApiError(413, 'Payload Too Large', 'Corpo da requisição excede 32 KB.');
      },
    }),
  );

  // ---------- Rotas ----------
  app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  app.openapi(
    createRoute({
      method: 'get',
      path: '/v1/health',
      tags: ['Sistema'],
      summary: 'Verificação de disponibilidade (sem detalhes internos)',
      responses: {
        200: { description: 'OK', content: { 'application/json': { schema: z.object({ status: z.literal('ok') }) } } },
      },
    }),
    (c) => c.json({ status: 'ok' as const }, 200),
  );

  app.route('/v1', authRoutes);
  app.route('/v1', bookingRoutes);
  app.route('/v1', backofficeRoutes);

  if (docsEnabled) {
    app.doc31('/v1/openapi.json', {
      openapi: '3.1.0',
      info: {
        title: 'Ford Intelligence API',
        version: '1.0.0',
        description:
          'API REST do Ford Intelligence. Autenticação por JWT (Bearer), RBAC com três perfis (client, analyst, admin) e erros no formato application/problem+json.',
      },
    });
    app.use('/docs', async (c, next) => {
      await next();
      c.header(
        'Content-Security-Policy',
        "default-src 'none'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'",
      );
    });
    app.get('/docs', swaggerUI({ url: '/v1/openapi.json' }));
  }

  // ---------- Erros ----------
  app.notFound((c) => problemResponse(c, new ApiError(404, 'Not Found', 'Rota não encontrada.')));

  app.onError(async (err, c) => {
    if (err instanceof ApiError) return problemResponse(c, err);
    if (err instanceof HTTPException) {
      // Ex.: JSON malformado, Content-Type ausente. Mensagem genérica por status.
      const titles: Record<number, string> = { 400: 'Bad Request', 415: 'Unsupported Media Type' };
      return problemResponse(c, new ApiError(err.status as 400, titles[err.status] ?? 'Bad Request', 'Requisição inválida.'));
    }
    // Erro inesperado: detalhe só no log do servidor, cliente recebe mensagem genérica.
    deps.logger.error('system.unhandled_error', {
      requestId: c.get('requestId'),
      errorName: err.name,
      errorMessage: err.message,
      stack: deps.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
    await audit(c, 'system.unhandled_error', { level: 'error', status: 500 });
    return problemResponse(c, new ApiError(500, 'Internal Server Error', 'Erro interno. Tente novamente mais tarde.'));
  });

  return app;
}
