// Client-side origin allowlist — CORS analogue for React Native.
// Any outbound URL must match before fetch is dispatched.
const ALLOWED_ORIGINS = [
  'ford-intelligence.vercel.app',
  'api.ford-intelligence.com',
  'localhost',
  '127.0.0.1',
  '10.0.2.2', // localhost visto de dentro do emulador Android
];

// Host da API definido no build (EXPO_PUBLIC_API_URL). Valor fixo no momento do build, não vem do usuário.
const API_HOST = (() => {
  try {
    return new URL(process.env.EXPO_PUBLIC_API_URL ?? '').hostname;
  } catch {
    return '';
  }
})();
if (API_HOST) ALLOWED_ORIGINS.push(API_HOST);

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
