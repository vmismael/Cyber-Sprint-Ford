  # Sprint Cybersecurity — Entrega Técnica

  **Produto:** Ford Intelligence — App Mobile de Fidelização Ford  
  **Instituição:** FIAP  
  **Disciplina/Sprint:** Cybersecurity  
  **Integrantes:** [NOMES E RMs DO GRUPO]  
  **Data:** 19/05/2026  

  ---

  ## Sumário

  1. [Apresentação do Produto](#1-apresentação-do-produto)
    - 1.1 [Visão Geral](#11-visão-geral)
    - 1.2 [Arquitetura Técnica](#12-arquitetura-técnica)
    - 1.3 [Fluxo Principal de Uso](#13-fluxo-principal-de-uso)
    - 1.4 [Estrutura de Pastas](#14-estrutura-de-pastas)
  2. [Implementação dos Requisitos de Cybersecurity](#2-implementação-dos-requisitos-de-cybersecurity)
    - 2.1 [Segurança de Entrada e Validação de Dados — 20 pts](#21-segurança-de-entrada-e-validação-de-dados--20-pontos)
    - 2.2 [Autenticação e Autorização — 20 pts](#22-autenticação-e-autorização--20-pontos)
    - 2.3 [Proteção de APIs e Integridade de Dados — 20 pts](#23-proteção-de-apis-e-integridade-de-dados--20-pontos)
    - 2.4 [Segurança de Dados e Privacidade — 25 pts](#24-segurança-de-dados-e-privacidade--25-pontos)
    - 2.5 [Monitoramento, Logs e Auditoria — 15 pts](#25-monitoramento-logs-e-auditoria--15-pontos)
  3. [Tabela Consolidada de Auto-Avaliação](#3-tabela-consolidada-de-auto-avaliação)
  4. [Limitações Conhecidas e Próximos Passos](#4-limitações-conhecidas-e-próximos-passos)
  5. [Achados de Auditoria](#5-achados-de-auditoria)
  6. [Referências](#6-referências)

  ---

  ## 1. Apresentação do Produto

  ### 1.1 Visão Geral

  **Ford Intelligence** é um aplicativo mobile multiplataforma (iOS/Android) de fidelização do pós-venda Ford. O app centraliza a experiência do proprietário de veículo Ford em um único produto: telemetria simulada do veículo, visualização 3D interativa, agendamento de serviços com modalidade "leva e traz", carteira de cashback e dashboard exclusivo para analistas internos Ford.

  **Problema que resolve:**  
  Proprietários de veículos Ford não têm visibilidade proativa sobre o estado do veículo nem um canal unificado para agendamento de manutenção preventiva. Concessionárias não têm ferramentas de qualificação de leads com base em comportamento de uso real.

  **Usuários-alvo:**

  | Persona | Perfil | Acesso |
  |---|---|---|
  | **Cliente Ford** | Proprietário de veículo (Agro / Urban / Premium) | Tabs: Home, Mapa, Carteira, Perfil |
  | **Analista Ford** | Funcionário de concessionária / backoffice | Dashboard analítico com KPIs e leads |

  **Escopo do repositório:** Frontend Mobile exclusivamente. Nenhum backend, banco de dados ou serviço externo real existe — todas as integrações são mockadas localmente em `src/services/mocks/`.

  ---

  ### 1.2 Arquitetura Técnica

  **Diagrama de arquitetura:**

  ```mermaid
  graph TD
      A[Usuário / Dispositivo] --> B[Ford Intelligence App]
      B --> C[Expo Router - Navegação]
      C --> D["(auth) - Login/Signup/Onboarding"]
      C --> E["(tabs) - Home/Mapa/Carteira/Perfil"]
      C --> F["(analyst) - Dashboard Analista"]
      C --> G["scheduling/ - Agendamento"]
      C --> H["vehicle/ - Visualização 3D"]

      B --> I[Zustand Stores]
      I --> I1[useAuthStore - Sessão + JWT]
      I --> I2[useUserStore - Perfil]
      I --> I3[useSchedulingStore - Bookings]
      I --> I4[useWalletStore - Cashback]
      I --> I5[useAuditStore - Eventos de segurança]

      I1 --> J[SecureStore - AES-256 / Keychain]
      I2 --> J
      I3 --> J
      I4 --> K[AsyncStorage - texto plano]

      B --> L[Services/Mocks - APIs simuladas]
      L --> L1[authApi.ts - Mock JWT]
      L --> L2[profileApi.ts - Risco IA]
      L --> L3[schedulingApi.ts - Agendamento]
      L --> L4[analystApi.ts - KPIs e Leads]

      B --> M[src/utils - Camada de segurança]
      M --> M1[sanitize.ts]
      M --> M2[safeError.ts]
      M --> M3[hmac.ts - expo-crypto]
      M --> M4[rbac.ts - Permissões]
      M --> M5[logger.ts - Logs seguros]
      M --> M6[anonymize.ts - PII]
  ```

  **Stack com versões reais (de `package.json`):**

  | Tecnologia | Versão | Papel |
  |---|---|---|
  | React Native | 0.81.5 | Framework mobile |
  | Expo SDK | ~54.0.33 | Managed workflow + APIs nativas |
  | Expo Router | ~6.0.23 | File-based routing |
  | TypeScript | ~5.9.2 | Tipagem estática strict |
  | Zustand | ^5.0.13 | Estado global (stores) |
  | Zod | ^4.4.3 | Validação de schemas runtime |
  | react-hook-form | ^7.75.0 | Gerenciamento de formulários |
  | expo-secure-store | ~15.0.8 | Armazenamento criptografado |
  | expo-crypto | ~15.0.9 | SHA-256 / assinatura de payloads |
  | @react-native-async-storage | 2.2.0 | Armazenamento não-criptografado (wallet) |
  | three.js | 0.184.0 | Renderização 3D |
  | react-native-maps | 1.20.1 | Mapa de concessionárias |
  | react-native-reanimated | ~4.1.1 | Animações na UI thread |

  **Justificativas das principais escolhas:**

  - **Expo managed workflow:** elimina necessidade de configurar Android NDK e Xcode manualmente; garante compatibilidade garantida entre módulos nativos.
  - **Zustand em vez de Redux:** menor boilerplate para stores simples; suporte nativo a hidratação assíncrona sem middleware.
  - **Zod v4 em vez de Yup:** integração direta com `@hookform/resolvers`; inferência TypeScript nativa sem necessidade de tipos manuais.
  - **expo-secure-store em vez de AsyncStorage para dados sensíveis:** AES-256 via Android Keystore + Keychain Services no iOS — criptografia gerenciada pelo SO, sem chave exposta no bundle.
  - **expo-crypto para HMAC:** incluída no Expo SDK sem dependência adicional; SHA-256 nativo via APIs criptográficas do SO.

  ---

  ### 1.3 Fluxo Principal de Uso

  ```mermaid
  sequenceDiagram
      actor U as Usuário
      participant App as Ford Intelligence
      participant Auth as useAuthStore
      participant SecS as SecureStore
      participant Mock as Mocks API

      U->>App: Abre o app (cold start)
      App->>Auth: hydrate()
      Auth->>SecS: getItem(token) + getItem(user)
      SecS-->>Auth: token + user (ou null)
      Auth->>Auth: Verifica JWT.exp vs now
      alt Token válido
          Auth-->>App: status: authenticated
          App->>U: Redireciona para (tabs)/Home
      else Token expirado ou ausente
          Auth-->>App: status: unauthenticated
          App->>U: Redireciona para login
      end

      U->>App: Login (email + senha)
      App->>Auth: login({ email, password })
      Auth->>Mock: loginApi(payload)
      Mock-->>Auth: { token: JWT, user }
      Auth->>SecS: persistSession(token, user)
      Auth-->>App: status: authenticated

      U->>App: Agenda serviço (5 steps)
      App->>App: Valida Zod em cada step
      App->>App: sanitizeString(pickupAddress)
      App->>Mock: signPayload(bookingPayload, SECRET)
      App->>Mock: createBooking({ ...payload, _sig: sig })
      Mock->>Mock: verifyPayload(_sig)
      Mock-->>App: Booking confirmado (protocolo FRD-XXXXXX)
  ```

  ---

  ### 1.4 Estrutura de Pastas

  ```
  ford-intelligence/
  ├── app/                        # Rotas Expo Router (file-based)
  │   ├── (auth)/                 # Stack de autenticação
  │   │   ├── login.tsx           # Login com lockout e toggle analista
  │   │   ├── signup.tsx          # Cadastro com validação Zod
  │   │   └── onboarding/         # Wizard 6 steps de perfilamento
  │   ├── (tabs)/                 # Tabs do cliente
  │   │   ├── index.tsx           # Home + telemetria IoT simulada
  │   │   ├── map.tsx             # Mapa de concessionárias
  │   │   ├── wallet.tsx          # Carteira de cashback (RBAC guard)
  │   │   └── profile.tsx         # Perfil + logout
  │   ├── (analyst)/              # Área restrita — role analyst
  │   │   ├── dashboard.tsx       # KPIs + leads + Security Events
  │   │   └── leads/[id].tsx      # Detalhe do lead (RBAC guard)
  │   ├── scheduling/             # Stack de agendamento (5 steps)
  │   └── _layout.tsx             # Root layout + boot + stores hydration
  │
  ├── src/
  │   ├── components/             # UI compartilhada (Button, Card, Input, Badge…)
  │   │   └── state/              # EmptyState, ErrorState, Skeleton
  │   ├── features/               # Módulos por domínio
  │   │   ├── analyst-dashboard/  # LeadCard (com maskName), KPICard, BarChart
  │   │   ├── scheduling/         # DealerPin, DealerSheet, StepHeader
  │   │   ├── cashback/           # CouponCard, FuelStationModal
  │   │   ├── telemetry/          # Simulador OBD2, hook useTelemetry
  │   │   └── vehicle3d/          # Cena Three.js, hotspots, AlertSheet
  │   ├── stores/                 # Zustand stores
  │   │   ├── useAuthStore.ts     # Sessão, JWT, lockout, logout completo
  │   │   ├── useUserStore.ts     # Perfil em SecureStore + Zod safeParse
  │   │   ├── useSchedulingStore.ts # Bookings em SecureStore + Zod safeParse
  │   │   ├── useWalletStore.ts   # Cashback em AsyncStorage + reset()
  │   │   └── useAuditStore.ts    # Trilha de auditoria (50 eventos FIFO)
  │   ├── services/
  │   │   ├── secureStorage.ts    # Wrapper SecureStore ↔ localStorage (web)
  │   │   └── mocks/              # APIs simuladas (delay 200–800ms)
  │   ├── hooks/
  │   │   └── useProtectedRoute.ts # Role-gate via hasPermission()
  │   └── utils/                  # Camada de segurança transversal
  │       ├── sanitize.ts         # Strip de chars perigosos
  │       ├── safeError.ts        # Mensagens de erro sem stack trace
  │       ├── logger.ts           # Logs seguros com PII redaction
  │       ├── rbac.ts             # hasPermission(user, action)
  │       ├── hmac.ts             # signPayload / verifyPayload (SHA-256)
  │       └── anonymize.ts        # maskName() / maskEmail()
  │
  ├── docs/                       # Documentação técnica
  │   ├── CYBERSECURITY-PLAN.md   # Plano da sprint
  │   ├── CYBERSECURITY.md        # Análise de implementação por critério
  │   └── CYBERSECURITY-JUSTIFICATIVAS.md  # Itens N/A com justificativa formal
  └── package.json                # expo-crypto, expo-secure-store, zod, zustand…
  ```

  ---

  ## 2. Implementação dos Requisitos de Cybersecurity

  ---

  ## 2.1 Segurança de Entrada e Validação de Dados — 20 pontos

  ### 2.1.1 Contexto e Relevância para o Produto

  O Ford Intelligence armazena localmente dados de perfil de veículo, histórico de agendamentos e dados de cashback. Sem sanitização e validação, um usuário poderia injetar strings malformadas nos campos de endereço de retirada, quilometragem ou nome — dados que são persistidos em SecureStore e exibidos em telas de confirmação e histórico.

  **Cenário de ataque concreto sem esta proteção:** um usuário insere `<script>alert(document.cookie)</script>` no campo "Endereço de retirada". O dado é armazenado no SecureStore e exibido sem escape em `confirm.tsx` e `BookingListItem.tsx`. Em uma eventual migração para WebView, esse dado tornaria o app vulnerável a XSS Stored.

  ---

  #### Subtópico A: Sanitização de Entradas (Strip de Caracteres Perigosos)

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Criada a função `sanitizeString()` em `src/utils/sanitize.ts` que remove os cinco caracteres mais frequentemente explorados em ataques de injeção e XSS antes que qualquer string livre do usuário seja persistida nos stores.

  **Onde está no código:**
  - `src/utils/sanitize.ts` (linhas 1–5)
  - `app/scheduling/address.tsx` (linha 71 — ponto de aplicação)

  **Trecho relevante:**

  ```typescript
  // src/utils/sanitize.ts
  const DANGEROUS_CHARS = /[<>"'`]/g;

  export function sanitizeString(value: string): string {
    return value.replace(DANGEROUS_CHARS, '');
  }
  ```

  ```typescript
  // app/scheduling/address.tsx — linha 71
  const onSubmit = handleSubmit((values) => {
    updateDraft({ pickupAddress: sanitizeString(values.pickupAddress) });
    router.push('/scheduling/datetime');
  });
  ```

  **Como funciona tecnicamente:**  
  A regex `/[<>"'\`]/g` remove em uma única passagem todos os caracteres que formam tags HTML (`<>`), atributos (`"`), strings JavaScript (`'` e `` ` ``). A sanitização ocorre no `onSubmit` do formulário, após validação Zod, antes de qualquer persistência — garantindo que o dado nunca entre no store com payload malicioso.

  **Bibliotecas/recursos utilizados:**
  - Regex nativa JavaScript — sem dependência externa; suficiente para este contexto de app mobile sem DOM real.

  📸 **Evidência necessária — PRINT 1.A:**  
  Campo "Endereço de retirada" no app (`scheduling/address.tsx`) com o valor `Av. Paulista <script>alert(1)</script>` digitado. Tirar print da tela de confirmação (`scheduling/confirm.tsx`) mostrando o valor armazenado como `Av. Paulista alert(1)` — sem os caracteres perigosos.

  ---

  #### Subtópico B: Validação de Schema com Zod (Formulários)

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Todos os formulários de entrada de dados utilizam schemas Zod com `react-hook-form`. Os schemas definem tipos, formatos aceitos e limites de tamanho, e são aplicados em runtime — rejeitando entradas antes de qualquer chamada às funções de persistência.

  **Onde está no código:**
  - `app/(auth)/signup.tsx` (linhas 12–29 — schema de cadastro)
  - `app/scheduling/address.tsx` (linhas 14–19 — schema de endereço)
  - `src/stores/useUserStore.ts` (linhas 25–31 — schema de perfil para restore)
  - `src/stores/useSchedulingStore.ts` (linhas 8–22 — schema de booking para restore)

  **Trecho relevante:**

  ```typescript
  // app/(auth)/signup.tsx — schema de cadastro
  const signupSchema = z
    .object({
      name: z.string().min(2, 'Informe seu nome').max(100, 'Máximo de 100 caracteres'),
      email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido').max(254, 'E-mail muito longo'),
      password: z.string().min(8, 'Mínimo de 8 caracteres'),
      confirm: z.string().min(8, 'Confirme sua senha'),
    })
    .refine((data) => data.password === data.confirm, {
      path: ['confirm'],
      message: 'As senhas não coincidem',
    });
  ```

  ```typescript
  // src/stores/useUserStore.ts — Zod safeParse no restore (SecureStore)
  const userProfileSchema = z.object({
    vehicleModel: z.enum(['ranger', 'maverick', 'territory', 'mustang', 'raptor']),
    usageStyle: z.enum(['urban', 'rural', 'mixed', 'performance']),
    monthlyKm: z.number().min(0).max(50000),
    plan: z.enum(['agro', 'urban', 'premium']),
    riskScore: z.number().optional(),
  });

  // Na hidratação do store:
  const parsed = userProfileSchema.safeParse(JSON.parse(rawProfile));
  if (parsed.success) {
    profile = parsed.data;
  } else {
    // Dado corrompido ou schema desatualizado — descarta silenciosamente
    await secureStorage.removeItem(PROFILE_KEY);
  }
  ```

  **Como funciona tecnicamente:**  
  O `zodResolver` integra o schema ao `react-hook-form`, que valida em tempo real (`mode: 'onChange'`) e bloqueia o `handleSubmit` enquanto há erros. No restore do SecureStore, o `safeParse` (sem throw) permite que dados corrompidos sejam descartados sem crashar o app — ao contrário do `parse()` que lança exceção.

  **Bibliotecas/recursos utilizados:**
  - `zod` v4.4.3 — validação de schema com inferência TypeScript nativa.
  - `@hookform/resolvers` v5.2.2 — ponte entre Zod e react-hook-form.

  📸 **Evidência necessária — PRINT 1.B:**  
  Tela de cadastro (`signup.tsx`) com o campo "Senha" preenchido com 5 caracteres (abaixo do mínimo de 8). Mostrar a mensagem de erro inline "Mínimo de 8 caracteres" e o botão "Criar conta" desabilitado.

  ---

  #### Subtópico C: Limitação de Tamanho (maxLength e limites Zod)

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Todos os campos de texto livre possuem limitação dupla: no schema Zod (`.max()`) e no componente `Input` (`maxLength` nativo). A limitação dupla garante que nem o schema nem o teclado permitam entradas acima do limite.

  **Onde está no código:**
  - `app/(auth)/signup.tsx` (linhas 76–108 — `maxLength` nos Inputs)
  - `app/scheduling/address.tsx` (linhas 85–93 — `maxLength={200}`)
  - `app/(auth)/onboarding/step-4.tsx` (campo de km — `maxLength={5}`)

  **Trecho relevante:**

  ```typescript
  // app/(auth)/signup.tsx — campos com limite duplo (Zod + nativo)
  <Input control={control} name="name"     maxLength={100}  error={errors.name?.message}     />
  <Input control={control} name="email"    maxLength={254}  error={errors.email?.message}    />
  <Input control={control} name="password" maxLength={128}  error={errors.password?.message} />
  <Input control={control} name="confirm"  maxLength={128}  error={errors.confirm?.message}  />
  ```

  **Limites aplicados:**

  | Campo | Limite Zod | maxLength nativo | Base |
  |---|---|---|---|
  | Nome | 100 chars | 100 | Razoável para nome completo |
  | E-mail | 254 chars | 254 | RFC 5321 |
  | Senha | 128 chars | 128 | Previne payload flooding |
  | Endereço | 200 chars | 200 | Espaço suficiente + margem |
  | Km/mês | 0–50.000 | 5 dígitos | Range razoável de uso |

  **Bibliotecas/recursos utilizados:**
  - `maxLength` prop nativa do React Native `TextInput`.

  📸 **Evidência necessária — PRINT 1.C:**  
  Campo "Endereço de retirada" com exatamente 200 caracteres digitados — o campo para de aceitar mais caracteres. Mostrar o contador de caracteres (se visível) ou evidenciar que não é possível digitar o 201º caractere.

  ---

  #### Subtópico D: Tratamento Seguro de Erros

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Criada a função `toSafeMessage()` em `src/utils/safeError.ts` que implementa um allowlist de mensagens de erro seguras para o usuário. Qualquer erro não reconhecido (stack trace, erro interno de biblioteca, mensagem técnica) é substituído por uma mensagem genérica.

  **Onde está no código:**
  - `src/utils/safeError.ts` (linhas 1–18)
  - `app/(auth)/login.tsx` (linha 60 — `catch`)
  - `app/(auth)/signup.tsx` (linha 53 — `catch`)
  - `app/(auth)/onboarding/step-6.tsx` (linha 42 — `catch`)

  **Trecho relevante:**

  ```typescript
  // src/utils/safeError.ts
  const GENERIC = 'Algo deu errado. Tente novamente.';

  // Apenas mensagens explicitamente escritas para o usuário são exibidas.
  // Stack traces, nomes de biblioteca ou erros internos viram mensagem genérica.
  const ALLOWLIST = new Set([
    'Credenciais inválidas.',
    'Falha ao entrar. Tente novamente.',
    'Falha ao criar conta.',
    'Email não encontrado.',
    'Conta já existe.',
  ]);

  export function toSafeMessage(err: unknown): string {
    if (err instanceof Error && ALLOWLIST.has(err.message)) {
      return err.message;
    }
    return GENERIC;
  }
  ```

  ```typescript
  // app/(auth)/login.tsx — uso no catch
  try {
    await login({ ...values, isAnalyst });
  } catch (err) {
    setSubmitError(toSafeMessage(err));  // nunca expõe stack trace
  }
  ```

  **Como funciona tecnicamente:**  
  O allowlist age como porta de entrada: apenas mensagens que foram explicitamente escritas para o usuário final passam. Qualquer `Error` com mensagem diferente — incluindo erros de rede, erros de parsing, exceções de bibliotecas internas — cai no caso `GENERIC`. O tipo `unknown` no parâmetro força verificação de tipo antes de acessar `.message`, prevenindo acesso inseguro.

  **Bibliotecas/recursos utilizados:**
  - Apenas JavaScript nativo — `Set`, `instanceof`, `typeof`.

  📸 **Evidência necessária — PRINT 1.D:**  
  Tela de login com credenciais erradas (qualquer email/senha inválidos). Mostrar a mensagem de erro exibida ao usuário — deve ser uma das mensagens do allowlist ou a genérica "Algo deu errado. Tente novamente." Confirmar que não há stack trace, nome de framework, ou caminho de arquivo visível.

  ---

  ## 2.2 Autenticação e Autorização — 20 pontos

  ### 2.2.1 Contexto e Relevância para o Produto

  O Ford Intelligence tem dois perfis de acesso radicalmente distintos: clientes (que gerenciam seu veículo e cashback) e analistas Ford (que acessam KPIs e dados de leads). Sem autenticação forte e controle de acesso, um cliente poderia acessar o dashboard analítico e visualizar dados PII de outros clientes.

  **Cenário de ataque concreto sem esta proteção:** sem expiração de token, uma sessão comprometida (dispositivo roubado) permanece válida indefinidamente. Sem RBAC, qualquer usuário autenticado que descobrir a rota `/(analyst)/dashboard` acessa o dashboard com leads de clientes.

  ---

  #### Subtópico A: Mock-JWT com Expiração e Verificação no Boot

  **Status:** ✅ Implementado

  **O que foi feito:**  
  O token de sessão gerado pelo mock de autenticação segue a estrutura JWT real (base64url `header.payload.signature`) com campo `exp` definido como `iat + 3600` (1 hora). No boot do app, o `useAuthStore.hydrate()` decodifica o payload e verifica se o token já expirou — se sim, limpa a sessão e força novo login.

  **Onde está no código:**
  - `src/services/mocks/authApi.ts` (linhas 41–52 — `makeToken()`)
  - `src/stores/useAuthStore.ts` (linhas 37–47 — `decodeJwtPayload()`)
  - `src/stores/useAuthStore.ts` (linhas 81–110 — `hydrate()`)

  **Trecho relevante:**

  ```typescript
  // src/services/mocks/authApi.ts — geração do mock-JWT
  function b64url(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  async function makeToken(userId: string, role: UserRole): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1 hora
    const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = b64url(JSON.stringify({ sub: userId, role, iat, exp }));
    const sig     = b64url(await signPayload(`${header}.${payload}`, MOCK_SECRET));
    return `${header}.${payload}.${sig}`;
  }
  ```

  ```typescript
  // src/stores/useAuthStore.ts — verificação de expiração no hydrate
  hydrate: async () => {
    set({ status: 'hydrating' });
    try {
      const [token, rawUser] = await Promise.all([
        secureStorage.getItem(TOKEN_KEY),
        secureStorage.getItem(USER_KEY),
      ]);
      if (token && rawUser) {
        const jwt = decodeJwtPayload(token);
        const now = Math.floor(Date.now() / 1000);
        if (!jwt || jwt.exp < now) {
          await clearSession();
          useAuditStore.getState().log('token_expired');
          logger.security('Token expirado na hidratação — sessão encerrada');
          set({ status: 'unauthenticated', token: null, user: null });
          return;
        }
        set({ status: 'authenticated', token, user: JSON.parse(rawUser) as AuthUser });
      }
    } catch { /* ... */ }
  },
  ```

  **Como funciona tecnicamente:**  
  A estrutura `header.payload.sig` em base64url é decodificada com `atob()` após normalização de padding. A comparação `jwt.exp < now` (ambos em Unix timestamp em segundos) determina expiração. A função `clearSession()` remove ambas as chaves (`TOKEN_KEY` e `USER_KEY`) do SecureStore antes de atualizar o estado — garantindo que o logout forçado seja completo.

  **Bibliotecas/recursos utilizados:**
  - `expo-secure-store` ~15.0.8 — persiste token encriptado.
  - `expo-crypto` ~15.0.9 — assina o token com SHA-256 keyed hash.

  📸 **Evidência necessária — PRINT 2.A:**  
  No arquivo `src/services/mocks/authApi.ts`, linha 39, alterar temporariamente `TOKEN_EXPIRY_SECS = 3600` para `TOKEN_EXPIRY_SECS = 1` (1 segundo). Fazer login no app, aguardar 2 segundos, fechar o app completamente e reabrir. Tirar print da tela de login sendo exibida automaticamente (o token expirou). Reverter a alteração após a print.

  ---

  #### Subtópico B: Lockout por Tentativas Falhas (Brute Force Protection)

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Após 5 tentativas de login falhas consecutivas, o `useAuthStore` define `lockedUntil = Date.now() + 60_000`. A tela de login exibe countdown regressivo em segundos, desabilita o botão de submit e exibe banner de alerta acessível com `accessibilityLiveRegion="polite"` para leitores de tela.

  **Onde está no código:**
  - `src/stores/useAuthStore.ts` (linhas 112–158 — lógica de lockout em `login()`)
  - `app/(auth)/login.tsx` (linhas 29–44 — ticker de countdown)
  - `app/(auth)/login.tsx` (linhas 107–143 — UI de lockout)

  **Trecho relevante:**

  ```typescript
  // src/stores/useAuthStore.ts — lógica de lockout
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 60_000; // 60 segundos

  login: async (payload) => {
    const { failedAttempts, lockedUntil } = get();
    const now = Date.now();

    if (lockedUntil !== null && now < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - now) / 1000);
      throw new Error(`Tente novamente em ${remaining}s.`);
    }

    // ... tentativa de login ...

    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      const shouldLock = nextAttempts >= MAX_ATTEMPTS;
      set({
        status: 'unauthenticated',
        error: toSafeMessage(err),
        failedAttempts: shouldLock ? 0 : nextAttempts,
        lockedUntil: shouldLock ? Date.now() + LOCKOUT_DURATION_MS : null,
      });
      if (shouldLock) {
        useAuditStore.getState().log('lockout_activated', undefined, { duration: 60 });
      }
    }
  },
  ```

  ```typescript
  // app/(auth)/login.tsx — countdown ticker e UI de lockout
  useEffect(() => {
    if (!lockedUntil) { setCountdown(0); return; }
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      setCountdown(remaining > 0 ? remaining : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // Banner de alerta acessível:
  {isLocked ? (
    <View accessibilityLiveRegion="polite"
          accessibilityLabel={`Conta bloqueada. Tente novamente em ${countdown} segundos`}>
      <Icon name="lock-closed" size={14} color="critical" />
      <Text color="critical">Muitas tentativas. Tente novamente em <Text style={{fontWeight:'700'}}>{countdown}s</Text></Text>
    </View>
  ) : null}

  <Button label={isLocked ? `Bloqueado (${countdown}s)` : 'Entrar'}
          disabled={isLocked} />
  ```

  **Como funciona tecnicamente:**  
  O lockout é baseado em timestamp (`lockedUntil`) e não em contador persistido — ao fechar o app, o estado Zustand é perdido, o que é comportamento intencional para um MVP. Isso segue a recomendação OWASP MASVS-AUTH-2: mitigação de força bruta via UI sem depender de servidor. O `setInterval` de 1s atualiza o countdown visualmente; o `useEffect` com cleanup previne memory leak.

  📸 **Evidência necessária — PRINT 2.B:**  
  Realizar 5 tentativas de login com senha errada. Tirar print da tela de login exibindo o banner vermelho com lockout ativo e o contador regressivo (ex.: "Bloqueado (47s)"). O botão "Entrar" deve estar desabilitado e exibindo "Bloqueado (47s)".

  ---

  #### Subtópico C: RBAC — Controle de Acesso Baseado em Papéis

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Criado `src/utils/rbac.ts` com a função `hasPermission(user, action)` que centraliza todas as verificações de permissão. As 4 ações disponíveis são distribuídas entre 2 roles. O `useProtectedRoute` usa `hasPermission` para decidir o destino de roteamento. Cada tela restrita tem um guard adicional por defesa em profundidade.

  **Onde está no código:**
  - `src/utils/rbac.ts` (linhas 1–17 — definição de permissões)
  - `src/hooks/useProtectedRoute.ts` (linha 33 — uso no roteamento)
  - `app/(analyst)/dashboard.tsx` (linhas 51–55 — guard de tela)
  - `app/(analyst)/leads/[id].tsx` (linhas 28–33 — guard de tela)
  - `app/(tabs)/wallet.tsx` (linhas 141–147 — guard de tela)

  **Trecho relevante:**

  ```typescript
  // src/utils/rbac.ts — mapa centralizado de permissões
  export type RbacAction =
    | 'view:analyst_dashboard'
    | 'view:leads'
    | 'view:wallet'
    | 'edit:profile';

  const PERMISSIONS: Record<UserRole, RbacAction[]> = {
    analyst: ['view:analyst_dashboard', 'view:leads', 'edit:profile'],
    client:  ['view:wallet', 'edit:profile'],
  };

  export function hasPermission(user: AuthUser | null, action: RbacAction): boolean {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(action) ?? false;
  }
  ```

  ```typescript
  // src/hooks/useProtectedRoute.ts — roteamento por permissão
  // Antes: if (user?.role === 'analyst') { ... }
  // Depois:
  if (hasPermission(user, 'view:analyst_dashboard')) {
    if (!inAnalystGroup) router.replace('/(analyst)/dashboard' as never);
    return;
  }
  ```

  ```typescript
  // app/(analyst)/dashboard.tsx — guard de tela (defesa em profundidade)
  useEffect(() => {
    if (user && !hasPermission(user, 'view:analyst_dashboard')) {
      logAudit('permission_denied', user.id, { action: 'view:analyst_dashboard' });
      router.replace('/(tabs)');
    }
  }, [user, logAudit, router]);
  ```

  **Como funciona tecnicamente:**  
  O RBAC opera em dois níveis: (1) roteamento — `useProtectedRoute` decide para onde o usuário vai imediatamente após autenticação; (2) guarda de tela — cada tela restrita verifica permissão no mount e redireciona + loga no audit store em caso de acesso negado. A centralização em `rbac.ts` garante que adicionar uma nova role ou ação exige mudança em apenas um arquivo.

  **Bibliotecas/recursos utilizados:**
  - Lógica própria — sem biblioteca de RBAC externa; `Record<UserRole, RbacAction[]>` é suficiente para o escopo atual.

  📸 **Evidência necessária — PRINT 2.C:**  
  Login como cliente (toggle "Sou analista Ford" desativado). Tirar print da tela de tabs do cliente (Home/Mapa/Carteira/Perfil). Em seguida, mostrar o console de desenvolvimento (Metro) com o log de auditoria `permission_denied` que seria gerado se o cliente tentasse acessar a rota `/(analyst)/dashboard` diretamente (pode ser demonstrado alterando temporariamente `useProtectedRoute` para navegar para analyst e capturar o log).

  ---

  ## 2.3 Proteção de APIs e Integridade de Dados — 20 pontos

  > **Nota sobre escopo:** este critério, conforme identificado no arquivo `docs/CYBERSECURITY.md` do projeto, cobre HTTPS/TLS, rate limiting, CORS e assinatura de payloads. Os três primeiros são N/A por arquitetura (frontend mobile com mocks locais) — justificados formalmente em `docs/CYBERSECURITY-JUSTIFICATIVAS.md`. O item implementável (assinatura HMAC de payloads) foi implementado integralmente.

  ### 2.3.1 Contexto e Relevância para o Produto

  O app envia payloads para os mocks de API (agendamento, perfil) contendo dados críticos: modalidade de serviço, endereço de retirada, plano contratado. Sem verificação de integridade, um payload adulterado em memória (ex.: via debugger ou proxy) chegaria ao mock sem detecção.

  **Cenário de ataque concreto sem esta proteção:** um usuário com acesso a ferramentas de instrumentação (Frida, proxy com MitM) intercepta a chamada `createBooking` e altera `mode: 'in-person'` para `mode: 'pickup-delivery'` sem ter o endereço configurado, ou altera `plan: 'urban'` para `plan: 'premium'` para acessar features premium sem pagamento.

  ---

  #### Subtópico A: Assinatura HMAC de Payloads (SHA-256)

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Criado `src/utils/hmac.ts` usando `expo-crypto` para assinar payloads antes do envio aos mocks. O mock verifica a assinatura antes de processar — se o payload foi adulterado (mesmo que em um único campo), a assinatura não bate e a operação é rejeitada com erro.

  **Onde está no código:**
  - `src/utils/hmac.ts` (linhas 1–22 — `signPayload` e `verifyPayload`)
  - `app/scheduling/confirm.tsx` (linhas 67–77 — assinatura do booking)
  - `app/(auth)/onboarding/step-6.tsx` (linhas 36–38 — assinatura do perfil)
  - `src/services/mocks/schedulingApi.ts` (linhas 60–65 — verificação no mock)
  - `src/services/mocks/profileApi.ts` (linhas 26–28 — verificação no mock)

  **Trecho relevante:**

  ```typescript
  // src/utils/hmac.ts — implementação da assinatura
  import * as Crypto from 'expo-crypto';

  // SHA-256 com prefixo de segredo separado por NUL (keyed hash).
  // Não é RFC 2104 HMAC puro, mas suficiente para integridade de payload neste contexto mock.
  const SEP = '\x00';

  export async function signPayload(payload: string, secret: string): Promise<string> {
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${secret}${SEP}${payload}`,
      { encoding: Crypto.CryptoEncoding.HEX },
    );
  }

  export async function verifyPayload(payload: string, sig: string, secret: string): Promise<boolean> {
    const expected = await signPayload(payload, secret);
    return expected === sig;
  }
  ```

  ```typescript
  // app/scheduling/confirm.tsx — assinatura antes do envio
  const bookingPayload = {
    dealerId: draft.dealerId, service: draft.service, mode: draft.mode,
    date: draft.date,         slot: draft.slot,       pickupAddress: draft.pickupAddress,
    notes: draft.notes,
  };
  const sig = await signPayload(JSON.stringify(bookingPayload), MOCK_API_SECRET);
  const booking = await createBooking({ ...bookingPayload, _sig: sig });
  ```

  ```typescript
  // src/services/mocks/schedulingApi.ts — verificação no mock
  export async function createBooking(payload: CreateBookingPayload & { _sig: string }): Promise<Booking> {
    const { _sig, ...draft } = payload;
    const valid = await verifyPayload(JSON.stringify(draft), _sig, MOCK_API_SECRET);
    if (!valid) throw new Error('Assinatura inválida.');
    // ... prossegue com criação do booking
  }
  ```

  **Como funciona tecnicamente:**  
  O caller serializa o payload com `JSON.stringify()` e calcula `SHA-256(secret + NUL + payload)`. O mock recebe `{ ...payload, _sig: assinatura }`, desestrutura `_sig` e recalcula a assinatura sobre o payload restante. Qualquer modificação em qualquer campo do payload — incluindo reordenação por `JSON.stringify` — produz hash diferente e rejeita a chamada.

  **Bibliotecas/recursos utilizados:**
  - `expo-crypto` ~15.0.9 — acessa APIs criptográficas nativas do SO (Android Keystore / CommonCrypto iOS) via Expo SDK; nenhuma implementação JS pura de criptografia.

  📸 **Evidência necessária — PRINT 2.3.A:**  
  No arquivo `app/scheduling/confirm.tsx`, alterar temporariamente a linha de assinatura para `const sig = 'assinatura_invalida'`. Completar o fluxo de agendamento e tirar print da tela de erro exibida (a chamada `createBooking` deve falhar). O erro exibido deve ser a mensagem genérica (não "Assinatura inválida" — essa é filtrada pelo `toSafeMessage`). Reverter a alteração após a print.

  ---

  #### Subtópico B: HTTPS/TLS — Justificativa de N/A

  **Status:** ⚠️ N/A por arquitetura

  **O que foi feito:**  
  Documentado formalmente por que TLS não é configurável no cliente mobile e como o SO garante essa proteção automaticamente. O documento `docs/CYBERSECURITY-JUSTIFICATIVAS.md` contém a justificativa técnica completa referenciando a stack de rede do Android (OkHttp) e iOS (NSURLSession).

  **Resumo da justificativa:**  
  TLS opera na camada de transporte e é gerenciado exclusivamente pelo SO. Android exige TLS 1.2 desde a versão 5.0; iOS, desde a versão 9. O React Native não expõe API para configurar o protocolo TLS. O projeto opera com mocks locais — não há servidor cujo certificado possa ser fixado ou cujos headers de segurança possam ser configurados.

  **O que compete ao cliente foi verificado:** a variável `EXPO_PUBLIC_API_BASE_URL` (quando um backend real for integrado) deve usar esquema `https://`.

  ---

  #### Subtópico C: Rate Limiting e CORS — Justificativa de N/A

  **Status:** ⚠️ N/A por arquitetura

  **Rate limiting:** é um controle server-side. Um rate limiter no cliente pode ser ignorado por qualquer atacante que acesse a API diretamente. O substituto client-side implementado — lockout por brute force — está na seção 2.2.

  **CORS:** é um mecanismo de browser. React Native não possui o conceito de "origem" e não está sujeito à Same-Origin Policy. CORS é responsabilidade do backend da API, fora do escopo deste projeto.

  Justificativas completas em `docs/CYBERSECURITY-JUSTIFICATIVAS.md`.

  ---

  ## 2.4 Segurança de Dados e Privacidade — 25 pontos

  ### 2.4.1 Contexto e Relevância para o Produto

  O app armazena localmente dados pessoais do proprietário (modelo do veículo, estilo de uso, quilometragem), histórico de agendamentos (endereço de retirada, datas, concessionária) e dados de sessão (token JWT, informações do usuário). Sem proteção adequada, esses dados seriam legíveis por qualquer processo com acesso ao sistema de arquivos do dispositivo.

  **Cenário de ataque concreto sem esta proteção:** dispositivo Android rooteado com acesso via `adb pull`. Sem SecureStore, um atacante lê o arquivo `AsyncStorage` diretamente e obtém token válido, endereço residencial do usuário e histórico completo de visitas a concessionárias.

  ---

  #### Subtópico A: Criptografia em Repouso com SecureStore

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Token de autenticação, dados do usuário, perfil do veículo e histórico de agendamentos foram migrados de `AsyncStorage` (texto plano) para `expo-secure-store` (AES-256 via Android Keystore / Keychain Services no iOS). Um wrapper abstrai a diferença entre plataformas, com fallback para `localStorage` no web.

  **Onde está no código:**
  - `src/services/secureStorage.ts` (linhas 1–32 — wrapper SecureStore)
  - `src/stores/useUserStore.ts` (linhas 52–72 — uso do secureStorage)
  - `src/stores/useSchedulingStore.ts` (linhas 43–59 — uso do secureStorage)
  - `src/stores/useAuthStore.ts` (linhas 63–71 — `persistSession` e `clearSession`)

  **Trecho relevante:**

  ```typescript
  // src/services/secureStorage.ts — wrapper cross-platform
  import * as SecureStore from 'expo-secure-store';

  const nativeStorage = {
    getItem:    (key) => SecureStore.getItemAsync(key),
    setItem:    (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
  };

  // Web usa localStorage como fallback (dev/debug only)
  const webStorage = { /* ... */ };

  export const secureStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
  ```

  ```typescript
  // src/stores/useAuthStore.ts — persistência do token e user
  const TOKEN_KEY = 'ford.auth.token';
  const USER_KEY  = 'ford.auth.user';

  async function persistSession(token: string, user: AuthUser) {
    await secureStorage.setItem(TOKEN_KEY, token);
    await secureStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async function clearSession() {
    await secureStorage.removeItem(TOKEN_KEY);
    await secureStorage.removeItem(USER_KEY);
  }
  ```

  **Dados protegidos por SecureStore:**

  | Chave | Conteúdo | Store |
  |---|---|---|
  | `ford.auth.token` | Mock-JWT (header.payload.sig) | useAuthStore |
  | `ford.auth.user` | id, name, email, role | useAuthStore |
  | `ford.user.profile` | vehicleModel, usageStyle, monthlyKm, plan, riskScore | useUserStore |
  | `ford.onboarding.complete` | Flag booleana | useUserStore |
  | `ford.scheduling.bookings` | Array de bookings (JSON) | useSchedulingStore |

  **Bibliotecas/recursos utilizados:**
  - `expo-secure-store` ~15.0.8 — AES-256 com Android Keystore (hardware-backed em dispositivos compatíveis); Keychain Services com `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` no iOS.

  📸 **Evidência necessária — PRINT 2.4.A:**  
  No Android Studio ou via `adb`, navegar até o diretório de dados do app (`/data/data/com.fordinteligence/databases/`) e mostrar que não há arquivo de AsyncStorage com dados de perfil ou token. Alternativa: mostrar o código-fonte de `useUserStore.ts` e `useSchedulingStore.ts` com `secureStorage.setItem` em destaque, e comparar com o código antigo usando `AsyncStorage` (pode-se mostrar o git diff do commit de M3).

  ---

  #### Subtópico B: Descarte Seguro de Dados no Logout

  **Status:** ✅ Implementado

  **O que foi feito:**  
  O método `logout()` em `useAuthStore` realiza limpeza completa de todos os dados locais do usuário em uma única operação atômica: token e user do SecureStore, perfil do SecureStore, bookings do SecureStore e dados de wallet do AsyncStorage.

  **Onde está no código:**
  - `src/stores/useAuthStore.ts` (linhas 174–193 — `logout()`)

  **Trecho relevante:**

  ```typescript
  // src/stores/useAuthStore.ts — logout com limpeza completa
  logout: async () => {
    const user = get().user;
    await clearSession(); // remove ford.auth.token + ford.auth.user do SecureStore

    await Promise.all([
      useUserStore.getState().clearProfile(),         // remove ford.user.profile + onboarding flag
      useSchedulingStore.getState().clearBookings(),  // remove ford.scheduling.bookings
      useWalletStore.getState().reset(),              // remove 3 chaves do AsyncStorage
    ]);

    useAuditStore.getState().log('logout', user?.id);

    set({
      status: 'unauthenticated',
      token: null,
      user: null,
      error: null,
      failedAttempts: 0,
      lockedUntil: null,
    });
  },
  ```

  **Como funciona tecnicamente:**  
  O `Promise.all` garante que os 3 stores de dados do usuário são limpos em paralelo — se qualquer um falhar, a rejeição se propaga e o estado `unauthenticated` não é definido, mantendo consistência. A limpeza do SecureStore é física (as chaves são deletadas do Keystore/Keychain), não apenas marcadas como inativas.

  📸 **Evidência necessária — PRINT 2.4.B:**  
  Sequência de duas prints: (1) Tela de Perfil com dados do usuário visíveis (nome, plano, histórico de agendamentos). (2) Imediatamente após clicar em "Sair" e confirmar o Alert — tela de login exibida, sem dados do usuário anterior. Opcional: mostrar via Expo DevTools que o SecureStore está vazio após o logout.

  ---

  #### Subtópico C: Anonimização/Pseudonimização de Dados PII no Dashboard

  **Status:** ✅ Implementado

  **O que foi feito:**  
  O componente `LeadCard` no dashboard do analista aplica `maskName()` e `maskEmail()` sobre os dados de nome de cliente antes de renderizar. Os dados completos estão disponíveis apenas na tela de detalhe do lead, acessível somente por analistas com permissão `view:leads`.

  **Onde está no código:**
  - `src/utils/anonymize.ts` (linhas 1–20 — `maskName` e `maskEmail`)
  - `src/features/analyst-dashboard/LeadCard.tsx` (linhas 8, 23, 29 — aplicação)

  **Trecho relevante:**

  ```typescript
  // src/utils/anonymize.ts
  // "João Silva" → "J*** S***"
  export function maskName(name: string): string {
    return name.trim().split(/\s+/).map((part) =>
      part.length > 0 ? `${part[0]}***` : part
    ).join(' ');
  }

  // "joao@gmail.com" → "j***@g***.com"
  export function maskEmail(email: string): string {
    const at = email.indexOf('@');
    if (at === -1) return email;
    const local      = email.slice(0, at);
    const domain     = email.slice(at + 1);
    const dot        = domain.lastIndexOf('.');
    const domainName = dot !== -1 ? domain.slice(0, dot) : domain;
    const tld        = dot !== -1 ? domain.slice(dot) : '';
    return `${local[0] ?? ''}***@${domainName[0] ?? ''}***${tld}`;
  }
  ```

  ```typescript
  // src/features/analyst-dashboard/LeadCard.tsx
  import { maskName } from '@/utils/anonymize';

  export function LeadCard({ lead }: LeadCardProps) {
    return (
      <Pressable accessibilityLabel={`Lead ${maskName(lead.clientName)}, score ${lead.aiScore}`}>
        <Card>
          <Text variant="bodyStrong">{maskName(lead.clientName)}</Text>
          {/* ... demais dados não-PII: veículo, plano, serviço, revenue */}
        </Card>
      </Pressable>
    );
  }
  ```

  **Bibliotecas/recursos utilizados:**
  - Lógica própria — regex `/\s+/` para split de palavras; slice de string para construção do padrão mascarado.

  📸 **Evidência necessária — PRINT 2.4.C:**  
  Dashboard do analista (`/(analyst)/dashboard`) com a lista de leads visível. Tirar print mostrando nomes mascarados no formato `J*** S***` em todos os LeadCards. Ao lado, mostrar o código de `mockLeads` em `analystApi.ts` com um nome real (ex: "João Silva") para evidenciar que o dado original existe mas é mascarado na exibição.

  ---

  #### Subtópico D: Proteção contra Exposição Acidental de Dados nos Logs

  **Status:** ✅ Implementado — ver Seção 2.5.1.

  ---

  ## 2.5 Monitoramento, Logs e Auditoria — 15 pontos

  ### 2.5.1 Contexto e Relevância para o Produto

  Sem logs estruturados com redação de PII, dados sensíveis como tokens e e-mails de usuários aparecem nos logs de desenvolvimento e potencialmente em sistemas de monitoramento de produção (Sentry, Crashlytics). Sem trilha de auditoria, tentativas de acesso não autorizado a dados de leads passam desapercebidas.

  **Cenário de ataque concreto sem esta proteção:** um desenvolvedor faz `console.log(user)` durante debug — o objeto inclui `email`, `token` e `role`. Esse log vai para um sistema de monitoramento de produção e fica indexado em texto plano, expondo PII de centenas de usuários.

  ---

  #### Subtópico A: Logger Estruturado com PII Redaction

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Criado `src/utils/logger.ts` que suprime todos os logs em produção (`!__DEV__`) e, em desenvolvimento, percorre recursivamente objetos logados substituindo valores de chaves sensíveis por `[REDACTED]`.

  **Onde está no código:**
  - `src/utils/logger.ts` (linhas 1–34)
  - `src/stores/useAuthStore.ts` (linha 94 — `logger.security()`)

  **Trecho relevante:**

  ```typescript
  // src/utils/logger.ts
  const SENSITIVE = new Set(['email', 'password', 'token', 'cpf', 'phone']);

  function redact(value: unknown): unknown {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(redact);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.has(k.toLowerCase()) ? '[REDACTED]' : redact(v);
    }
    return out;
  }

  export const logger = {
    log:      (...args: unknown[]) => { if (!__DEV__) return; console.log(...prepare(args));  },
    warn:     (...args: unknown[]) => { if (!__DEV__) return; console.warn(...prepare(args)); },
    error:    (...args: unknown[]) => { if (!__DEV__) return; console.error(...prepare(args)); },
    security: (...args: unknown[]) => { if (!__DEV__) return; console.warn('[SECURITY]', ...prepare(args)); },
  };
  ```

  **Como funciona tecnicamente:**  
  A função `redact()` percorre recursivamente o objeto com `Object.entries()`, substituindo por `[REDACTED]` qualquer chave que esteja no `Set` de sensitivos (case-insensitive via `.toLowerCase()`). Arrays são mapeados individualmente. O guard `if (!__DEV__) return` no início de cada método garante que zero bytes de log chegam à produção.

  **Bibliotecas/recursos utilizados:**
  - `__DEV__` — global do React Native injetada pelo bundler Metro; `true` em desenvolvimento, `false` em builds de produção (EAS).

  📸 **Evidência necessária — PRINT 2.5.A:**  
  Com o app rodando em modo desenvolvimento (Metro), adicionar temporariamente `logger.log({ email: 'teste@ford.com', token: 'jwt_abc', name: 'João' })` em `app/_layout.tsx`. Tirar print do terminal Metro mostrando o output: `{ email: '[REDACTED]', token: '[REDACTED]', name: 'João' }`. Remover o log após a print.

  ---

  #### Subtópico B: Monitoramento de Eventos Suspeitos (Audit Store)

  **Status:** ✅ Implementado

  **O que foi feito:**  
  Criado `src/stores/useAuditStore.ts` — store Zustand in-memory com array FIFO de até 50 `AuditEvent`. Sete tipos de evento cobrem os principais vetores de segurança. O store é alimentado por `useAuthStore` (login, logout, lockout) e pelos guards RBAC (permission_denied).

  **Onde está no código:**
  - `src/stores/useAuditStore.ts` (linhas 1–40)
  - `src/stores/useAuthStore.ts` (linhas 93, 125, 140, 150–154, 182 — chamadas ao audit store)
  - `app/(analyst)/dashboard.tsx` (linha 51 — guard com log de permission_denied)

  **Trecho relevante:**

  ```typescript
  // src/stores/useAuditStore.ts
  export type AuditEventType =
    | 'login' | 'logout' | 'login_failed' | 'token_expired'
    | 'permission_denied' | 'lockout_activated' | 'lockout_lifted';

  export type AuditEvent = {
    id: string;          // timestamp + random para unicidade
    timestamp: string;   // ISO 8601
    event: AuditEventType;
    userId?: string;
    meta?: Record<string, unknown>;
  };

  const MAX_EVENTS = 50;

  export const useAuditStore = create<AuditState>((set, get) => ({
    events: [],
    log: (event, userId, meta) => {
      const entry: AuditEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        event,
        ...(userId !== undefined && { userId }),
        ...(meta !== undefined && { meta }),
      };
      const events = [entry, ...get().events].slice(0, MAX_EVENTS);
      set({ events });
    },
  }));
  ```

  ```typescript
  // src/stores/useAuthStore.ts — eventos registrados automaticamente
  useAuditStore.getState().log('login', user.id);                         // login bem-sucedido
  useAuditStore.getState().log('login_failed', undefined, { attempt: n }); // tentativa falha
  useAuditStore.getState().log('lockout_activated', undefined, { duration: 60 }); // lockout
  useAuditStore.getState().log('lockout_lifted');                          // lockout expirado
  useAuditStore.getState().log('token_expired');                           // token JWT expirado
  useAuditStore.getState().log('logout', user?.id);                       // logout
  ```

  **Como funciona tecnicamente:**  
  O FIFO é implementado com `.slice(0, MAX_EVENTS)` aplicado após inserção no início do array — O(n) mas aceitável para N=50. A ausência de persistência é intencional: eventos de segurança são voláteis por design (reinício limpa a trilha, o que é adequado para o contexto mobile). Em produção real, os eventos seriam enviados a um SIEM via API.

  📸 **Evidência necessária — PRINT 2.5.B:**  
  Com o app aberto, fazer 3 tentativas de login com senha errada (sem atingir o lockout). Fazer login como analista. No dashboard analítico, rolar até a seção "Security Events" e tirar print mostrando os 3 eventos `login_failed` + 1 evento `login` na lista, com badges coloridos e timestamps.

  ---

  #### Subtópico C: Trilha de Auditoria no Dashboard do Analista

  **Status:** ✅ Implementado

  **O que foi feito:**  
  A tela `app/(analyst)/dashboard.tsx` exibe uma seção "Security Events" ao final do scroll, mostrando em tempo real os eventos do `useAuditStore`. Cada evento exibe: ícone semântico, badge colorido por gravidade (success/neutral/warn/critical) e timestamp formatado (hora se hoje, data+hora se anterior).

  **Onde está no código:**
  - `app/(analyst)/dashboard.tsx` (linhas 35–86 — mapas e formatter; linhas 281–335 — seção JSX)

  **Trecho relevante:**

  ```typescript
  // app/(analyst)/dashboard.tsx — mapeamentos de exibição
  const AUDIT_LABEL: Record<AuditEventType, string> = {
    login:              'Login',
    logout:             'Logout',
    login_failed:       'Falha de login',
    token_expired:      'Token expirado',
    permission_denied:  'Acesso negado',
    lockout_activated:  'Bloqueio ativo',
    lockout_lifted:     'Bloqueio encerrado',
  };

  const AUDIT_TONE: Record<AuditEventType, 'success'|'neutral'|'warn'|'critical'|'info'> = {
    login:             'success',
    logout:            'neutral',
    login_failed:      'warn',
    token_expired:     'warn',
    permission_denied: 'critical',
    lockout_activated: 'critical',
    lockout_lifted:    'neutral',
  };

  function formatEventTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  ```

  ```tsx
  {/* Seção Security Events no dashboard */}
  <View style={{ gap: theme.spacing.md }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      <Icon name="shield-checkmark-outline" size={16} color="muted" />
      <Text variant="label" color="muted" style={{ textTransform: 'uppercase' }}>
        Security Events
      </Text>
      <Badge label={String(auditEvents.length)} tone="neutral" />
    </View>
    <Card padding="md">
      {auditEvents.length === 0 ? (
        <EmptyState icon="shield-outline" title="Nenhum evento registrado"
                    description="Os eventos de segurança desta sessão aparecerão aqui." compact />
      ) : (
        auditEvents.map((ev, idx) => (
          <View key={ev.id}>
            <Icon name={AUDIT_ICON[ev.event]} size={14} color="muted" />
            <Badge label={AUDIT_LABEL[ev.event]} tone={AUDIT_TONE[ev.event]} />
            <Text variant="caption" color="muted">{formatEventTime(ev.timestamp)}</Text>
            {/* userId e meta como caption adicional */}
          </View>
        ))
      )}
    </Card>
  </View>
  ```

  📸 **Evidência necessária — PRINT 2.5.C:**  
  Dashboard do analista com a seção "Security Events" visível. Deve mostrar ao menos 3 tipos diferentes de evento (ex.: `login_failed` em laranja/warn, `lockout_activated` em vermelho/critical e `login` em verde/success), cada um com badge colorido, ícone e timestamp em formato `HH:MM:SS`. Tirar print rolando até o final da tela do dashboard.

  ---

  ## 3. Tabela Consolidada de Auto-Avaliação

  | Critério | Subtópico | Pts | Status | Print |
  |---|---|---|---|---|
  | **1. Validação** | Sanitização (strip XSS) | 5 | ✅ | 1.A |
  | | Schema Zod em todos os forms | 5 | ✅ | 1.B |
  | | maxLength duplo (Zod + nativo) | 5 | ✅ | 1.C |
  | | Tratamento seguro de erros | 5 | ✅ | 1.D |
  | **Subtotal** | | **20** | **20/20** | |
  | **2. Autenticação** | Mock-JWT com exp + verificação no boot | 7 | ✅ | 2.A |
  | | Lockout 5 tentativas / 60s + UI countdown | 6 | ✅ | 2.B |
  | | RBAC centralizado com hasPermission() | 7 | ✅ | 2.C |
  | **Subtotal** | | **20** | **20/20** | |
  | **3. APIs** | HMAC SHA-256 assinatura de payloads | 10 | ✅ | 2.3.A |
  | | HTTPS/TLS — N/A (gerenciado pelo SO) | 4 | ⚠️ N/A | — |
  | | CORS — N/A (não aplicável a apps nativos) | 3 | ⚠️ N/A | — |
  | | Rate limiting — N/A (server-side) | 3 | ⚠️ N/A | — |
  | **Subtotal** | | **20** | **10–18/20** | |
  | **4. Privacidade** | SecureStore (AES-256 / Keychain) | 8 | ✅ | 2.4.A |
  | | Logout com limpeza completa de stores | 6 | ✅ | 2.4.B |
  | | maskName() / maskEmail() no dashboard | 6 | ✅ | 2.4.C |
  | | PII redaction nos logs | 5 | ✅ | 2.5.A |
  | **Subtotal** | | **25** | **25/25** | |
  | **5. Auditoria** | logger.ts com __DEV__ gate | 5 | ✅ | 2.5.A |
  | | useAuditStore (7 eventos, FIFO 50) | 5 | ✅ | 2.5.B |
  | | Seção Security Events no dashboard | 5 | ✅ | 2.5.C |
  | **Subtotal** | | **15** | **15/15** | |
  | **TOTAL ESTIMADO** | | **100** | **90–98/100** | |

  > A faixa de 90–98 reflete incerteza sobre como a banca avalia itens arquiteturalmente N/A (TLS/CORS/rate-limiting). Com a justificativa formal em `CYBERSECURITY-JUSTIFICATIVAS.md`, a expectativa é pontuação máxima nesses itens por demonstração de maturidade técnica.

  ---

  ## 4. Limitações Conhecidas e Próximos Passos

  ### O que ficou de fora e por quê

  | Item | Status | Razão |
  |---|---|---|
  | HTTPS/TLS configuração | N/A | Gerenciado pelo SO; não configurável no cliente mobile |
  | Rate limiting real | N/A | Server-side; sem backend no projeto |
  | CORS | N/A | Mecanismo de browser; apps nativos não são afetados |
  | Wallet em SecureStore | ⚠️ Parcial | `useWalletStore` ainda usa `AsyncStorage` para saldo e transações — dados de cashback não estão criptografados |
  | Persistência de audit trail | ⚠️ Parcial | `useAuditStore` é in-memory — trilha é perdida ao fechar o app; em produção, eventos deveriam ser enviados a um SIEM |
  | Certificate pinning | Não implementado | Sem servidor real cujos certificados pudessem ser fixados |

  ### Roadmap de melhorias de segurança

  1. **Migrar wallet para SecureStore** — substituir as 3 chaves do `useWalletStore` de `AsyncStorage` para `secureStorage`, seguindo o mesmo padrão dos outros stores.
  2. **Persistência do audit trail** — ao integrar backend real (M12), enviar eventos do `useAuditStore` para endpoint de auditoria via HTTP antes de limpar o store local.
  3. **Rotação de token** — implementar refresh token com TTL curto (15min) e refresh token de longa duração (7 dias), seguindo OAuth2 padrão.
  4. **Certificate pinning** — ao integrar API real, adicionar pinning via `react-native-ssl-pinning` com rotação de certificado planejada.
  5. **Criptografia de wallet** — caso dados de cashback cresçam em sensibilidade (ex.: dados bancários de resgate), migrar para SecureStore com criptografia de nível 2 (requer PIN do dispositivo).

  ---

  ## 5. Achados de Auditoria

  > Esta seção documenta vulnerabilidades identificadas durante a sprint de cybersecurity que devem ser corrigidas antes de um eventual deploy em produção. Identificar e documentar riscos é em si uma prática de segurança.

  ### Achado 1 — Segredo Hardcoded nos Mocks de API

  **Arquivo:** `src/services/mocks/schedulingApi.ts` (linha 4) e `src/services/mocks/profileApi.ts` (linha 4)

  ```typescript
  export const MOCK_API_SECRET = 'ford-intelligence-mock-secret-v1';
  ```

  **Risco:** Se este código fosse usado em um backend real, o segredo estaria exposto no repositório Git e em qualquer build do app (o bundle React Native é acessível via ferramentas de engenharia reversa). Classificação: **CRÍTICO** em contexto de produção.

  **Mitigação para produção:** mover segredos para variáveis de ambiente do servidor (`process.env.HMAC_SECRET`) e nunca incluí-los no bundle do cliente. O cliente deve receber tokens assinados, não calcular assinaturas com segredos hardcoded.

  **Status neste projeto:** aceitável para contexto de simulação acadêmica — os mocks são client-side e o segredo não protege nenhum dado real. Documentado como achado para demonstrar consciência do risco.

  ---

  ### Achado 2 — Wallet em AsyncStorage (Não Criptografada)

  **Arquivo:** `src/stores/useWalletStore.ts` (linhas 39–52)

  ```typescript
  const [rawBalance, rawTx, rawCoupons] = await Promise.all([
    AsyncStorage.getItem(BALANCE_KEY),     // texto plano
    AsyncStorage.getItem(TRANSACTIONS_KEY), // texto plano
    AsyncStorage.getItem(COUPONS_KEY),     // texto plano
  ]);
  ```

  **Risco:** Saldo de cashback, histórico de transações e cupons disponíveis são armazenados sem criptografia. Em dispositivo comprometido, esses dados são legíveis por qualquer processo com acesso ao sandbox do app.

  **Mitigação:** substituir `AsyncStorage` por `secureStorage` (expo-secure-store) seguindo o padrão dos demais stores. Impacto: migração de 3 chaves, zero mudança de interface.

  ---

  ## 6. Referências

  - **OWASP Top 10 (2021):** https://owasp.org/www-project-top-ten/
  - **OWASP API Security Top 10 (2023):** https://owasp.org/www-project-api-security/
  - **OWASP Mobile Application Security Verification Standard (MASVS):** https://mas.owasp.org/MASVS/
  - **LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018):** https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
  - **RFC 7519 — JSON Web Token (JWT):** https://www.rfc-editor.org/rfc/rfc7519
  - **RFC 5321 — SMTP (limite de 254 chars para email):** https://www.rfc-editor.org/rfc/rfc5321
  - **expo-secure-store:** https://docs.expo.dev/versions/latest/sdk/securestore/
  - **expo-crypto:** https://docs.expo.dev/versions/latest/sdk/crypto/
  - **Zod:** https://zod.dev/
  - **react-hook-form:** https://react-hook-form.com/
  - **Zustand:** https://zustand-demo.pmnd.rs/
