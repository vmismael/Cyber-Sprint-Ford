# Sprint Cybersecurity — Análise de Implementação

## Contexto do app

React Native + Expo, 100% client-side. Não há backend real — todas as APIs são mockadas em `src/services/mocks/`. Esse detalhe filtra boa parte do sprint: requisitos que assumem a existência de um servidor não têm como ser implementados de forma real no cliente.

---

## 1. Segurança de Entrada e Validação de Dados — 20 pts

### Validação de entradas do usuário (SQL Injection, XSS, command injection)

**IMPLEMENTAR.**

Zod já existe nos forms de login/signup. Falta expandir para todos os demais formulários (onboarding steps 1–5, scheduling: endereço, service selection, agendamento).

Criar `src/utils/sanitize.ts` com função que faz strip de caracteres perigosos (`<`, `>`, `"`, `'`, `` ` ``) antes de qualquer string ser persistida em store. Em React Native não existe DOM, então XSS clássico não se aplica, mas a sanitização protege a integridade dos dados armazenados localmente.

### Normalização e validação de parâmetros de API

**IMPLEMENTAR.**

Criar schemas Zod para validar o payload *antes* de enviar para os mocks. Se um campo vier fora do shape esperado (ex: `vehicleModel` com valor arbitrário ao invés de um dos 5 modelos permitidos), a chamada deve falhar imediatamente com erro tipado.

### Limitação de tamanho e formato de entrada

**IMPLEMENTAR.**

Adicionar `.max()` nos schemas Zod e `maxLength` nos inputs:
- Nome: 100 chars
- Email: 254 chars (RFC 5321)
- Endereço: 200 chars
- Campos numéricos: limites razoáveis (ex: `monthlyKm` entre 0 e 50.000)

### Tratamento seguro de erros

**IMPLEMENTAR.**

Criar `src/utils/safeError.ts` com `toSafeMessage(err): string` que:
- Nunca retorna `err.stack`
- Nunca expõe nomes de função, arquivos ou tecnologia
- Retorna mensagens genéricas para erros não reconhecidos

Auditar todos os `catch` blocks do projeto para usar essa função.

Também adicionar validação Zod no *restore* dos dados: hoje `JSON.parse(raw) as Type` é usado sem validação — dados corrompidos crasham o app silenciosamente. Parsear com `.safeParse()` do Zod antes de usar.

---

## 2. Autenticação e Autorização — 20 pts

### JWT com expiração, assinatura forte e renovação controlada

**IMPLEMENTAR (mock).**

O `makeToken()` atual gera `mock.random.timestamp` — string sem estrutura. Substituir por mock-JWT real:

```
header.payload.signature  (todos base64url)

header:  { alg: "HS256", typ: "JWT" }
payload: { sub: userId, role, iat, exp: iat + 3600 }
signature: base64url(HMAC-SHA256(header.payload, secret))
```

No `useAuthStore.hydrate()`, decodificar o payload do token e verificar se `exp` já passou. Se sim, limpar sessão e forçar login. Isso demonstra o conceito de expiração de sessão corretamente.

### RBAC — controle de acesso baseado em papéis

**IMPLEMENTAR.**

Hoje a verificação de role está espalhada no código (`user?.role === 'analyst'` em múltiplos lugares). Centralizar em `src/utils/rbac.ts`:

```ts
hasPermission(user, 'view:analyst_dashboard')
hasPermission(user, 'view:leads')
hasPermission(user, 'view:wallet')
hasPermission(user, 'edit:profile')
```

Usar esse guard nos componentes do analyst dashboard, wallet e scheduling.

---

## 3. Proteção de APIs e Serviços — 20 pts

### HTTPS/TLS 1.2+

**NÃO IMPLEMENTAR como código — apenas documentar.**

TLS é gerenciado pelo sistema operacional e pelo servidor, não pelo cliente mobile. O Expo usa automaticamente o TLS do SO (Android/iOS). Não existe API no React Native para "configurar TLS 1.2". O que é possível e já está correto: garantir que `EXPO_PUBLIC_API_BASE_URL` use `https://`. Adicionar uma verificação no boot que emite warning se a URL for `http://`.

### Rate limiting e throttling

**NÃO IMPLEMENTAR como segurança real.**

Rate limiting é server-side. Um "rate limiter" no cliente pode ser ignorado por qualquer atacante que não use o app. O que é razoável: debounce de 1s no botão de login para evitar spam acidental de UX. Isso não é segurança — é UX.

O lockout local (5 tentativas → bloqueio 60s) vai no item de Monitoramento, pois é o contexto mais correto.

### CORS

**NÃO IMPLEMENTAR. Não se aplica.**

CORS é uma política de browser que restringe scripts de origens diferentes. React Native não roda em browser e não tem o conceito de "origem". Apps nativos não são afetados por CORS e não há como configurá-lo no cliente.

### Assinatura/verificação de integridade de payloads (5 pts)

**IMPLEMENTAR.**

Criar `src/utils/hmac.ts` usando `expo-crypto` (disponível no Expo sem dependência extra). Antes de cada chamada para os mocks, assinar o payload:

```ts
const sig = await signPayload(payload, SECRET_KEY);
// mock recebe: { ...payload, _sig: sig }
// mock verifica: await verifyPayload(payload, sig, SECRET_KEY)
```

Demonstra o conceito de integridade de dados em trânsito.

---

## 4. Segurança de Dados e Privacidade — 25 pts

### Criptografia de dados sensíveis em repouso

**IMPLEMENTAR.**

Hoje o perfil do usuário (`ford.user.profile`) e bookings estão em `AsyncStorage` — texto plano, sem criptografia. Mover para `SecureStore`:
- Android: AES-256 via Android Keystore
- iOS: Keychain Services

Arquivos afetados: `useUserStore.ts`, `useSchedulingStore.ts`.

### Política de retenção e descarte seguro

**IMPLEMENTAR PARCIALMENTE.**

A parte que compete ao cliente: garantir que o logout limpa *todos* os dados locais — não só o token de auth, mas também perfil, bookings, wallet state. Hoje o logout limpa só auth. Adicionar limpeza completa de todos os stores.

A política de quanto tempo o *servidor* retém dados é compliance/legal e está fora do escopo deste app.

### Anonimização/pseudonimização de dados pessoais

**IMPLEMENTAR PARCIALMENTE.**

O requisito menciona dois contextos: modelos de ML e dashboards.

**ML — não implementar.** O `CLAUDE.md` do projeto exclui explicitamente Python/Scikit-learn do escopo. O `riskScore` é um número calculado localmente a partir de `monthlyKm` e `usageStyle`, sem PII envolvido.

**Dashboard do analista — implementar.** O `LeadCard` no dashboard exibe nome e email de clientes reais (dados sensíveis). Criar `src/utils/anonymize.ts` com `maskName()` e `maskEmail()` e aplicar na renderização dos leads:
- `João Silva` → `J*** S***`
- `joao@gmail.com` → `j***@g***.com`

Isso é implementável, está em escopo e atende diretamente ao requisito.

### Proteção contra exposição acidental de dados

**IMPLEMENTAR.**

Criar `src/utils/logger.ts`:
- Em produção (`!__DEV__`): suprime todos os logs
- Em desenvolvimento: filtra campos sensíveis antes de logar — `email`, `password`, `token`, `cpf`, `phone` → `[REDACTED]`
- Formato estruturado: `{ level, event, timestamp, data }`

---

## 5. Monitoramento, Logs e Auditoria — 15 pts

### Logs estruturados e seguros

**IMPLEMENTAR.**

O `logger.ts` do item anterior cobre esse ponto. Métodos: `logger.info()`, `logger.warn()`, `logger.security()`. Nunca expõe dados sensíveis, nunca loga em produção.

### Monitoramento de eventos suspeitos

**IMPLEMENTAR (client-side).**

Criar `src/stores/useAuditStore.ts` (Zustand, in-memory) que registra eventos de segurança:

```ts
type AuditEvent = {
  id: string;
  timestamp: string;
  event: 'login' | 'logout' | 'login_failed' | 'token_expired' | 'permission_denied';
  userId?: string;
  meta?: Record<string, unknown>;
};
```

**Lockout local:** após 5 tentativas de login falhas em sequência, bloquear por 60 segundos. Baseado em timestamp, não em contador persistido (reset ao fechar o app — comportamento aceitável para um MVP).

### Trilha de auditoria para ações críticas

**IMPLEMENTAR (mock).**

O `useAuditStore` registra: login, logout, falhas de login, expiração de token, tentativas de acesso negado por RBAC.

Expor uma seção "Security Events" no dashboard do analista (`/(analyst)/dashboard`) com lista dos últimos N eventos — timestamp, tipo do evento, user ID.

Monitoramento real (SIEM, backend) está fora do escopo pois não há servidor.

---

## Resumo executivo

| Requisito | Decisão | Justificativa |
|---|---|---|
| Sanitização e validação de inputs | ✅ SIM | Zod já existe; expandir para todos os forms |
| Limitação de tamanho (maxLength) | ✅ SIM | Adicionado nos schemas Zod e nos inputs |
| Tratamento seguro de erros | ✅ SIM | `safeError.ts` + auditoria dos catch blocks |
| Validação Zod no restore (SecureStore) | ✅ SIM | Evita crashes por dados corrompidos |
| Mock JWT com expiração | ✅ SIM | Demonstra conceito corretamente |
| RBAC centralizado | ✅ SIM | `rbac.ts` com `hasPermission()` |
| Assinatura HMAC de payloads | ✅ SIM | `expo-crypto` disponível; 5 pts na rubrica |
| Mover perfil/bookings para SecureStore | ✅ SIM | Upgrade real de segurança nos dados locais |
| Logger com PII redaction | ✅ SIM | Simples e com impacto real |
| Lockout local (5 tentativas / 60s) | ✅ SIM | Proteção real contra brute-force manual |
| Audit store + seção no dashboard | ✅ SIM | Demonstra o conceito de auditoria |
| HTTPS/TLS 1.2 como código | ❌ NÃO | Server-side; não configurável no cliente mobile |
| Rate limiting real | ❌ NÃO | Server-side; client-side seria teatro sem efeito |
| CORS | ❌ NÃO | Não existe em React Native; conceito de browser |
| Política de retenção (servidor) | ❌ NÃO | Compliance/legal; escopo de backend |
| Anonimização para ML | ❌ NÃO | ML fora do escopo; riskScore não tem PII |
| Anonimização no dashboard (leads) | ✅ SIM | LeadCard exibe PII; maskName/maskEmail no display |

---

## Arquivos a criar

```
src/utils/sanitize.ts       — strip de chars perigosos em strings
src/utils/safeError.ts      — toSafeMessage(err) sem stack trace
src/utils/rbac.ts           — hasPermission(user, action)
src/utils/hmac.ts           — signPayload / verifyPayload com expo-crypto
src/utils/logger.ts         — logs estruturados com PII redaction
src/utils/anonymize.ts      — maskName() e maskEmail() para o dashboard
src/stores/useAuditStore.ts — eventos de segurança + lockout
```

## Arquivos a modificar

```
src/services/secureStorage.ts          — sem alteração estrutural necessária
src/services/mocks/authApi.ts          — makeToken() → mock JWT estruturado
src/services/mocks/*.ts                — adicionar verificação HMAC
src/stores/useAuthStore.ts             — verificar exp do JWT no hydrate + logout completo
src/stores/useUserStore.ts             — trocar AsyncStorage por SecureStore
src/stores/useSchedulingStore.ts       — trocar AsyncStorage por SecureStore
src/hooks/useProtectedRoute.ts         — usar hasPermission() do rbac.ts
app/(auth)/login.tsx                   — UI de lockout (contador regressivo)
app/(auth)/signup.tsx                  — schema Zod + maxLength
app/(auth)/onboarding/step-*.tsx       — schemas Zod + maxLength
app/scheduling/*.tsx                   — schemas Zod + sanitize nos campos livres
app/(analyst)/dashboard.tsx            — seção Security Events
```
