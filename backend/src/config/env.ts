import { z } from 'zod';

/**
 * Configuração validada na inicialização. Se um segredo obrigatório estiver
 * ausente ou fraco, a API não sobe (fail fast) em vez de rodar insegura.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    // 32+ caracteres gerados com `openssl rand -base64 48`
    JWT_SECRET: z.string().min(32, 'precisa ter pelo menos 32 caracteres'),
    JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
    REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
    // 32 bytes em base64 (`openssl rand -base64 32`) — cifra campos sensíveis no banco
    DATA_ENCRYPTION_KEY: z
      .string()
      .refine((v) => Buffer.from(v, 'base64').length === 32, 'deve ter 32 bytes em base64'),
    // Sal do hash de IP nos logs (LGPD: correlaciona ataques sem guardar o IP)
    LOG_IP_SALT: z.string().min(16, 'precisa ter pelo menos 16 caracteres'),
    DATABASE_URL: z.string().url().optional(),
    ALLOWED_ORIGINS: z
      .string()
      .default('')
      .transform((v) =>
        v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    DOCS_ENABLED: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && !env.DATABASE_URL) {
      ctx.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'obrigatório em produção' });
    }
  });

export type Env = z.output<typeof envSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    // A mensagem cita só o nome da variável, nunca o valor.
    const fields = parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ');
    throw new Error(`Configuração inválida: ${fields}`);
  }
  return parsed.data;
}
