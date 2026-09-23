import { createApp } from './app';
import { buildDeps } from './bootstrap';

// Entrada da Vercel (detecção zero-config do Hono): o export default é o app.
const app = createApp(buildDeps());

export default app;
