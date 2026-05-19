# Plano de Implementação — Sprint Cybersecurity

## Formato de entrega

Cada milestone gera dois artefatos:
1. **Código** — arquivos criados/modificados conforme descrito abaixo.
2. **Documentação com prints** — seção no `CYBERSECURITY-DOCS.md` descrevendo o que foi aplicado, com capturas de tela do app demonstrando o comportamento (ex: tela de lockout ativada, dados mascarados no dashboard, token expirado redirecionando para login).

---

## M1 — Utilitários de Segurança Base

**Arquivos criados:**
- `src/utils/sanitize.ts` — `sanitizeString(value)`: strip de `< > " ' \`` antes de persistir
- `src/utils/safeError.ts` — `toSafeMessage(err)`: retorna mensagem genérica sem stack/tecnologia
- `src/utils/logger.ts` — suprime logs em produção; redact de `email`, `password`, `token`, `cpf`, `phone` em dev
- `src/utils/rbac.ts` — `hasPermission(user, action)` para as actions: `view:analyst_dashboard`, `view:leads`, `view:wallet`, `edit:profile`
- `src/utils/hmac.ts` — `signPayload(payload, secret)` e `verifyPayload(payload, sig, secret)` via `expo-crypto`
- `src/utils/anonymize.ts` — `maskName(name)` e `maskEmail(email)`

**Prints para documentação:**
- Console dev mostrando log com campo `[REDACTED]`
- Console produção mostrando ausência de logs

---

## M2 — Autenticação Segura (JWT + Lockout)

**Arquivos modificados:**
- `src/services/mocks/authApi.ts` — `makeToken()` substituído por mock-JWT com `header.payload.signature` em base64url, campos `sub`, `role`, `iat`, `exp: iat + 3600`
- `src/stores/useAuthStore.ts`:
  - `hydrate()`: decodificar payload do JWT, verificar `exp`; se expirado → `clearSession()` + status `unauthenticated`
  - `login()`: integrar com `useAuditStore` para registrar `login` e `login_failed`
  - `logout()`: limpar todos os stores (`useUserStore.clearProfile()`, `useSchedulingStore.clearBookings()`, `useWalletStore` reset)
- `app/(auth)/login.tsx` — UI de lockout: contador regressivo visível, botão desabilitado, mensagem "Tente novamente em Xs"

**Prints para documentação:**
- Token JWT estruturado visível no SecureStore (via Expo DevTools ou log redacted)
- Tela de login com lockout ativo e contador regressivo
- Redirecionamento automático após token expirado

---

## M3 — Proteção de Dados em Repouso (SecureStore)

**Arquivos modificados:**
- `src/stores/useUserStore.ts` — trocar `AsyncStorage` por `secureStorage` (SecureStore nativo)
- `src/stores/useSchedulingStore.ts` — trocar `AsyncStorage` por `secureStorage`
- Validação Zod no restore: substituir `JSON.parse(raw) as Type` por `schema.safeParse(JSON.parse(raw))` com fallback seguro em ambos os stores

**Prints para documentação:**
- Demonstração via Expo DevTools ou Android Studio que o dado não é legível em texto plano no dispositivo
- Comportamento com dado corrompido: app não crasha, retorna estado inicial

---

## M4 — Validação de Inputs e Sanitização

**Arquivos modificados:**
- `app/(auth)/signup.tsx` — senha mínima 8 chars (antes: 6), campo `name` com `maxLength={100}`
- `app/(auth)/onboarding/step-*.tsx` — schemas Zod em cada step; campos de texto com `maxLength`
- `app/scheduling/*.tsx` — Zod para endereço (max 200 chars), campos livres com `sanitizeString()` antes de `updateDraft()`
- `src/services/mocks/*.ts` — verificação HMAC: mock recusa payload com assinatura inválida

**Prints para documentação:**
- Erro de validação Zod visível na tela (campo com mensagem inline)
- Tentativa de submit com string acima do maxLength: bloqueado
- Log do mock rejeitando payload com HMAC inválido

---

## M5 — RBAC e Controle de Acesso

**Arquivos modificados:**
- `src/hooks/useProtectedRoute.ts` — usar `hasPermission()` ao invés de checar `user?.role === 'analyst'` diretamente
- `src/features/analyst-dashboard/*.tsx` — guard de `hasPermission(user, 'view:analyst_dashboard')` e `hasPermission(user, 'view:leads')`
- `src/features/cashback/*.tsx` — guard de `hasPermission(user, 'view:wallet')`
- `src/features/analyst-dashboard/LeadCard.tsx` — aplicar `maskName()` e `maskEmail()` nos campos exibidos

**Prints para documentação:**
- Usuário com role `client` tentando acessar dashboard: redirect capturado
- LeadCard com dados mascarados vs dados completos (se tiver toggle de reveal)
- Log do `useAuditStore` registrando `permission_denied`

---

## M6 — Audit Store e Security Events no Dashboard

**Arquivos criados:**
- `src/stores/useAuditStore.ts` — store Zustand in-memory com array de `AuditEvent[]`:
  ```ts
  type AuditEvent = {
    id: string
    timestamp: string        // ISO 8601
    event: AuditEventType
    userId?: string
    meta?: Record<string, unknown>
  }

  type AuditEventType =
    | 'login'
    | 'logout'
    | 'login_failed'
    | 'token_expired'
    | 'permission_denied'
    | 'lockout_activated'
    | 'lockout_lifted'
  ```
  - Máximo de 50 eventos (FIFO)
  - Sem persistência (limpa ao fechar o app — intencional)

**Arquivos modificados:**
- `app/(analyst)/dashboard.tsx` — nova seção "Security Events" com lista dos últimos eventos, badge colorido por tipo, timestamp formatado

**Prints para documentação:**
- Dashboard do analista com seção Security Events visível
- Sequência de eventos após login + tentativas falhas + lockout

---

## Ordem de execução recomendada

```
M1 (utilitários) → M2 (JWT + lockout) → M3 (SecureStore) → M4 — Validação de Inputs e Sanitização → M5 (RBAC) → M6 (audit)
```

M1 é pré-requisito para todos os outros. M2 e M3 podem rodar em paralelo após M1. M5 depende de M1. M6 depende de M2 (eventos de login).

---

## Checklist de verificação final

- [ ] Login com token expirado redireciona para login
- [ ] 5 tentativas falhas ativam lockout de 60s com UI
- [ ] Logout limpa SecureStore completamente (profile, bookings, wallet)
- [ ] Campos com string acima do maxLength não passam pela validação
- [ ] Console em `__DEV__ = false` não exibe nenhum log
- [ ] Usuário `client` acessando rota `(analyst)` é redirecionado
- [ ] LeadCard exibe dados mascarados
- [ ] Dashboard do analista exibe seção Security Events
- [ ] Mock rejeita payload com HMAC incorreto
- [ ] Dados corrompidos no SecureStore não crasham o app
