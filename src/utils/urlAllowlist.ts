// Client-side origin allowlist — CORS analogue for React Native.
// Any outbound URL must match before fetch is dispatched.
const ALLOWED_ORIGINS = [
  'ford-intelligence.vercel.app',
  'api.ford-intelligence.com',
  'localhost',
  '127.0.0.1',
];

export function assertUrlAllowed(url: string): void {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error('URL inválida.');
  }
  const allowed = ALLOWED_ORIGINS.some(
    (origin) => hostname === origin || hostname.endsWith(`.${origin}`),
  );
  if (!allowed) {
    throw new Error(`Domínio não autorizado: ${hostname}`);
  }
}
