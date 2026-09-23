# syntax=docker/dockerfile:1
# Imagem para rodar a API fora da Vercel (homologação, on-premise ou cloud).
# Boas práticas: multi-stage, base mínima com versão fixa, usuário não-root,
# só dependências de produção e nenhum segredo em camadas (tudo via variável de ambiente).

FROM node:22-alpine3.22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev --ignore-scripts

FROM node:22-alpine3.22 AS runtime
ENV NODE_ENV=production PORT=3333
WORKDIR /app
# Atualiza pacotes do SO e remove npm, npx, corepack e yarn da imagem final:
# em produção só o node é necessário, e cada ferramenta a menos é superfície a menos.
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn-* \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3333/v1/health || exit 1
CMD ["node", "dist/server.js"]
