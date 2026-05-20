# Guia de Prints de Evidência — Sprint Cybersecurity

**Produto:** Ford Intelligence  
**Data:** 19/05/2026  
**Total de prints:** 11 (9 reais ✅ | 2 simuladas 🎭)

---

## Seção 0 — Preparação do Ambiente

### Subir o projeto localmente

```bash
git clone https://github.com/vmismael/Cyber-Sprint-Ford.git
cd Cyber-Sprint-Ford
npm install
npm run start
```

No terminal Metro, pressione:
- `a` para Android (emulador Android Studio)
- `i` para iOS (simulador Xcode — apenas macOS)
- `w` para web (Chrome — mapa usa fallback stub)

> **Recomendado para prints:** Android Emulator (Android Studio) ou dispositivo físico Android, pois permite visualizar o SecureStore com mais clareza via `adb`.

### Ferramentas necessárias

| Ferramenta | Uso | Download |
|---|---|---|
| Android Studio | Emulador Android + adb | https://developer.android.com/studio |
| Expo Go | Dispositivo físico (iOS/Android) | App Store / Play Store |
| Metro Console | Logs do app (terminal onde rodou `npm run start`) | já incluso |
| VS Code | Editar arquivos temporariamente para prints 2.A e 2.3.A | já instalado |

### Como criar usuários de teste

Não há banco de dados — o mock aceita qualquer email/senha. Usar as contas abaixo:

| Persona | Email | Senha | Toggle Analista |
|---|---|---|---|
| **Cliente** | `cliente@ford.com` | qualquer (ex: `12345678`) | Desativado |
| **Analista** | `analista@ford.com` | qualquer (ex: `12345678`) | **Ativado** |

> O toggle "Sou analista Ford" fica na parte inferior da tela de login — é um Pressable com ícone de escudo.

### Estrutura de pastas para salvar as evidências

```
evidencias/
├── 1-validacao/
│   ├── 01-1A-sanitizacao.png
│   ├── 01-1B-zod-maxlength.png
│   ├── 01-1C-maxlength-nativo.png
│   └── 01-1D-safe-error.png
├── 2-autenticacao/
│   ├── 02-2A-token-expirado.png
│   ├── 02-2B-lockout-ui.png
│   └── 02-2C-rbac-redirect.png
├── 3-apis/
│   └── 03-23A-hmac-invalido.png
├── 4-privacidade/
│   ├── 04-24A-securestorecode.png
│   ├── 04-24B-logout-completo.png
│   └── 04-24C-dados-mascarados.png
└── 5-auditoria/
    ├── 05-25A-logger-redact.png
    ├── 05-25B-audit-eventos.png
    └── 05-25C-security-events-dashboard.png
```

---

## Seção 1 — Catálogo de Prints

---

## Print 1.A — Sanitização de Caracteres Perigosos

**Critério avaliado:** 1. Segurança de Entrada  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- App rodando (`npm run start`)
- Usuário logado como cliente (qualquer email/senha)
- Fluxo de agendamento: Tab Mapa → tocar em qualquer concessionária → "Agendar" → selecionar serviço → selecionar modalidade "Leva e Traz"

### Passo a passo
1. Na tela "Onde devemos buscar?" (`scheduling/address.tsx`), digitar no campo:
   ```
   Av. Paulista <script>alert(1)</script>, 1500
   ```
2. Selecionar ou não uma sugestão — o importante é avançar com esse texto.
3. Avançar para data/horário → avançar para confirmação (`scheduling/confirm.tsx`).
4. Tirar print da tela de confirmação mostrando o campo "Retirada".

### O que a print deve mostrar
- Campo "Retirada" exibindo o valor: `Av. Paulista alert(1), 1500` (sem `<script>`, `>`, `</script>`)
- Os caracteres `<`, `>` foram removidos pelo `sanitizeString()`
- Nenhum alert/popup JavaScript foi disparado

### Como enquadrar
Print de tela inteira do dispositivo/emulador com a tela de confirmação visível. Mostrar o card de resumo completo (Concessionária, Serviço, Modalidade, Retirada, Data, Horário).

---

## Print 1.B — Validação Zod com Mensagem de Erro Inline

**Critério avaliado:** 1. Segurança de Entrada  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 3 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- App na tela de cadastro (`/(auth)/signup.tsx`)
- Pode chegar lá via: tela de login → "Não tenho conta" (ou Link "Criar conta")

### Passo a passo
1. Abrir a tela de cadastro.
2. No campo "Nome completo": digitar apenas `A` (1 caractere — abaixo do mínimo de 2).
3. No campo "Senha": digitar `1234567` (7 caracteres — abaixo do mínimo de 8).
4. Tocar fora dos campos para disparar a validação.
5. Tirar print mostrando ambas as mensagens de erro.

### O que a print deve mostrar
- Campo "Nome" com mensagem vermelha: `"Informe seu nome"` (min 2)
- Campo "Senha" com mensagem vermelha: `"Mínimo de 8 caracteres"`
- Botão "Criar conta" **desabilitado** (opaco ou cinza)
- ⚠️ NÃO deve aparecer: stack trace, nome de biblioteca, linha de código

### Como enquadrar
Print do scroll superior da tela de cadastro, mostrando pelo menos 2 campos com erro visível simultaneamente.

---

## Print 1.C — Limite de Tamanho (maxLength Nativo)

**Critério avaliado:** 1. Segurança de Entrada  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- Usuário logado como cliente
- Fluxo de agendamento com modalidade "Leva e Traz" ativada (passo 3)

### Passo a passo
1. Na tela de endereço de retirada, colar ou digitar uma string de exatamente 205 caracteres (acima do limite de 200).
   ```
   Avenida Paulista número mil e quinhentos, Bela Vista, São Paulo, Estado de São Paulo, Brasil, CEP 01310-100, próximo ao MASP, entre as ruas Augusta e Consolação
   ```
   (se a string colada tiver mais de 200 chars, o campo para de aceitar automaticamente)
2. Verificar que o campo aceita no máximo 200 caracteres.
3. Tirar print mostrando o campo preenchido ao limite.

### O que a print deve mostrar
- Campo "Endereço de retirada" com texto cortado em 200 caracteres
- Mensagem de validação Zod visível (se o usuário tentou avançar): `"Máximo de 200 caracteres."`
- OU: demonstração de que não é possível continuar digitando após o limite

### Como enquadrar
Print do campo de endereço focado, com texto completo visível. Se possível mostrar também a mensagem de erro Zod.

---

## Print 1.D — Tratamento Seguro de Erros (Sem Stack Trace)

**Critério avaliado:** 1. Segurança de Entrada  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 3 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- App na tela de login

### Passo a passo
1. Digitar qualquer email válido (ex: `teste@teste.com`) e uma senha qualquer (ex: `senhaterrada`).
2. Tocar em "Entrar".
3. Aguardar a resposta do mock (delay de 400–700ms).
4. Tirar print da mensagem de erro exibida.

### O que a print deve mostrar
- Mensagem genérica: `"Algo deu errado. Tente novamente."` OU uma das mensagens do allowlist (`"Credenciais inválidas."`)
- ⚠️ NÃO deve aparecer: texto com `Error:`, `at Function`, nome de arquivo (`.ts`, `.tsx`), nome de biblioteca (`zustand`, `expo`, `react`)
- O botão "Entrar" está habilitado novamente (não em loading)

### Como enquadrar
Print da tela de login com a mensagem de erro visível em vermelho abaixo dos campos.

---

## Print 2.A — Token JWT Expirado Redireciona para Login

**Critério avaliado:** 2. Autenticação  
**Status:** 🎭 Simulada (requer alteração temporária de código)  
**Dificuldade:** ⭐⭐ Médio  
**Tempo estimado:** 10 minutos

### Ferramenta
VS Code + App no emulador

### Pré-requisitos
- Acesso ao código em `src/services/mocks/authApi.ts`
- App com Metro rodando

### Passo a passo
1. Abrir `src/services/mocks/authApi.ts`, linha 39. Alterar:
   ```typescript
   // ANTES:
   const TOKEN_EXPIRY_SECS = 3600;
   // DEPOIS:
   const TOKEN_EXPIRY_SECS = 1; // expira em 1 segundo
   ```
2. Salvar o arquivo — Metro recarrega automaticamente (hot reload).
3. Fazer login no app (qualquer email/senha, cliente ou analista).
4. Aguardar 3 segundos.
5. Fechar o app completamente (swipe up e fechar no Android, ou Home + App Switcher no iOS).
6. Reabrir o app.
7. Tirar print da tela de login sendo exibida automaticamente.
8. **Importante:** reverter a alteração após a print (`TOKEN_EXPIRY_SECS = 3600`).

### O que a print deve mostrar
- Tela de login exibida logo após o cold start (sem passar pela Home ou Dashboard)
- Nenhum dado do usuário anterior visível
- Pode-se tirar print do Metro console também, mostrando o log `[SECURITY] Token expirado na hidratação — sessão encerrada`

### Como enquadrar
Print da tela de login em tela cheia. Se quiser evidência adicional, tirar print do terminal Metro com o log de segurança visível (sem dados sensíveis — apenas a mensagem de log).

---

## Print 2.B — Lockout com Countdown Regressivo

**Critério avaliado:** 2. Autenticação  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- App na tela de login

### Passo a passo
1. No campo "E-mail", digitar `teste@ford.com`.
2. No campo "Senha", digitar `senhaerrada1` e tocar "Entrar". (Tentativa 1)
3. Repetir com senhas diferentes: `senhaerrada2`, `senhaerrada3`, `senhaerrada4`. (Tentativas 2–4)
4. Na 5ª tentativa, digitar `senhaerrada5` e tocar "Entrar".
5. **Imediatamente após a 5ª tentativa**, tirar print da tela.

### O que a print deve mostrar
- Banner vermelho com ícone de cadeado e texto: `"Muitas tentativas. Tente novamente em Xs"` (X em torno de 58–60)
- Botão "Entrar" substituído por `"Bloqueado (Xs)"` e visualmente desabilitado (opaco)
- O contador deve estar em movimento (tirar a print logo após o lockout ativar para pegar um número entre 55–60)

### Como enquadrar
Print da tela de login completa mostrando: campos de email/senha preenchidos, banner de lockout vermelho visível e botão desabilitado.

---

## Print 2.C — RBAC: Cliente Redirecionado do Dashboard Analista

**Critério avaliado:** 2. Autorização  
**Status:** 🎭 Simulada (requer alteração temporária de código)  
**Dificuldade:** ⭐⭐ Médio  
**Tempo estimado:** 10 minutos

### Ferramenta
VS Code + App + Metro console

### Pré-requisitos
- Usuário logado como **cliente** (toggle analista desativado no login)

### Passo a passo

**Opção A — via Metro log (mais limpa):**
1. Fazer login como cliente.
2. Abrir `app/(analyst)/dashboard.tsx`, localizar o `useEffect` com o guard RBAC (linhas 51–55).
3. Adicionar temporariamente: `console.log('RBAC guard: usuario nao tem view:analyst_dashboard, redirecionando')` antes do `logAudit`.
4. Salvar — hot reload.
5. Tirar print do Metro mostrando o log + a tela de tabs do cliente no emulador ao lado.
6. Reverter a alteração.

**Opção B — via código (mais impactante visualmente):**
1. Em `src/hooks/useProtectedRoute.ts`, comentar temporariamente o return do branch analista para forçar um cliente a cair em `(analyst)/dashboard`.
2. Fazer login como cliente — o app vai ao dashboard analista mas o guard local (`useEffect` em dashboard.tsx) vai redirecionar em ~1 frame.
3. Tirar print do Metro mostrando `permission_denied` no audit log.
4. **Importante:** reverter IMEDIATAMENTE — não deixar esse código no repo.

### O que a print deve mostrar
- **Opção A:** Metro terminal com `permission_denied` no audit store + tela de tabs do cliente visível no emulador
- **Opção B:** Metro terminal com log de redirect + tela de tabs (o dashboard não fica visível por mais de 1 frame)

### Como enquadrar
Split de tela: emulador à esquerda mostrando o cliente nas tabs; Metro terminal à direita mostrando o log de auditoria de `permission_denied`.

---

## Print 2.3.A — HMAC: Mock Rejeita Payload com Assinatura Inválida

**Critério avaliado:** 3. Proteção de APIs  
**Status:** 🎭 Simulada (requer alteração temporária de código)  
**Dificuldade:** ⭐⭐ Médio  
**Tempo estimado:** 10 minutos

### Ferramenta
VS Code + App no emulador

### Pré-requisitos
- Usuário logado como cliente
- Fluxo de agendamento completo (5 steps, checkbox aceito)

### Passo a passo
1. Abrir `app/scheduling/confirm.tsx`, localizar a função `onConfirm` (linha ~61).
2. Encontrar a linha:
   ```typescript
   const sig = await signPayload(JSON.stringify(bookingPayload), MOCK_API_SECRET);
   ```
3. Substituir temporariamente por:
   ```typescript
   const sig = 'assinatura_invalida_para_demonstracao';
   ```
4. Salvar — hot reload.
5. No app, completar o fluxo de agendamento e tocar em "Confirmar agendamento".
6. Tirar print da tela de erro exibida (o botão vai de loading para estado de erro).
7. Tirar print do Metro console mostrando `Error: Assinatura inválida.` lançada pelo mock.
8. **Importante:** reverter a alteração após as prints.

### O que a print deve mostrar
- **Print A:** Tela de confirmação com botão voltando ao estado normal (a chamada falhou) — o erro não é exibido na tela porque `toSafeMessage` retorna mensagem genérica, mas o botão sai do estado `loading`
- **Print B (Metro console):** `Error: Assinatura inválida.` lançada pelo `schedulingApi.ts` — prova que o mock rejeitou o payload adulterado
- Opcional: mostrar o código dos dois arquivos lado a lado evidenciando o mecanismo de sign + verify

### Como enquadrar
Split de tela ou duas prints separadas: (1) tela do app com o botão fora de loading e (2) Metro terminal com o erro do mock.

---

## Print 2.4.A — SecureStore: Dados Sensíveis Criptografados em Repouso

**Critério avaliado:** 4. Privacidade  
**Status:** ✅ Real  
**Dificuldade:** ⭐⭐ Médio  
**Tempo estimado:** 10 minutos

### Ferramenta
Código fonte (VS Code) + Metro console

### Pré-requisitos
- Usuário logado com perfil completo (onboarding finalizado)

### Opção A — via código (recomendada, sem necessidade de adb)
1. Adicionar temporariamente em `src/stores/useUserStore.ts`, no final do método `hydrate()` após o `set({...})`:
   ```typescript
   console.log('[AUDIT] Perfil hidratado do SecureStore:', profile?.vehicleModel, profile?.plan);
   ```
2. Fechar e reabrir o app (cold start).
3. Tirar print do Metro mostrando o log com os dados do perfil sendo lidos do SecureStore.
4. Tirar print lateral do código de `useUserStore.ts` mostrando `secureStorage.getItem(PROFILE_KEY)` em destaque.

### Opção B — via adb (Android, requer dispositivo rooteado ou emulador)
```bash
adb shell
run-as com.fordinteligence  # ou o packageName do app.json
cat databases/RKStorage      # AsyncStorage (deve estar vazio ou sem dados de perfil)
```
Mostrar que o arquivo de AsyncStorage não contém dados de perfil — eles estão no Keystore (inacessível via filesystem).

### O que a print deve mostrar
- **Opção A:** Metro log mostrando `[AUDIT] Perfil hidratado do SecureStore: ranger premium` + código de `useUserStore.ts` com `secureStorage.getItem` destacado
- **Opção B:** Output do `adb shell` mostrando que AsyncStorage não tem as chaves `ford.user.profile` ou `ford.auth.token`

### Como enquadrar
Split de tela: código à esquerda com `secureStorage` em destaque; Metro log à direita evidenciando a leitura bem-sucedida. OU: print do código de `secureStorage.ts` mostrando `SecureStore.getItemAsync` lado a lado com `secureStorage.ts` inteiro.

---

## Print 2.4.B — Logout: Limpeza Completa de Todos os Dados

**Critério avaliado:** 4. Privacidade  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- Usuário logado como cliente com perfil completo e pelo menos 1 agendamento no histórico

### Passo a passo
1. Ir para a aba **Perfil** e tirar print 1: mostrar nome do usuário, plano ativo e histórico de agendamentos visível.
2. Rolar até o botão "Sair" e tocá-lo.
3. Confirmar no Alert nativo "Sair".
4. Aguardar o redirecionamento para a tela de login.
5. Tirar print 2: tela de login completamente limpa (campos vazios, sem dados do usuário anterior).

### O que a print deve mostrar
- **Print A (antes):** Tela de Perfil com nome, plano (badge colorido) e lista de agendamentos
- **Print B (depois):** Tela de login com campos vazios

### Como enquadrar
Duas prints side-by-side ou em sequência. Legenda: "Antes do logout" e "Após o logout".

---

## Print 2.4.C — Dados PII Mascarados no Dashboard do Analista

**Critério avaliado:** 4. Privacidade  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- Login como **analista** (toggle "Sou analista Ford" ativado no login)

### Passo a passo
1. Fazer login com o toggle analista ativado.
2. O app direciona automaticamente para `/(analyst)/dashboard`.
3. Rolar até a seção "Leads Qualificados pela IA".
4. Tirar print dos LeadCards visíveis.

### O que a print deve mostrar
- Nomes no formato `J*** S***` (iniciais + asteriscos) — não nomes completos
- Badges coloridos com score de IA e plano
- Dados não-PII visíveis: veículo, plano, receita estimada, dias desde última atividade
- ⚠️ Nenhum nome completo deve ser visível nos cards da lista

### Como enquadrar
Print da lista de leads (3–5 cards visíveis). Pode-se adicionar uma seta ou anotação apontando para um nome mascarado para clareza.

**Bônus:** adicionar temporariamente um `console.log('Lead real:', lead.clientName)` em `LeadCard.tsx` para mostrar no Metro que o dado original existe mas é mascarado na exibição. Tirar print do Metro mostrando "Carlos Mendonça" e do app mostrando "C*** M***".

---

## Print 2.5.A — Logger com PII Redaction no Console de Desenvolvimento

**Critério avaliado:** 4. Privacidade / 5. Logs  
**Status:** 🎭 Simulada (requer adição temporária de log)  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
VS Code + Metro console

### Pré-requisitos
- App rodando em modo desenvolvimento (`npm run start`)

### Passo a passo
1. Abrir `app/_layout.tsx` e adicionar no início do componente root (dentro da função, antes do return):
   ```typescript
   import { logger } from '@/utils/logger';
   // ...
   logger.log('Debug usuario:', {
     email: 'joao.silva@ford.com',
     token: 'jwt_abc123_secreto',
     name: 'João Silva',
     plan: 'premium',
   });
   ```
2. Salvar — Metro recarrega.
3. Tirar print do terminal Metro mostrando o output.
4. Reverter a alteração.

### O que a print deve mostrar
```
Debug usuario: { email: '[REDACTED]', token: '[REDACTED]', name: 'João Silva', plan: 'premium' }
```
- `email` → `[REDACTED]`
- `token` → `[REDACTED]`
- `name` → `João Silva` (não é campo sensível — passa sem redação)
- `plan` → `premium` (não é campo sensível)

### Como enquadrar
Print do terminal Metro com o log visível. Destacar com um retângulo/seta os campos `[REDACTED]`.

---

## Print 2.5.B — Audit Store: Sequência de Eventos de Segurança

**Critério avaliado:** 5. Monitoramento  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 5 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- App na tela de login

### Passo a passo
1. Fazer 3 tentativas de login com senha errada (não atingir o lockout — parar em 3).
2. Fazer login corretamente como analista (toggle ativado).
3. No dashboard, rolar até a seção "Security Events" (ao final do scroll).
4. Tirar print.

### O que a print deve mostrar
- Seção "Security Events" com badge mostrando contagem de eventos (ex: "4")
- 3 eventos `"Falha de login"` com badge laranja/warn
- 1 evento `"Login"` com badge verde/success
- Timestamps no formato `HH:MM:SS`
- Ícones semânticos para cada tipo de evento

### Como enquadrar
Print da seção "Security Events" do dashboard, mostrando pelo menos 3 eventos diferentes. A lista é ordenada por recência (mais recente no topo).

---

## Print 2.5.C — Security Events Dashboard: Visão Completa

**Critério avaliado:** 5. Auditoria  
**Status:** ✅ Real  
**Dificuldade:** ⭐ Fácil  
**Tempo estimado:** 8 minutos

### Ferramenta
App no emulador/dispositivo

### Pré-requisitos
- Geração de eventos variados (para tornar a print mais rica)

### Passo a passo (sequência completa de geração de eventos)
1. Fazer 5 tentativas falhas de login para ativar lockout (`lockout_activated`).
2. Aguardar 60 segundos (`lockout_lifted` automático).
3. Fazer login como analista → evento `login`.
4. Aguardar 10 segundos.
5. Fazer logout → evento `logout`.
6. Fazer login novamente como analista.
7. Rolar o dashboard até o final (seção "Security Events").
8. Tirar print.

### O que a print deve mostrar
- Múltiplos tipos de evento com badges de cores diferentes:
  - Verde (`login`, `lockout_lifted`)
  - Laranja/amarelo (`login_failed`)
  - Vermelho (`lockout_activated`)
  - Cinza (`logout`)
- Ícones diferentes para cada tipo
- Timestamps variados
- Badge com contagem total de eventos na section header

### Como enquadrar
Print de tela inteira do dispositivo com a seção "Security Events" centralizada e legível. A seção deve estar completamente visível (não cortada).

---

## Seção 2 — Prints Simuladas (🎭)

Apenas 2 prints desta entrega são simuladas: **2.A** (token expirado) e **2.C** (RBAC redirect). As demais requerem apenas manipulação temporária de código, sendo mais precisamente classificadas como "implementação mínima viável" do que simulações.

### Print 2.A — Implementação mínima viável (recomendada)

A alteração de `TOKEN_EXPIRY_SECS = 3600` para `TOKEN_EXPIRY_SECS = 1` é válida e produz uma print 100% real do comportamento implementado. A lógica de verificação de `exp` existe no código de produção — apenas o tempo de expiração é reduzido para demonstração.

**Esforço:** ~2 linhas de código, ~5 minutos. **Recomenda-se esta opção.**

### Print 2.C — Implementação mínima viável (recomendada)

Adicionar um `console.log` no guard RBAC e tirar print do Metro é suficiente e 100% real. Não é necessário forçar o cliente a cair no dashboard analista — o log de `permission_denied` no audit store durante o fluxo normal (ex: cliente logado tentando acessar `/leads`) já demonstra o comportamento.

**Alternativa sem alterar código:** logar o usuário como cliente, ir para `app/(tabs)/wallet.tsx` e verificar no Metro que o guard `hasPermission(user, 'view:wallet')` passa. Depois, comentar a permissão `view:wallet` do cliente em `rbac.ts` e mostrar o `permission_denied` no log. **Esforço:** ~2 minutos.

---

## Seção 3 — Checklist Final de Entrega

| # | Print | Status | Arquivo salvo em |
|---|---|---|---|
| 1.A | Sanitização XSS no endereço de retirada | ⬜ | `evidencias/1-validacao/01-1A-sanitizacao.png` |
| 1.B | Zod: erro inline senha curta | ⬜ | `evidencias/1-validacao/01-1B-zod-maxlength.png` |
| 1.C | maxLength nativo — campo endereço | ⬜ | `evidencias/1-validacao/01-1C-maxlength-nativo.png` |
| 1.D | Safe error — mensagem genérica no login | ⬜ | `evidencias/1-validacao/01-1D-safe-error.png` |
| 2.A | Token expirado → redirect login | ⬜ | `evidencias/2-autenticacao/02-2A-token-expirado.png` |
| 2.B | Lockout 60s com countdown UI | ⬜ | `evidencias/2-autenticacao/02-2B-lockout-ui.png` |
| 2.C | RBAC: cliente bloqueado do dashboard analista | ⬜ | `evidencias/2-autenticacao/02-2C-rbac-redirect.png` |
| 2.3.A | HMAC: mock rejeita assinatura inválida | ⬜ | `evidencias/3-apis/03-23A-hmac-invalido.png` |
| 2.4.A | SecureStore: dados criptografados em repouso | ⬜ | `evidencias/4-privacidade/04-24A-securestorecode.png` |
| 2.4.B | Logout: limpeza completa (antes/depois) | ⬜ | `evidencias/4-privacidade/04-24B-logout-completo.png` |
| 2.4.C | Dados PII mascarados no LeadCard | ⬜ | `evidencias/4-privacidade/04-24C-dados-mascarados.png` |
| 2.5.A | Logger: PII [REDACTED] no Metro console | ⬜ | `evidencias/5-auditoria/05-25A-logger-redact.png` |
| 2.5.B | Audit store: sequência de eventos | ⬜ | `evidencias/5-auditoria/05-25B-audit-eventos.png` |
| 2.5.C | Security Events dashboard: visão completa | ⬜ | `evidencias/5-auditoria/05-25C-security-events-dashboard.png` |

---

## Seção 4 — Ordem Recomendada de Execução

Agrupado por ferramenta para minimizar troca de contexto:

### Grupo 1 — App apenas (sem alterar código) — ~25 minutos

Começar aqui. Apenas interage com o app rodando.

| Ordem | Print | Tela | Tempo |
|---|---|---|---|
| 1 | **1.D** | Login com senha errada | 3 min |
| 2 | **2.B** | 5 tentativas falhas → lockout | 5 min |
| 3 | **2.4.B** | Perfil (print antes) → logout → login (print depois) | 5 min |
| 4 | **2.5.B** | 3 falhas → login analista → Security Events | 5 min |
| 5 | **2.5.C** | Sequência completa de eventos → Security Events | 8 min |

### Grupo 2 — App + tela de cadastro/agendamento — ~15 minutos

| Ordem | Print | Tela | Tempo |
|---|---|---|---|
| 6 | **1.B** | Cadastro com senha curta | 3 min |
| 7 | **1.A** | Endereço com `<script>` → confirmação | 5 min |
| 8 | **1.C** | Endereço com texto longo → limite | 4 min |
| 9 | **2.4.C** | Login analista → lista de leads mascarados | 3 min |

### Grupo 3 — VS Code + Metro console (logs) — ~15 minutos

| Ordem | Print | Ação | Tempo |
|---|---|---|---|
| 10 | **2.5.A** | Adicionar `logger.log` temporário → Metro | 5 min |
| 11 | **2.4.A** | Adicionar log do SecureStore → Metro | 5 min |

### Grupo 4 — VS Code + alteração temporária de código — ~25 minutos

Fazer por último — cada uma requer alterar e reverter código.

| Ordem | Print | Arquivo a alterar | Tempo |
|---|---|---|---|
| 12 | **2.A** | `authApi.ts` linha 39: `TOKEN_EXPIRY_SECS = 1` | 10 min |
| 13 | **2.3.A** | `confirm.tsx`: substituir sig por string inválida | 10 min |
| 14 | **2.C** | Adicionar `console.log` no guard RBAC | 5 min |

---

**Tempo total estimado:** 80 minutos  
**Prints reais:** 9/14  
**Prints simuladas/com alteração mínima de código:** 5/14 (todas revertidas após uso)
