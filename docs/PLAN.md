# Ford Intelligence — Plano de Execução

Plano operacional dividido em milestones incrementais. Cada milestone tem **branch dedicada**, **objetivo claro**, **checklist de entregas** e **commit final**. Execução do setup ao "deploy" (build EAS de preview).

> Fonte de verdade: [PRD.md](PRD.md) · Briefing: [../CLAUDE.md](../CLAUDE.md)
> Escopo: Frontend Mobile only (React Native + Expo). Sem backend, sem ML, sem n8n.

---

## Convenções de Branch & Commit

- **Branch base:** `main` (produção) ← `develop` (integração)
- **Padrão de branch:** `feat/m{N}-{slug}` · `fix/{slug}` · `chore/{slug}`
- **Commits:** Conventional Commits — `feat(scope): ...`, `fix(scope): ...`, `chore(scope): ...`
- **Merge:** squash merge de cada milestone para `develop`; `develop → main` ao fim do projeto.

---

## M0 — Setup & Fundações

**Branch:** `chore/m0-setup`
**Objetivo:** Inicializar projeto Expo + TypeScript + Expo Router e instalar dependências core.

### Entregas
- [x] `npx create-expo-app@latest Mobile-Ford --template default` (managed)
- [x] Habilitar **TypeScript strict** em `tsconfig.json`
- [x] Configurar **Expo Router** (já vem no template default)
- [x] Configurar alias `@/*` → `./src/*` (`tsconfig.json`; em SDK 54 o Metro honra paths sem babel plugin)
- [x] Instalar deps core: `zustand`, `react-hook-form`, `zod`, `expo-blur`, `expo-secure-store`, `@react-native-async-storage/async-storage`, `react-native-reanimated`, `moti`
- [x] Instalar deps 3D: `three`, `expo-gl`, `@react-three/fiber`
- [x] Instalar deps mapas: `react-native-maps`
- [x] Instalar `@expo/vector-icons` (já incluso no Expo)
- [x] Configurar ESLint + Prettier (`eslint-config-expo` + `prettier`)
- [x] Criar estrutura de pastas conforme [CLAUDE.md](../CLAUDE.md#folder-structure)
- [x] `.gitignore`, `.env.example`, `README.md` mínimo
- [x] `app.json` com nome "Ford Intelligence", slug, ícone placeholder, splash dark
- [x] Smoke test: `npx expo start` abre app em branco sem erros

**Status:** ✅ Concluído — commit `8ea8ee4` na branch `chore/m0-setup`
**Commit final:** `chore(setup): bootstrap Expo + TS + Expo Router + base deps`

---

## M1 — Design System & Tema

**Branch:** `feat/m1-design-system`
**Objetivo:** Implementar tokens de design, paleta Ford, tipografia e componentes-base reutilizáveis.

### Entregas
- [x] `src/theme/tokens.ts` — cores base, espaçamentos, raios, sombras, blurs
- [x] `src/theme/plans.ts` — variantes Agro / Urban / Premium (acentos)
- [x] `src/theme/typography.ts` — escala tipográfica (h1–caption)
- [x] `src/theme/ThemeProvider.tsx` — context/hook `useTheme()` consumindo Zustand `usePlanStore`
- [x] Carregar fontes via `expo-font` em `app/_layout.tsx` (Inter ou Ford Antenna)
- [x] Componentes base em `src/components/`:
  - [x] `Text` (variantes h1/h2/h3/body/caption)
  - [x] `Button` (primary/secondary/ghost + ícone opcional)
  - [x] `GlassPanel` (wrapper `expo-blur` + borda sutil)
  - [x] `Card`
  - [x] `Input` (integrado com `react-hook-form`)
  - [x] `Badge` (status/alert)
  - [x] `Icon` (wrapper `@expo/vector-icons`)
  - [x] `Screen` (SafeArea + bg base)
- [x] `src/stores/usePlanStore.ts` (Zustand) com plano atual + setter
- [x] Tela de showcase `app/_dev/design-system.tsx` listando todos os componentes (apenas em DEV)

**Status:** ✅ Concluído — branch `feat/m1-design-system`
**Commit final:** `feat(design-system): tokens, theme provider e componentes base`

---

## M2 — Navegação & Auth Stack

**Branch:** `feat/m2-navigation-auth`
**Objetivo:** Estrutura de roteamento Expo Router com fluxos de autenticação (mock) e tabs principais.

### Entregas
- [x] `app/_layout.tsx` — root layout com fonts + ThemeProvider + StatusBar dark
- [x] `app/(auth)/_layout.tsx` — stack auth
  - [x] `app/(auth)/login.tsx`
  - [x] `app/(auth)/signup.tsx`
  - [x] `app/(auth)/forgot-password.tsx`
- [x] `app/(tabs)/_layout.tsx` — bottom tabs (Home / Mapa / Carteira / Perfil)
  - [x] `app/(tabs)/index.tsx` (Home placeholder)
  - [x] `app/(tabs)/map.tsx` (placeholder)
  - [x] `app/(tabs)/wallet.tsx` (placeholder)
  - [x] `app/(tabs)/profile.tsx` (placeholder + logout)
- [x] `app/+not-found.tsx`
- [x] `src/stores/useAuthStore.ts` — token, user, login/logout (mock async)
- [x] Guarda de rota: redireciona não autenticado para `/login`
- [x] `expo-secure-store` para persistir token mock (`src/services/secureStorage.ts`)
- [x] Animações de transição entre stacks (fade no root stack, slide no auth stack)

**Status:** ✅ Concluído — commit `5b50674` na branch `feat/m2-navigation-auth`
**Commit final:** `feat(navigation): expo router com auth stack e tabs base`

---

## M3 — Onboarding & Perfilamento

**Branch:** `feat/m3-onboarding`
**Objetivo:** Fluxo multi-step de onboarding capturando perfil de uso para alimentar o motor de IA (mock).

### Entregas
- [x] `app/(auth)/onboarding/_layout.tsx` — stack do wizard
- [x] Passo 1: Boas-vindas + branding
- [x] Passo 2: Modelo do veículo (seleção entre mocks: Ranger, Maverick, Territory, Mustang)
- [x] Passo 3: Estilo de uso (Urbano / Rural / Misto / Performance)
- [x] Passo 4: Quilometragem média mensal
- [x] Passo 5: Seleção de plano SaaS (Agro / Urban / Premium) com comparativo
- [x] Passo 6: Confirmação + animação de conclusão
- [x] Indicador de progresso (steps)
- [x] Validação por step com `zod` + `react-hook-form` (+ `trigger()` no mount para refletir defaultValues do draft)
- [x] `src/stores/useUserStore.ts` — perfil completo persistido em AsyncStorage
- [x] `src/services/mocks/profileApi.ts` — `submitProfile()` retorna risco mockado
- [x] Onboarding executa apenas no primeiro acesso (flag em AsyncStorage)
- [x] Botão Voltar (ghost) nos steps 2-6 já que `gestureEnabled: false`
- [x] Animações de mount via `react-native-reanimated` (substitui `moti` que quebrava o bundler web por incompatibilidade de `tslib`)

**Status:** ✅ Concluído — branch `feat/m3-onboarding`
**Commit final:** `feat(onboarding): implementa wizard de 6 steps e perfilamento do usuario`

> **Débito conhecido (resolver na M9):** o perfil hoje é por dispositivo. Quando a M9 introduzir o role do analista, migrar `useUserStore` para indexar perfil/flag por `userId`, junto com o role-gate.

---

## M4 — Home & Simulação de Telemetria IoT

**Branch:** `feat/m4-telemetry-home`
**Objetivo:** Tela principal com dados em tempo real simulados (OBD2) e sistema de alertas preditivos.

### Entregas
- [x] `src/features/telemetry/simulator.ts` — `EventEmitter` emitindo a cada 2s: hodômetro, pressão pneus (4), temperatura motor, nível combustível, bateria
- [x] `src/features/telemetry/useTelemetry.ts` — hook que assina o emitter
- [x] `src/stores/useVehicleStore.ts` — estado do veículo + leituras atuais
- [x] `src/services/mocks/alertsApi.ts` — gera alertas baseados em thresholds (ex: km > 9000 → "Revisão antecipada")
- [x] `src/stores/useAlertsStore.ts` — fila de alertas
- [x] Tela Home (`app/(tabs)/index.tsx`):
  - [x] Header com saudação + plano atual (badge)
  - [x] Card destaque: próxima manutenção prevista (IA mock)
  - [x] Carrossel de KPIs em GlassPanels: km, pneus, temp, bateria
  - [x] Lista de alertas ativos (com severidade)
  - [x] CTA "Agendar serviço" (navega para M6)
- [x] Animações reativas em mudança de leituras (`react-native-reanimated`; `moti` evitado pelo mesmo motivo do M3)
- [x] Pull-to-refresh resincroniza simulador

**Status:** ✅ Concluído — branch `feat/m4-telemetry-home`
**Commit final:** `feat(telemetry): home com simulação IoT em tempo real e alertas preditivos`

---

## M5 — Visualização 3D do Veículo

**Branch:** `feat/m5-vehicle-3d`
**Objetivo:** Cena 3D interativa do veículo com hotspots de alerta sincronizados com a telemetria.

### Entregas
- [x] `app/vehicle/[id].tsx` — rota detalhe do veículo
- [x] `src/features/vehicle3d/Scene.tsx` — `<Canvas>` com `@react-three/fiber/native`
- [x] Modelo placeholder em `src/features/vehicle3d/CarMesh.tsx` montado com primitivas (boxes + cilindros) — sem `.glb` para manter o repo leve nesta etapa
- [x] Iluminação: ambient + directional + rim light azul Ford (`#1F6FEB`) + point light auxiliar
- [x] Câmera orbital com gestos via `react-native-gesture-handler` (Pan para girar, Pinch para zoom)
- [x] `src/features/vehicle3d/Hotspot.tsx` — esfera pulsante 3D nos 4 pneus, motor e bateria
- [x] Hotspots derivados da telemetria (`useVehicleStore`) com cor warn/critical sincronizada à mesma fonte do `useAlertsStore`
- [x] Toque em hotspot via raycast manual → `AlertSheet` (Modal RN + Reanimated `SlideInDown` + `GlassPanel`)
- [x] Botões: "Frontal", "Lateral", "Superior" com lerp animado entre presets
- [x] Loading skeleton enquanto cena monta
- [x] Otimização: `frameloop="demand"` no estado ocioso; `"always"` apenas durante gestos, animação de preset, ou enquanto algum hotspot estiver pulsando
- [x] CTA "Ver em 3D" no header da seção de telemetria da Home

**Status:** ✅ Concluído — branch `feat/m5-vehicle-3d`
**Commit final:** `feat(vehicle3d): cena 3D interativa com hotspots de alerta`

**Revisão pós-implementação (correções aplicadas):**
- `frameloop` agora destrava corretamente após gestos cancelarem uma animação de preset (zera `targetOrbitRef` + `setAnimating(false)` no `onStart` do Pan/Pinch)
- Gestos usam `.onFinalize()` em vez de `.onEnd()` para garantir reset de `interacting` mesmo em cancelamentos
- Pan e Pinch passaram a usar refs separadas (`panStartRef` / `pinchStartRef`) — eliminado o salto visual em gestos simultâneos
- Materiais customizados em `CarMesh.tsx` agora chamam `.dispose()` no unmount — sem leak de GPU ao voltar para a Home
- `AlertSheet` mantém o Modal montado por 280ms após o fechamento para que `SlideOutDown` + `FadeOut` toquem por completo (antes o Modal cortava a árvore antes da animação de saída)
- Polimento visual: corpo do veículo unificado na paleta Ford blue do capô, iluminação com `hemisphereLight` + fill light suave para legibilidade

---

## M6 — Mapa de Concessionárias & Agendamento

**Branch:** `feat/m6-map-scheduling`
**Objetivo:** Mapa com concessionárias Ford próximas e fluxo completo de agendamento incluindo "leva e traz".

### Entregas
- [x] `app/(tabs)/map.tsx` — `<MapView>` com `react-native-maps` (dark map style embarcado em `src/features/scheduling/mapStyle.ts`)
- [x] `src/services/mocks/dealersApi.ts` — 10 concessionárias mock (nome, endereço, lat/long, promoções, serviços, rating) com `fetchDealers()` ordenando por distância (haversine em `src/utils/distance.ts`) + `fetchAddressSuggestions()` para geocoding mockado
- [x] Pins customizados Ford com badge de promoção sensível ao plano (`src/features/scheduling/DealerPin.tsx`, memoizado)
- [x] Bottom sheet glass ao tocar pin: nome, endereço, distância, rating, promoções ativas, lista de serviços, CTA "Agendar" (`src/features/scheduling/DealerSheet.tsx` — Modal RN + Reanimated `SlideInDown/Out` no padrão do `AlertSheet` do M5)
- [x] `app/scheduling/_layout.tsx` — stack do fluxo de agendamento (`gestureEnabled: false`, animação `slide_from_right`)
  - [x] Passo 1: Seleção do serviço — revisão / troca de óleo / pneus / diagnóstico / outros
  - [x] Passo 2: Modalidade — presencial / **leva e traz** (badge "Premium" quando o plano permite VIP)
  - [x] Passo 3: Endereço de retirada com sugestões mockadas + debounce 300ms (apenas para modalidade "leva e traz" — pulado automaticamente quando "presencial")
  - [x] Passo 4: Data (FlatList horizontal de 10 dias) + slots disponíveis (`fetchAvailableSlots()` determinístico por dealer+data)
  - [x] Passo 5: Confirmação com resumo em Card + checkbox de termos + animação de sucesso (Reanimated `withSequence` no check)
- [x] `src/stores/useSchedulingStore.ts` — draft volátil + bookings persistidos em AsyncStorage; `startDraft(dealerId)` reseta cross-flow
- [x] `src/services/mocks/schedulingApi.ts` — `createBooking()` (delay 500–800ms, protocolo `FRD-XXXXXX`) + `fetchAvailableSlots()` (delay 250ms)
- [x] Histórico de agendamentos em Perfil (`src/features/scheduling/BookingListItem.tsx`) com cancelamento (Alert nativo + status "Cancelado")
- [x] Filtros no mapa em `MapFiltersBar`: "Todas", "Com promoção", "Até 10km", "Revisão", "Pneus", "Óleo"
- [x] Conexão com Home (M4) e detalhe 3D (M5) — CTA "Agendar serviço" agora navega para `/(tabs)/map`
- [x] `mapPadding` dinâmico via `useBottomTabBarHeight()` + `useSafeAreaInsets()` para que copyright nativo do mapa fique acima da tab bar e centro geográfico respeite header

**Status:** ✅ Concluído — commit `e8f6b4e` na branch `feat/m6-map-scheduling`
**Commit final:** `feat(scheduling): mapa de concessionárias e fluxo leva-e-traz (+ audit fixes)`

**Auditoria pós-implementação (Staff Review — 7 patches aplicados antes do commit):**
- 🔴 **C1**: race + leak no debounce de `address.tsx` — `cancelled` movido para a closure do `useEffect` para que o cleanup realmente dispare em re-execução/unmount
- 🟡 **W1**: `tracksViewChanges` virou one-shot via efeito timer (200ms) em `selectedId` — para de regenerar bitmap nativo continuamente enquanto pin está selecionado
- 🟡 **W2**: `DealerPin` envolto em `React.memo` (props primitivas)
- 🟡 **W3**: `setSubmitting(false)` movido do `finally` para o `catch` em `confirm.tsx` — evita warning de update em componente desmontado após `router.replace` no caminho feliz
- 🟡 **W4**: `mapPadding` memoizado com `useMemo([insets.top, tabBarHeight])` — estabiliza prop nativa do `MapView`
- 🟡 **W5**: `useSchedulingStore.hydrated` incluído no gate de boot do `app/_layout.tsx` — sem flash de empty state no Perfil
- 🟡 **W6**: `e.stopPropagation?.()` no `Marker.onPress` removido (era no-op)

---

## M7 — Carteira de Cashback

**Branch:** `feat/m7-cashback-wallet`
**Objetivo:** Módulo de fidelidade com saldo, extrato, cupons geolocalizados em combustível e manutenção.

### Entregas
- [x] `app/(tabs)/wallet.tsx` — Tela principal da carteira
- [x] Card de saldo com glassmorphism + animação numérica de contagem
- [x] Aba "Extrato" — lista de transações (entrada/saída) com filtro por tipo
- [x] Aba "Cupons" — grid de cupons disponíveis
- [x] `src/features/cashback/CouponCard.tsx` — visual ticket-style com perfuração
- [x] Cupons geolocalizados: badge "Próximo a você" usando mock distance
- [x] `app/wallet/coupon/[id].tsx` — detalhe do cupom + QR code mock
- [x] `src/services/mocks/walletApi.ts` — saldo, extrato, cupons
- [x] `src/stores/useWalletStore.ts`
- [x] CTA "Resgatar em combustível" → modal de seleção de posto (mock)
- [x] Animação celebrativa ao receber novo cashback

**Status:** ✅ Concluído — branch `feat/m7-cashback-wallet`
**Commit final:** `feat(wallet): carteira de cashback com cupons e extrato`

---

## M8 — Diferenciação Visual & Funcional por Plano SaaS

**Branch:** `feat/m8-plan-variants`
**Objetivo:** Aplicar variantes visuais e funcionais por plano (Agro / Urban / Premium) de forma harmônica em todas as telas, com features condicionais por plano.

### Entregas
- [x] `src/theme/plans.ts` — estendido com `tint`, `glow: {color, opacity, radius}` e `pressFeedback: 'sharp'|'soft'|'lift'`
- [x] `src/theme/ThemeProvider.tsx` — expõe `theme.plan.surface` (blend de `bgElevated` + `tint`) e `theme.plan.id`
- [x] `src/stores/useUserStore.ts` — método `updatePlan(plan)` persiste em AsyncStorage e sincroniza `usePlanStore` via `_layout.tsx`
- [x] `src/features/plan-gates/usePlanFeatures.ts` — hook com catálogo centralizado de features por plano (sem `if (plan === x)` espalhados)
- [x] `app/(tabs)/profile.tsx` — Card "Trocar plano" com 3 chips, confirmação nativa, feedback de loading
- [x] `src/features/plan-gates/PlanSwitchPulse.tsx` — flash overlay accent + haptic Medium na troca de plano; monta apenas durante o pulso
- [x] `src/features/plan-gates/PlanAccentHaze.tsx` — blob radial sutil com `tint` do plano, `pointerEvents="none"`, opt-in na Home
- [x] `src/components/Button.tsx` — animação de press por plano: Agro=sharp (scale 0.92, 60ms), Urban=soft (scale+opacity, 120ms), Premium=lift (translateY+glow, 140ms)
- [x] Acento aplicado em: botões primários, badges, hotspots 3D (halo idle), pins do mapa (borda selecionado + badge promo)
- [x] **Plano Agro**: alerta `terrain` em `alertsApi.ts` quando spread de PSI ≥ 2.5; ícone `trail-sign-outline` em `AlertCard`
- [x] **Plano Urban**: `SmartRouteCard` entre card de IA e KPIs na Home
- [x] **Plano Premium**: `OneTapSchedulingButton` (dealer mais próximo + próximo slot → confirm em 1 toque) e `VoiceCommandFab` com modal waveform Reanimated
- [x] `src/features/vehicle3d/CarMesh.tsx` — accent via `material.color.set()` + `invalidate()` em faixa do teto, strip traseiro e aros das rodas; body permanece azul Ford; sem leak de GPU
- [x] `src/features/vehicle3d/Hotspot.tsx` — halo externo em `theme.plan.accent` no estado idle (assinatura do plano sem colidir com warn/critical)
- [x] Contraste WCAG AA validado: Agro 8.4:1, Urban 14:1, Premium 16:1 vs `bgBase`
- [x] `app/(tabs)/map.web.tsx` + `metro.config.js` — stub de `react-native-maps` no web via Metro resolver; fallback de tela para web
- [x] Fix de navegação: `StepHeader` e `confirm.tsx` com `router.canGoBack()` fallback para `router.replace('/(tabs)/map')`
- [x] Fix de mapa: race `MapView.onPress` × `Marker.onPress` resolvido com guard `nativeEvent.action` + timestamp ref; `initialTracking` por 600ms após carregamento dos dealers

**Status:** ✅ Concluído — commit `a29ebe5` na `main` (squash do PR #7)
**Commit final:** `feat(plans): diferenciação visual e funcional Agro/Urban/Premium (+ audit fixes)`

**Auditoria pós-implementação (Staff Review — 4 patches aplicados antes do merge):**
- 🟡 **A1**: `accentMaterial.needsUpdate = true` removido de `CarMesh.tsx` — `color.set()` não exige recompile de shader GPU
- 🟡 **A2**: callback `withTiming` em `PlanSwitchPulse` verifica `finished` antes de `setPulsing(false)` — evita desmontagem prematura em troca rápida de plano
- 🟡 **A3**: `VoiceCommandFab` migrado para `useBottomTabBarHeight()` — eliminado double-count do safe area bottom inset em devices com notch
- 🟡 **A4**: aros das rodas (`Wheel`) passaram a receber `accentMaterial` compartilhado via prop — cobre spec original do M8

---

## M9 — Dashboard do Analista Ford (Backoffice)

**Branch:** `feat/m9-analyst-dashboard`
**Objetivo:** Área restrita do analista/concessionária com visão de "Service Share" e leads qualificados (mock).

### Entregas
- [x] `app/(analyst)/_layout.tsx` — stack com role-gate duplo: role errado → tabs; não autenticado → login
- [x] Login mock com toggle "Sou analista Ford" (Pressable com ícone shield + anel ford-blue quando ativo)
- [x] `app/(analyst)/dashboard.tsx`:
  - [x] KPIs topo: VIN Share, leads ativos, agendamentos do mês, taxa de conversão
  - [x] Gráfico de barras custom (Views + Reanimated, zero deps novas) com pesos por plano
  - [x] Lista de leads qualificados pela "IA" (mock) com score, ordenados por `aiScore` desc
  - [x] Filtros: período (7d/30d/90d) e plano (Todos/Agro/Urban/Premium)
- [x] `app/(analyst)/leads/[id].tsx` — detalhe do lead: AI score ring, contato, timeline, ações mock
- [x] `src/services/mocks/analystApi.ts` — 12 leads, séries temporais por período×plano, KPIs com jitter ±3%
- [x] `src/stores/useAnalystStore.ts` — Zustand sem persistência; seletores individuais; race-condition guard (`_seq`)
- [x] Tema visual "data-dense" corporate — Cards sólidos, accent fordBlueLight fixo, tipografia uppercase densa
- [x] `app/index.tsx` — tela neutra de índice para evitar flash de tabs em cold start de analista
- [x] `src/services/mocks/authApi.ts` — `AuthUser` estendido com `role: 'client' | 'analyst'`
- [x] `src/hooks/useProtectedRoute.ts` — branch por role; cliente não-em-tabs redirecionado sem flash

**Status:** ✅ Concluído — branch `feat/m9-analyst-dashboard`
**Commit final:** `feat(analyst): dashboard interno com KPIs e leads qualificados (+ audit fixes)`

**Auditoria pós-implementação (Staff Review — 5 patches aplicados antes do commit):**
- 🔴 **C1**: race condition em `fetchDashboard` — contador externo `_seq` descarta respostas obsoletas
- 🔴 **C2**: gate do `(analyst)/_layout` não bloqueava `user === null` — corrigido para `!user || role !== 'analyst'`
- 🟡 **W1**: `AnimatedBar` não cancelava `withTiming` no unmount — adicionado `cancelAnimation(height)` no cleanup
- 🟡 **W2**: `BarChart` sem `React.memo` + `useAnalystStore()` sem seletores — envolvido em `memo()` e seletores individuais no dashboard
- 🟡 **W3**: flash de 1–2 frames de tabs de cliente em cold start de analista — adicionado `app/index.tsx` neutro como rota inicial; `useProtectedRoute` atualizado para cobrir `!inTabsGroup`

---

## M10 — Polimento, Acessibilidade & QA

**Branch:** `feat/m10-polish-qa`
**Objetivo:** Hardening final pré-EAS. Performance (lazy loading), resiliência (skeleton/empty/error padronizados + ErrorBoundary), acessibilidade (labels, font scaling com clamp), haptics em ações críticas, assets Ford-blue placeholder.

### Entregas
- [x] Lazy load `Scene` 3D (`@react-three/fiber/native` + three.js) via `React.lazy + Suspense` em `app/vehicle/[id].tsx`, fallback `Vehicle3DSkeleton`
- [x] Lazy load `MapCanvas` (`react-native-maps` via `forwardRef`) em `app/(tabs)/map.tsx`, fallback `MapSkeleton` (grid + 3 pins)
- [x] Lazy load `BarChart` (Reanimated heavy) em `app/(analyst)/dashboard.tsx`, fallback `SkeletonBlock`
- [x] Pacote `src/components/state/`: `Skeleton` (Block/Line/Circle/Group + shimmer), `EmptyState`, `ErrorState` — unifica padrões antes ad-hoc
- [x] `RootErrorBoundary` (class component custom, zero nova dep) embrulhando `RootNavigator` em `app/_layout.tsx`; reset via key incrementada
- [x] `useWalletStore` ganha `error` flag; wallet.tsx renderiza tip critical no card de saldo quando fetch falha; analyst dashboard renderiza `ErrorState` quando `error && !kpis`
- [x] `<Text>` com `allowFontScaling=true` default e `maxFontSizeMultiplier` por variante (h1=1.3, h2=1.35, h3=1.4 para preservar glass cards/KPIs; body/label/caption=1.6)
- [x] `Button` `hitSlop` 4→8, `accessibilityLabel` default = `label`; `Icon` com flag decorativa por padrão (`accessibilityElementsHidden`); `Input` com `accessibilityHint` + `aria-invalid`
- [x] `BookingListItem` `accessibilityLabel` composto com protocol+status
- [x] `src/utils/haptics.ts` wrapper fire-and-forget; aplicado em booking success, cancel, hotspot 3D, redeem cupom, pull-to-refresh Home, lead actions, e novo alerta crítico (warning) em `useAlertsStore`
- [x] `scripts/generate-icons.js` (pngjs transitiva, sem nova dep): icon 1024², splash 200², favicon 48², adaptive 432² em Ford-blue + monograma "F"
- [x] `app.json` ganha `runtimeVersion.policy="appVersion"` (prepara EAS Update do M11)
- [x] Remoção de `moti` (instalado mas não usado) + placeholders `react-logo*.png`
- [x] `README.md` reescrito para handover M11: stack atualizada, smoke test em 12 itens, troubleshooting (Reanimated worklets, Metro web stub, fontes, splash, regen ícones), personas, roadmap

**Status:** ✅ Concluído — branch `feat/m10-polish-qa` (8 commits temáticos + 1 audit fix)

**Ordem de commits:**
1. `chore(m10): remove moti unused dep + react-logo placeholders`
2. `feat(m10/state): unified Skeleton, EmptyState, ErrorState`
3. `feat(m10/perf): lazy load Scene 3D, MapCanvas e BarChart`
4. `feat(m10/safety): RootErrorBoundary + render error states`
5. `feat(m10/a11y): labels, roles, font scaling com clamp`
6. `feat(m10/haptics): feedback tatil em acoes criticas`
7. `chore(m10/assets): icone e splash Ford-blue + runtimeVersion`
8. `docs(m10): README handover + PLAN.md marca M10 concluido`
9. `chore(m10): audit fixes (zustand purity, shared shimmer driver, prod error logs)`

**Auditoria pós-implementação (Staff Review — 3 patches aplicados antes do merge):**
- 🔴 **A1**: `haptic.warning()` disparava dentro de `syncFromEvaluation` (action Zustand) — quebrava pureza do reducer e podia vibrar duplo em Strict Mode/concurrent rendering. Movido para `src/stores/criticalAlertHapticListener.ts` (subscribe singleton fora da árvore React), instanciado uma vez em `app/_layout.tsx`. Bootstrap guard evita falso positivo na primeira sync após hidratação.
- 🟡 **A2**: `Skeleton` criava 1 `useSharedValue + withRepeat` por instância — N skeletons = N worklets infinitos rodando na UI thread, com risco de jank em listas grandes em devices low-end. Refatorado para **shared driver**: `getShimmerDriver()` retorna 1 `SharedValue` singleton via `makeMutable`, todos os skeletons leem o mesmo driver e pulsam em sincronia. `useEffect`/`cancelAnimation` removidos (driver nunca é cancelado, vive enquanto o app vive).
- 🔴 **A3**: `RootErrorBoundary.componentDidCatch` só logava em `__DEV__` — builds EAS de preview ficariam com crashes silenciosos. Removido o guard, `console.error` agora roda também em prod (preparando integração com Sentry no M11). Adicionado comentário de invariante em `MapCanvas.tsx` declarando que call sites do `mapRef` devem usar optional chaining (gap de 1 frame entre Suspense fallback e chunk resolve).

---

## M11 — "Deploy" (EAS Build de Preview)

**Branch:** `chore/m11-eas-deploy`
**Objetivo:** Gerar builds de preview iOS/Android via EAS para distribuição interna.

### Entregas
- [ ] Instalar `eas-cli` e autenticar (`eas login`)
- [ ] `eas init` — vincular projeto
- [ ] `eas.json` com perfis: `development`, `preview`, `production`
- [ ] Configurar `app.json`: bundleIdentifier iOS, package Android, versionCode
- [ ] `eas build --profile preview --platform all` (ou `--platform android` se sem conta Apple)
- [ ] Upload de QR code do build no `README.md`
- [ ] Configurar EAS Update para OTA (`eas update --branch preview`)
- [ ] Documentar processo de smoke test pós-build em `docs/RELEASE.md`
- [ ] Merge final `develop → main` com tag `v1.0.0-preview`

**Commit final:** `chore(release): eas build preview e tag v1.0.0-preview`

---

## Resumo Executivo

| # | Milestone | Branch | Foco |
|---|---|---|---|
| M0 | Setup | `chore/m0-setup` | Bootstrap |
| M1 | Design System | `feat/m1-design-system` | Tema + componentes |
| M2 | Navegação & Auth | `feat/m2-navigation-auth` | Expo Router + auth mock |
| M3 | Onboarding | `feat/m3-onboarding` | Wizard de perfilamento |
| M4 | Telemetria & Home | `feat/m4-telemetry-home` | Simulação IoT + alertas |
| M5 | 3D do Veículo | `feat/m5-vehicle-3d` | Three.js + hotspots |
| M6 | Mapa & Agendamento | `feat/m6-map-scheduling` | Concessionárias + leva-traz |
| M7 | Carteira | `feat/m7-cashback-wallet` | Cashback + cupons |
| M8 | Planos SaaS | `feat/m8-plan-variants` | Agro/Urban/Premium |
| M9 | Analista | `feat/m9-analyst-dashboard` | Backoffice mock |
| M10 | Polimento | `feat/m10-polish-qa` | A11y + perf + haptics + lazy |
| M11 | Deploy | `chore/m11-eas-deploy` | EAS preview build |

Cada milestone deve ser **testado em device/emulador** antes do merge. Não avançar sem que a entrega anterior esteja funcional.
