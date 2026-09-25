import { serve } from '@hono/node-server';
import app from './index.js';

// Servidor local para desenvolvimento (`npm run dev`). Na Vercel, quem sobe é o src/index.ts.
const port = Number(process.env.PORT ?? 3333);
serve({ fetch: app.fetch, port }, (info) => {
  process.stdout.write(`Ford Intelligence API em http://localhost:${info.port} — docs em /docs\n`);
});
