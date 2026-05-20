import { signPayload } from '@/utils/hmac';

export type UserRole = 'client' | 'analyst' | 'admin';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
  isAnalyst?: boolean;
};

export type SignupPayload = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

const delay = (min = 400, max = 700) =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min),
  );

const MOCK_SECRET = 'ford-intelligence-mock-secret-v1';
const TOKEN_EXPIRY_SECS = 3600;

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function makeToken(userId: string, role: UserRole): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_EXPIRY_SECS;
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ sub: userId, role, iat, exp }));
  const sig = b64url(await signPayload(`${header}.${payload}`, MOCK_SECRET));
  return `${header}.${payload}.${sig}`;
}

const deriveNameFromEmail = (email: string) => {
  const local = email.split('@')[0] ?? 'Motorista';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  await delay();
  if (!payload.email || !payload.password) {
    throw new Error('Credenciais inválidas.');
  }
  const user: AuthUser = {
    id: `usr_${payload.email}`,
    name: deriveNameFromEmail(payload.email),
    email: payload.email,
    role: payload.isAnalyst ? 'analyst' : 'client',
  };
  return { token: await makeToken(user.id, user.role), user };
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  await delay(500, 800);
  const user: AuthUser = {
    id: `usr_${payload.email}`,
    name: payload.name,
    email: payload.email,
    role: 'client',
  };
  return { token: await makeToken(user.id, user.role), user };
}

export async function requestPasswordReset(
  payload: ForgotPasswordPayload,
): Promise<{ ok: true; sentTo: string }> {
  await delay(300, 600);
  return { ok: true, sentTo: payload.email };
}
