# Justificativas Formais — Requisitos Não Implementados

## Sprint Cybersecurity — Ford Intelligence Mobile App

Este documento registra formalmente os requisitos da rubrica que **não foram implementados como código no cliente mobile**, com justificativa técnica objetiva para cada caso. A decisão não é de omissão, mas de adequação ao contexto arquitetural do projeto, que opera exclusivamente como frontend mobile com APIs mockadas.

---

## 1. HTTPS / TLS 1.2+

**Requisito da rubrica:** Criptografia ponta a ponta entre app, API e serviços externos. Uso obrigatório de HTTPS/TLS 1.2+.

**Status:** N/A por arquitetura — atendido por design do SO.

**Justificativa:**

O protocolo TLS opera na camada de transporte (camada 4 do modelo OSI) e é gerenciado exclusivamente pelo sistema operacional do dispositivo e pelo servidor de destino. Em aplicativos React Native com Expo, a stack de rede nativa do Android (via `OkHttp`) e do iOS (via `NSURLSession`) aplica automaticamente TLS com base nas políticas do SO — ambas as plataformas exigem TLS 1.2 como mínimo por padrão desde Android 5.0 e iOS 9.

Não existe API no React Native, nem no Expo SDK, que permita ao cliente configurar, forçar ou alterar o protocolo TLS utilizado. Qualquer código inserido com esse propósito seria decorativo, sem efeito funcional.

**O que compete ao cliente foi feito:** a variável de ambiente `EXPO_PUBLIC_API_BASE_URL` exige esquema `https://` e o app emite aviso em modo de desenvolvimento caso detecte URL de base com esquema `http://`.

**Sobre certificate pinning:** embora tecnicamente viável via bibliotecas como `react-native-ssl-pinning`, foi avaliado e descartado neste contexto por dois motivos: (a) o projeto opera com mocks locais, sem servidor real cujos certificados pudessem ser fixados; (b) pinning sem rotação adequada em produção é fonte conhecida de incidentes — *app brick* quando o certificado expira ou é renovado. A decisão é coerente com o escopo de simulação.

---

## 2. Rate Limiting e Throttling

**Requisito da rubrica:** Evitar abuso, scraping excessivo e ataques DoS.

**Status:** N/A por arquitetura — controle server-side; substituto client-side implementado para força bruta em login.

**Justificativa:**

Rate limiting é, por definição, um controle server-side. Sua função é limitar a quantidade de requisições que um cliente pode fazer a um servidor em um intervalo de tempo, protegendo a infraestrutura e os dados de back-end contra abuso.

Implementar rate limiting no cliente mobile não oferece proteção real porque:

1. O código do cliente pode ser inspecionado, modificado ou completamente ignorado por um atacante. Quem queira abusar de uma API o fará diretamente, sem passar pelo app.
2. Em um ambiente com API mockada (sem servidor real), não há recurso a ser protegido contra sobrecarga.
3. Um *rate limiter* client-side que rejeita requisições localmente não impede que o servidor receba requisições de outras origens.

**O que compete ao cliente foi feito:** lockout local na tela de login — após 5 tentativas falhas consecutivas, o app bloqueia a interface por 60 segundos. A escolha desses valores segue a recomendação **OWASP MASVS-AUTH-2** para mitigação de força bruta em interfaces de autenticação móvel, balanceando segurança e UX (um usuário legítimo raramente erra a senha 5 vezes seguidas). Trata-se de uma medida de defesa contra ataques manuais via interface, não de um substituto para rate limiting real no backend.

**Referência no código:** lógica de lockout no hook/serviço de autenticação do fluxo de login.

---

## 3. CORS (Cross-Origin Resource Sharing)

**Requisito da rubrica:** CORS configurado corretamente; permitir apenas domínios autorizados.

**Status:** N/A por arquitetura — mecanismo não aplicável a apps nativos.

**Justificativa:**

CORS é um mecanismo de segurança do navegador (browser) que restringe requisições HTTP feitas por scripts de uma origem a recursos de outra origem. É implementado e configurado exclusivamente no servidor, via cabeçalhos como `Access-Control-Allow-Origin`.

React Native não é um browser. Aplicativos nativos não possuem o conceito de "origem" (*scheme + host + port*) e não estão sujeitos à *Same-Origin Policy*. O runtime JavaScript do React Native (Hermes ou JSCore) não implementa SOP, portanto CORS não é um vetor de ataque relevante e não há como configurá-lo no cliente.

A configuração de CORS é responsabilidade do backend da API, fora do escopo deste projeto.

---

## 4. Política de Retenção e Descarte Seguro de Dados (servidor)

**Requisito da rubrica:** Dados antigos devem ser removidos ou anonimizados; política de retenção definida.

**Status:** Atendido por design na parte aplicável ao cliente; política de servidor fora de escopo.

**Justificativa:**

Políticas de retenção de dados são definidas por requisitos legais (LGPD, GDPR) e de negócio, e aplicadas no lado do servidor — banco de dados, pipelines de ETL, jobs de limpeza agendados. Definir quanto tempo um servidor retém dados de clientes não é uma decisão técnica de front-end.

**O que compete ao cliente mobile foi implementado:**

- **Logout:** apaga todos os dados locais sensíveis do dispositivo — token de autenticação, perfil do usuário, histórico de agendamentos e estado da carteira (`AsyncStorage` e Secure Store são limpos integralmente).
- **Desinstalação:** o próprio sistema operacional remove o sandbox completo do app (incluindo Keychain/Keystore entries associadas ao bundle ID), garantindo descarte físico dos dados.
- **Não persistência de dados sensíveis fora da sessão:** nenhum dado de PII permanece acessível após o encerramento de sessão.

A política de retenção no servidor pressupõe a existência de um backend, explicitamente fora do escopo do projeto.

---

## 5. Anonimização / Pseudonimização para Modelos de ML

**Requisito da rubrica:** Anonimização de dados pessoais especialmente para modelos de ML e dashboards.

**Status:** N/A por arquitetura para o pipeline de ML; **implementado** para dashboards.

**Justificativa:**

O contexto de ML refere-se ao pipeline de treinamento e inferência em Python com Scikit-learn, componente **explicitamente fora do escopo** deste projeto, que cobre apenas Frontend Mobile + simulação de APIs/telemetria.

O único dado derivado de ML presente no app é o `riskScore`, calculado localmente a partir de `monthlyKm` e `usageStyle` (ambos não-PII). Esse campo não contém dados pessoais e não há o que anonimizar — a arquitetura previne o problema por design.

**A parte do requisito que menciona dashboards foi implementada:** o componente `LeadCard` no dashboard do analista aplica `maskName()` e `maskEmail()` nos dados exibidos, substituindo informações identificáveis por versões pseudonimizadas:

- `João Silva` → `J*** S***`
- `joao@gmail.com` → `j***@g***.com`

A pseudonimização é aplicada na camada de apresentação, garantindo que o analista só visualize dados completos quando houver ação contextual justificada (ex.: abrir o detalhe do lead com permissão adequada).

**Referência no código:** componente `LeadCard` e utilitários `maskName()` / `maskEmail()`.

---

## Resumo

| Requisito | Status | Implementação client-side |
|---|---|---|
| HTTPS/TLS 1.2+ | N/A — gerenciado pelo SO | Validação de esquema `https://` em env vars |
| Rate Limiting | N/A — server-side | Lockout local (5 tentativas / 60s) — OWASP MASVS-AUTH-2 |
| CORS | N/A — não aplicável a apps nativos | — |
| Retenção de dados (servidor) | Fora de escopo | Limpeza completa no logout + descarte pelo SO na desinstalação |
| Anonimização para ML | N/A — ML fora de escopo | Pseudonimização aplicada em dashboards via `maskName()`/`maskEmail()` |

Todas as decisões seguem as práticas recomendadas pela OWASP Mobile Application Security Verification Standard (MASVS) e são coerentes com o escopo do projeto (Frontend Mobile + simulação de APIs/telemetria).
