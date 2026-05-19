# PROJECT ARCHITECTURE: Ford Intelligence

## 1. CONTEXT & PROBLEM

A Ford enfrenta o desafio de reter clientes no serviço de pós-venda da rede oficial, o que impacta diretamente o indicador de VIN Share. Os clientes frequentemente abandonam as concessionárias oficiais após as primeiras revisões em busca de alternativas mais baratas ou por falta de conveniência. Além disso, os proprietários esquecem os prazos de manutenção, e a Ford carece de um contato proativo e personalizado que se antecipe ao problema mecânico gerando valor real para o usuário.

## 2. PROPOSED SOLUTION

Um aplicativo mobile multiplataforma (iOS e Android) focado na jornada do cliente Ford, oferecendo uma interface de Fidelidade Inteligente segmentada em três modalidades de uso (Agro, Urban e Premium). O sistema coletará dados no momento do onboarding (compra do veículo) e utilizará IA preditiva para antecipar as necessidades de revisão.

#DIFERENCIAIS
Ao invés de uma abordagem reativa, a inteligência artificial do app avisa o cliente sobre a revisão antes do limite (ex: aos 9.000 km ao invés de 10.000 km). O aplicativo oferecerá um serviço de agendamento inteligente com opção de "leva e traz" (busca do veículo na casa do cliente), garantindo máxima praticidade e confiança na marca. O engajamento financeiro será estimulado por uma carteira de cashback em combustível e descontos geolocalizados.

## 3. AGENT BOUNDARIES (STRICT SCOPE)

**ATENÇÃO, CLAUDE CODE:** Seu escopo de atuação neste projeto é ESTRITAMENTE Frontend Mobile (React Native / Expo) e simulação de consumo de APIs.
- NÃO crie infraestrutura de Backend (Node, Python, Supabase schemas, etc.).
- NÃO desenvolva algoritmos de Machine Learning.
- NÃO configure fluxos no n8n.
- Foque APENAS em criar os componentes visuais, gerenciar o estado e consumir endpoints RESTful ou mocks assíncronos (IoT).

## 4. FUNCTIONAL REQUIREMENTS

# FEATURES SELECIONADAS

Onboarding e Perfilamento | Motor de IA Preditivo | Agendamento Inteligente "Leva e Traz"

Planos SaaS (Agro, Urban, Premium) | Mapa de Concessionárias | Carteira de Cashback

Segurança e Autenticação Forte | Dashboard Interno (Analista Ford) | Simulação de Telemetria (IoT) | Visualização 3D do Veículo

# DETALHAMENTO DAS FEATURES:

- Onboarding e Perfilamento: Formulário inicial no momento da compra coletando dados do modelo do carro e estilo de uso. Estes dados alimentarão a IA (Base 2) para classificar o perfil de risco do cliente sem utilizar dados futuros (evitando data leakage).

- Simulação de Telemetria (IoT): O app consumirá um serviço assíncrono (Mock/API) simulando dados em tempo real da porta OBD2 do veículo (hodômetro, pressão dos pneus, temperatura) para engatilhar os alertas visuais de manutenção.

- Visualização 3D do Veículo: O aplicativo renderizará um modelo 3D interativo do carro na tela principal para que o usuário veja visualmente onde estão os alertas ou os desgastes detectados.

# Planos de Assinatura (SaaS):

- Plano Agro: Foco em veículos pesados. Alertas de previsão de desgaste em estradas de terra e recomendações para ambientes extremos.

- Plano Urban: Foco em economia e conforto. Alertas de manutenção leve e integração com rotas inteligentes.

- Plano Premium: Automação de processos avançada, experiência VIP, comandos de voz e agendamentos automatizados.

- Motor de IA Preditivo: Sistema que simula cenários e emite alertas antecipados de manutenção.

- Agendamento Inteligente e Mapas: Interface com mapeamento de concessionárias Ford próximas exibindo promoções. Opção de agendamento presencial ou serviço de retirada/devolução na residência. Fluxos de automação construídos no n8n podem orquestrar o envio das ordens de serviço para a concessionária.

- Carteira de Benefícios: Módulo de fidelidade gerenciando cashback de combustível e cupons de desconto em manutenção

## 5. USER PERSONAS

Proprietário de Veículo Ford (Cliente Final): Usuário do app mobile. Cadastra seu perfil de uso, recebe alertas proativos e agenda serviços com foco na conveniência. Sua interface se adapta sutilmente de acordo com o plano contratado (Agro, Urban, Premium).

Analista Ford / Concessionária (Backoffice): Acessa relatórios e dashboards interativos para visualizar o "Service Share". Utiliza o sistema para receber os leads qualificados gerados pela IA.

## 6. TECHNICAL STACK

- Claude Code

Frontend Mobile: React Native | Expo | Expo Router | Bibliotecas de Mapas | Three.js | Zustand (Gestão de Estado Global)

Backend & Integrações: APIs RESTful/SOAP | Web Services SOA | Fluxos n8n (para automação do agendamento)

Banco de Dados: Supabase/PostgreSQL (com controle de migrações)

Cybersecurity: JWT/OAuth2 | TLS 1.2+ | RBAC | Sanitização de inputs | Rate Limiting

Inteligência Artificial: Python | Jupyter Notebooks | Scikit-learn (Machine Learning)

## 7. DESIGN LANGUAGE

Identidade Visual da Ford: O aplicativo terá cores, tipografia e elementos visuais que representem fielmente o estilo e a experiência de marca da Ford.

Padrões de UI/UX Modernos: Implementação de um design nativo em "dark mode", utilizando interfaces touch-first intuitivas. Adoção da estética "glassmorphism" em painéis de alerta, cards da carteira de cashback e sobreposições do mapa.

Diferenciação Sutil de Interface: Mudanças harmônicas de paleta ou ícones para transitar fluidamente entre os planos Agro (visual mais rústico/resistente), Urban (limpo/prático) e Premium (luxuoso/exclusivo).

## 8. PROCESS

- Break app build into logical milestones (steps)
- Each milestone should be a deliverable increment
- Prioritize core functionality first, then iterate
- Test each milestone before moving to the next
