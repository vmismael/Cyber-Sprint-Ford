# Ford Intelligence

App mobile multiplataforma (iOS/Android) de fidelização do pós-venda Ford — frontend em React Native + Expo, com IA preditiva de manutenção (mock), telemetria IoT simulada (OBD2), visualização 3D do veículo, agendamento "leva e traz" e carteira de cashback. Segmentado em três planos SaaS: **Agro**, **Urban** e **Premium**.

> Escopo do repositório: **Frontend Mobile only**. Backend, ML e n8n estão fora do escopo — interfaces são mockadas localmente.

---

## Stack

- **React Native + Expo** (managed workflow, SDK 54)
- **Expo Router** (file-based routing) com lazy loading via `React.lazy + Suspense` em cenas pesadas
- **TypeScript** strict
- **Zustand** (estado global, com hidratação em `app/_layout.tsx`)
- **three.js** + `@react-three/fiber/native` + `expo-gl` (visualização 3D do veículo)
- `react-native-maps` (mapa de concessionárias, com web stub via Metro resolver)
- `react-native-reanimated`, `expo-blur`, `expo-haptics`
- `react-hook-form` + `zod` (formulários e validação)

## Pré-requisitos

- **Node.js 20+** (testado em 24.x)
- **npm 10+**
- **Expo Go** (iOS/Android) ou simulador/emulador
- macOS + Xcode (para iOS) ou Android Studio (para Android)

## Quickstart

```bash
git clone https://github.com/vmismael/Cyber-Sprint-Ford.git
cd Cyber-Sprint-Ford
npm install
npm run start          # abre Metro; escolha a plataforma no terminal
```

Não há `.env` necessário: todos os "endpoints" são mocks locais em `src/services/mocks/`.

## Scripts

| Script | Descrição |
|---|---|
| `npm run start` | Inicia o Expo dev server (Metro) |
| `npm run android` | Build dev + abre Android |
| `npm run ios` | Build dev + abre iOS (macOS) |
| `npm run web` | Versão web (debug rápido; mapa usa stub) |
| `npm run lint` | ESLint (`expo lint`) |
| `npm run format` | Prettier write |
| `npm run typecheck` | `tsc --noEmit` |

## Estrutura

```
app/         # rotas Expo Router (file-based: (auth), (tabs), (analyst), scheduling/, vehicle/, wallet/)
src/
  components/    # UI compartilhada (Button, Card, GlassPanel, Skeleton, EmptyState, ErrorState, RootErrorBoundary…)
  features/      # módulos por domínio (telemetry, vehicle3d, scheduling, cashback, plan-gates, analyst-dashboard)
  stores/        # Zustand stores (auth, user, plan, vehicle, alerts, scheduling, wallet, analyst)
  services/      # api/mocks (delays 200–800ms, sem network real)
  hooks/         # useProtectedRoute (role-gate cliente vs analyst)
  theme/         # tokens, plans (Agro/Urban/Premium), typography, ThemeProvider
  utils/         # sanitize, safeError, logger, rbac, hmac, anonymize, haptics, distance, date
assets/      # fonts, imagens (icon, splash, adaptive)
docs/        # PRD.md, CYBERSECURITY-PLAN.md, CYBERSECURITY.md, CYBERSECURITY-JUSTIFICATIVAS.md
```

## Personas e como alternar

- **Cliente Final**: fluxo padrão (login → onboarding → tabs Home/Mapa/Carteira/Perfil). Plano (Agro/Urban/Premium) é trocável em **Perfil → Trocar plano**, alterando acentos visuais e features condicionais (ex.: `OneTapSchedulingButton` e `VoiceCommandFab` em Premium).
- **Analista Ford**: na tela de login, ative o toggle **"Sou analista Ford"** antes de entrar. Direciona para `(analyst)/dashboard` com KPIs, gráfico e leads qualificados.

## Smoke test pós-build (12 itens)

| # | Cenário | Esperado |
|---|---|---|
| 1 | `npm run start` em projeto limpo | Splash Ford-blue → Home com Inter carregada |
| 2 | Cold start na Home | Telemetria começa em ≤ 2s; primeiro KPI aparece |
| 3 | Tab Mapa (primeiro acesso) | `MapSkeleton` rápido → `MapView` com 10 pins; promo badges visíveis |
| 4 | Tocar pin → Agendar | Bottom sheet glass → fluxo 5 steps → `success.tsx` com haptic Success |
| 5 | Cancelar agendamento (Perfil) | Alert nativo → status "Cancelado" + haptic Medium |
| 6 | Tab Carteira | Saldo animado, extrato com transações, cupons grid |
| 7 | Resgatar cupom | `FuelStationModal` → posto selecionado → haptic Success no confirm |
| 8 | Detalhe 3D do veículo | `Vehicle3DSkeleton` → cena 3D com hotspots; tocar hotspot dispara `selection` haptic |
| 9 | Trocar plano (Perfil) | `PlanSwitchPulse` flash → acentos atualizam em todas as telas |
| 10 | Login analyst | Toggle ativo → dashboard com KPIs + barras animadas |
| 11 | Filtros analyst | Trocar período/plano → `BarChart` reanima sem race |
| 12 | Font scaling 200% | KPIs e headings respeitam clamp; glass cards não estouram |

## Troubleshooting

**Reanimated worklets falhando**: SDK 54 usa Reanimated 4 com `react-native-worklets@0.5.x` (já configurado). Não é necessário `babel.config.js` para o plugin antigo. Se erros do tipo "worklet not found" aparecerem, rode `npm run start -- --clear`.

**Mapa em branco no web**: `react-native-maps` é nativo. Web usa stub via Metro resolver (`metro.config.js`) e a tela de fallback `app/(tabs)/map.web.tsx`. Comportamento esperado.

**Fontes não carregam (Inter)**: a app espera `fontsLoaded || fontError` antes de renderizar. Se travar, verifique conexão (Google Fonts é baixado em runtime via `@expo-google-fonts/inter`).

**Splash travado em produção**: `expo-splash-screen` é escondido em efeito após `ready` (`fontsLoaded && hydrated`). Em ambientes lentos, esperar até 3s antes de assumir bug.

**Trocar entre cliente e analyst**: o role-gate em `useProtectedRoute.ts` é estrito; analyst não acessa `(tabs)`. Faça logout (`Perfil → Sair`) antes de alternar.

**Regenerar ícones placeholder**: `node scripts/generate-icons.js` (sem deps externas — usa `pngjs` transitiva).

## Documentação

- PRD do produto → [docs/PRD.md](./docs/PRD.md)
- Sprint de segurança → [docs/CYBERSECURITY-PLAN.md](./docs/CYBERSECURITY-PLAN.md)

## Roadmap

| # | Milestone | Status |
|---|---|---|
| M0–M9 | Setup → Analyst dashboard | ✅ Concluído |
| **M10** | **Polimento, A11y, Performance, Haptics, Assets** | ✅ Concluído |
| M11 | EAS Build de preview + EAS Update | ⏳ Pendente |
