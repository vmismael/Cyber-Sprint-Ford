import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { PASSWORD, TEST_ENV, setup } from './helpers.js';

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('Cadastro', () => {
  it('201 — cria sempre como client e devolve par de tokens', async () => {
    const { call } = setup();
    const res = await call('/v1/auth/register', {
      method: 'POST',
      json: { name: 'Maria Souza', email: 'Maria@Exemplo.com', password: PASSWORD },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user).toMatchObject({ email: 'maria@exemplo.com', role: 'client' });
    expect(body.tokenType).toBe('Bearer');
    expect(body.refreshToken).toBeTypeOf('string');
  });

  it('422 — mass assignment: enviar "role": "admin" é rejeitado', async () => {
    const { call } = setup();
    const res = await call('/v1/auth/register', {
      method: 'POST',
      json: { name: 'Mallory', email: 'm@exemplo.com', password: PASSWORD, role: 'admin' },
    });
    expect(res.status).toBe(422);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
  });

  it('422 — senha fraca e e-mail inválido, sem refletir os valores enviados', async () => {
    const { call } = setup();
    const res = await call('/v1/auth/register', {
      method: 'POST',
      json: { name: 'Ana', email: 'nao-e-email<script>', password: '123' },
    });
    expect(res.status).toBe(422);
    const text = await res.text();
    expect(text).not.toContain('<script>');
  });

  it('409 — e-mail já cadastrado', async () => {
    const { call } = setup();
    const json = { name: 'Maria Souza', email: 'maria@exemplo.com', password: PASSWORD };
    await call('/v1/auth/register', { method: 'POST', json });
    const res = await call('/v1/auth/register', { method: 'POST', json });
    expect(res.status).toBe(409);
  });
});

describe('Login e bloqueio de conta', () => {
  it('200 — credenciais corretas', async () => {
    const { call, createUser } = setup();
    await createUser('client', 'c@exemplo.com');
    const res = await call('/v1/auth/login', { method: 'POST', json: { email: 'c@exemplo.com', password: PASSWORD } });
    expect(res.status).toBe(200);
  });

  it('401 — mesma mensagem para senha errada e e-mail inexistente (anti-enumeração)', async () => {
    const { call, createUser } = setup();
    await createUser('client', 'c@exemplo.com');
    const wrong = await call('/v1/auth/login', { method: 'POST', json: { email: 'c@exemplo.com', password: 'Errada123' } });
    const ghost = await call('/v1/auth/login', { method: 'POST', json: { email: 'x@exemplo.com', password: 'Errada123' } });
    expect(wrong.status).toBe(401);
    expect(ghost.status).toBe(401);
    expect((await wrong.json()).detail).toBe((await ghost.json()).detail);
  });

  it('429 — conta bloqueada após 5 falhas, mesmo com a senha certa em seguida', async () => {
    const { call, createUser, repos } = setup();
    await createUser('client', 'alvo@exemplo.com');
    for (let i = 0; i < 5; i++) {
      // IPs diferentes: o bloqueio é por conta, não só por IP
      await call('/v1/auth/login', { method: 'POST', json: { email: 'alvo@exemplo.com', password: 'Errada123' }, ip: `10.0.0.${i}` });
    }
    const res = await call('/v1/auth/login', { method: 'POST', json: { email: 'alvo@exemplo.com', password: PASSWORD }, ip: '10.0.0.99' });
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
    const events = (await repos.audit.list({ limit: 50, offset: 0 })).items.map((e) => e.event);
    expect(events).toContain('auth.lockout_activated');
  });

  it('429 — rate limit por IP nas rotas de autenticação', async () => {
    const { call } = setup();
    let last = 0;
    for (let i = 0; i < 11; i++) {
      const r = await call('/v1/auth/login', { method: 'POST', json: { email: `u${i}@exemplo.com`, password: 'Errada123' } });
      last = r.status;
    }
    expect(last).toBe(429);
  });
});

describe('JWT', () => {
  it('401 — rota protegida sem token', async () => {
    const { call } = setup();
    const res = await call('/v1/me');
    expect(res.status).toBe(401);
    expect(res.headers.get('www-authenticate')).toBe('Bearer');
  });

  it('401 — token com assinatura adulterada', async () => {
    const { call, createUser } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    const [h, p] = token.split('.');
    const forged = `${h}.${b64url({ ...JSON.parse(Buffer.from(p!, 'base64url').toString()), role: 'admin' })}.${token.split('.')[2]}`;
    const res = await call('/v1/me', { token: forged });
    expect(res.status).toBe(401);
  });

  it('401 — ataque "alg: none" é recusado', async () => {
    const { call, createUser } = setup();
    const { user } = await createUser('client', 'c@exemplo.com');
    const none = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({ sub: user.id, role: 'admin', exp: 9999999999 })}.`;
    const res = await call('/v1/me', { token: none });
    expect(res.status).toBe(401);
  });

  it('401 — token expirado', async () => {
    const { call, createUser } = setup();
    const { user } = await createUser('client', 'c@exemplo.com');
    const expired = await new SignJWT({ role: 'client' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuer('ford-intelligence-api')
      .setAudience('ford-intelligence-app')
      .setJti('x')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(TEST_ENV.JWT_SECRET));
    const res = await call('/v1/me', { token: expired });
    expect(res.status).toBe(401);
    expect((await res.json()).detail).toBe('Sessão expirada.');
  });

  it('200 — token válido devolve o usuário sem hash de senha', async () => {
    const { call, createUser } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    const res = await call('/v1/me', { token });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).not.toHaveProperty('passwordHash');
  });
});

describe('Refresh token', () => {
  it('rotação: o refresh token antigo deixa de valer', async () => {
    const { call, createUser } = setup();
    const { refreshToken } = await createUser('client', 'c@exemplo.com');
    const first = await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken } });
    expect(first.status).toBe(200);
    const second = await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken } });
    expect(second.status).toBe(401);
  });

  it('reuso detectado derruba a família inteira de sessões', async () => {
    const { call, createUser, repos } = setup();
    const { refreshToken } = await createUser('client', 'c@exemplo.com');
    const rotated = (await (await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken } })).json()).refreshToken;
    await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken } }); // reuso do antigo (ataque)
    const legit = await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken: rotated } });
    expect(legit.status).toBe(401);
    const events = (await repos.audit.list({ limit: 50, offset: 0 })).items.map((e) => e.event);
    expect(events).toContain('auth.refresh_reuse_detected');
  });

  it('logout revoga a sessão', async () => {
    const { call, createUser } = setup();
    const { token, refreshToken } = await createUser('client', 'c@exemplo.com');
    const out = await call('/v1/auth/logout', { method: 'POST', token, json: { refreshToken } });
    expect(out.status).toBe(204);
    const res = await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken } });
    expect(res.status).toBe(401);
  });
});

describe('Auditoria de login', () => {
  it('evento de login registra usuário e perfil', async () => {
    const { createUser, repos } = setup();
    const { user } = await createUser('analyst', 'a@exemplo.com');
    const ev = (await repos.audit.list({ limit: 10, offset: 0 }, 'auth.login_success')).items[0];
    expect(ev).toMatchObject({ userId: user.id, role: 'analyst', status: 200 });
  });
});
