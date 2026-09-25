import type { Hono } from 'hono';
import { createApp } from './app.js';
import { buildDeps } from './bootstrap.js';
import type { AppEnv } from './context.js';

// Entrada da Vercel (detecção zero-config do Hono): o builder só aceita como entrada
// um arquivo que importe 'hono' e exporte o app como default.
const app: Hono<AppEnv> = createApp(buildDeps());

export default app;
