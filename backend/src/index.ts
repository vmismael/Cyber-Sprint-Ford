import type { Hono } from 'hono';
import { createApp } from './app';
import { buildDeps } from './bootstrap';
import type { AppEnv } from './context';

// Entrada da Vercel (detecção zero-config do Hono): o builder só aceita como entrada
// um arquivo que importe 'hono' e exporte o app como default.
const app: Hono<AppEnv> = createApp(buildDeps());

export default app;
