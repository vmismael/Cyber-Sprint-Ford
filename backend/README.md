# Ford Intelligence API

API REST do Ford Intelligence. Substitui os mocks do app em autenticação e concentra as decisões de segurança no servidor: autenticação JWT, RBAC com três perfis, validação de entrada, rate limit e trilha de auditoria.

**Stack:** Hono (TypeScript) na Vercel · Zod + OpenAPI 3.1 · PostgreSQL (Supabase) · jose (JWT) · bcrypt

## Rodar localmente

```bash
cd backend
npm ci
cp .env.example .env        # preencha os segredos (comandos openssl no próprio arquivo)
npm run dev                 # http://localhost:3333 — Swagger em http://localhost:3333/docs
```

Sem `DATABASE_URL`, a API sobe com armazenamento em memória, suficiente para testar os fluxos. Com banco:

```bash
npm run db:migrate          # aplica db/migrations (idempotente)
npm run db:seed             # cria admin, analista e leads fictícios (senhas vêm do .env)
```

## Testes

```bash
npm test                    # 36 testes: autenticação, JWT, RBAC, IDOR, hardening e logs
npm run typecheck
```

## Deploy na Vercel

1. Crie um projeto na Vercel apontando para este repositório com **Root Directory = `backend`**. O Hono é detectado sem configuração.
2. Em *Settings > Environment Variables*, cadastre as variáveis do `.env.example` com valores **diferentes** para Production e Preview. Use o *Transaction pooler* do Supabase (porta 6543) em `DATABASE_URL`.
3. O `vercel.json` desliga o deploy automático pelo Git: produção só recebe código pelo job `deploy` do pipeline, depois de todos os portões de segurança. Cadastre no GitHub os secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` e crie o environment `production` com aprovador obrigatório.

No app, defina `EXPO_PUBLIC_API_URL=https://<seu-projeto>.vercel.app` para sair do modo mock.

## Endpoints

| Método | Rota | Acesso |
|---|---|---|
| GET | `/v1/health` | Público |
| POST | `/v1/auth/register` · `/login` · `/refresh` | Público (rate limit por IP) |
| POST | `/v1/auth/logout` · GET `/v1/me` | Autenticado |
| GET · PUT | `/v1/me/profile` | Dono |
| GET · POST | `/v1/bookings` | Cliente (os próprios) · admin (todos) |
| GET · DELETE | `/v1/bookings/{id}` | Dono (404 para os demais) |
| GET | `/v1/leads` · `/v1/leads/{id}` | Analista, admin (dados mascarados) |
| GET | `/v1/admin/users` · `/v1/admin/audit-events` | Admin |
| PATCH | `/v1/admin/users/{id}/role` | Admin |

Erros seguem o formato `application/problem+json` (RFC 9457) com `requestId` para correlacionar com os logs.

## Controles de segurança

| Controle | Onde |
|---|---|
| JWT HS256 com algoritmo, issuer e audience fixos; 15 min de validade | `src/lib/jwt.ts` |
| Refresh token opaco, salvo como hash, com rotação e detecção de reuso | `src/services/auth.ts` |
| Bloqueio de conta após 5 falhas (15 min), persistido no banco | `src/services/auth.ts` |
| Perfil lido do banco a cada requisição; matriz RBAC negando por padrão | `src/middleware/security.ts`, `src/security/rbac.ts` |
| Checagem de posse do recurso (IDOR) | `src/routes/bookings.ts` |
| Schemas estritos (campo extra = 422, bloqueia mass assignment) | `src/schemas/index.ts` |
| Endereço de coleta cifrado com AES-256-GCM | `src/lib/crypto.ts` |
| Cabeçalhos de segurança, CORS por allowlist, limite de 32 KB | `src/app.ts` |
| Logs JSON com redação de PII e IP em HMAC | `src/lib/logger.ts`, `src/services/audit.ts` |
| Trilha de auditoria imutável e retenção automática | `db/migrations/001_init.sql` |
| Configuração validada na inicialização (fail fast) | `src/config/env.ts` |

## Restaurar um backup

O workflow `scheduled-security` gera diariamente um dump cifrado (artefato `db-backup`, retenção de 7 dias).

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE \
  -in ford-AAAAMMDDTHHMMZ.dump.enc -out restore.dump
pg_restore --no-owner --clean --if-exists -d "$DATABASE_URL_HOMOLOGACAO" restore.dump
```

Restaure sempre primeiro em um banco de homologação e confira as contagens das tabelas antes de qualquer ação em produção.
