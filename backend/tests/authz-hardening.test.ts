import { describe, expect, it } from 'vitest';
import { setup } from './helpers.js';

const booking = {
  dealerId: 'dealer_sp_01',
  service: 'revision',
  mode: 'pickup-delivery',
  date: '2026-10-05',
  slot: '09:30',
  pickupAddress: 'Rua das Flores, 123 - São Paulo',
};

describe('RBAC — três perfis', () => {
  it('403 — cliente não acessa leads', async () => {
    const { call, createUser, repos } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    const res = await call('/v1/leads', { token });
    expect(res.status).toBe(403);
    const events = (await repos.audit.list({ limit: 10, offset: 0 })).items.map((e) => e.event);
    expect(events).toContain('authz.permission_denied');
  });

  it('200 — analista vê leads com nome mascarado', async () => {
    const { call, createUser } = setup();
    const { token } = await createUser('analyst', 'a@exemplo.com');
    const res = await call('/v1/leads', { token });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items[0].clientName).toMatch(/\*/);
    expect(JSON.stringify(body)).not.toContain('Carlos Eduardo Mendes');
  });

  it('detalhe do lead mascara e-mail e telefone e registra o acesso', async () => {
    const { call, createUser, repos } = setup();
    const { token } = await createUser('analyst', 'a@exemplo.com');
    const res = await call('/v1/leads/lead_001', { token });
    const body = await res.json();
    expect(body.email).toBe('c***@e***.com');
    expect(body.phone).toBe('(**) *****-4321');
    const events = (await repos.audit.list({ limit: 10, offset: 0 })).items.map((e) => e.event);
    expect(events).toContain('lead.accessed');
  });

  it('403 — analista não altera perfil de acesso de ninguém', async () => {
    const { call, createUser } = setup();
    const { token } = await createUser('analyst', 'a@exemplo.com');
    const { user: victim } = await createUser('client', 'c@exemplo.com');
    const res = await call(`/v1/admin/users/${victim.id}/role`, { method: 'PATCH', token, json: { role: 'admin' } });
    expect(res.status).toBe(403);
  });

  it('admin promove usuário, evento é auditado e sessões do alvo são revogadas', async () => {
    const { call, createUser, repos } = setup();
    const { token } = await createUser('admin', 'adm@exemplo.com');
    const { user: target, refreshToken } = await createUser('client', 'c@exemplo.com');
    const res = await call(`/v1/admin/users/${target.id}/role`, { method: 'PATCH', token, json: { role: 'analyst' } });
    expect(res.status).toBe(200);
    expect((await res.json()).role).toBe('analyst');
    const ev = (await repos.audit.list({ limit: 20, offset: 0 }, 'user.role_changed')).items[0];
    expect(ev?.meta).toMatchObject({ from: 'client', to: 'analyst' });
    const r = await call('/v1/auth/refresh', { method: 'POST', json: { refreshToken } });
    expect(r.status).toBe(401);
  });

  it('409 — admin não altera o próprio perfil', async () => {
    const { call, createUser } = setup();
    const { token, user } = await createUser('admin', 'adm@exemplo.com');
    const res = await call(`/v1/admin/users/${user.id}/role`, { method: 'PATCH', token, json: { role: 'client' } });
    expect(res.status).toBe(409);
  });

  it('rebaixamento vale na hora, mesmo com access token antigo', async () => {
    const { call, createUser } = setup();
    const { token: adminToken } = await createUser('admin', 'adm@exemplo.com');
    const { token: analystToken, user: analyst } = await createUser('analyst', 'a@exemplo.com');
    await call(`/v1/admin/users/${analyst.id}/role`, { method: 'PATCH', token: adminToken, json: { role: 'client' } });
    const res = await call('/v1/leads', { token: analystToken });
    expect(res.status).toBe(403);
  });
});

describe('Agendamentos — posse do recurso (IDOR/BOLA)', () => {
  it('201 — cria com Location e o dono vem do token', async () => {
    const { call, createUser } = setup();
    const { token, user } = await createUser('client', 'c@exemplo.com');
    const res = await call('/v1/bookings', { method: 'POST', token, json: booking });
    expect(res.status).toBe(201);
    expect(res.headers.get('location')).toMatch(/^\/v1\/bookings\//);
    const list = await (await call('/v1/bookings', { token })).json();
    expect(list.total).toBe(1);
    expect(user.id).toBeTruthy();
  });

  it('404 — cliente B não lê nem cancela agendamento do cliente A', async () => {
    const { call, createUser } = setup();
    const a = await createUser('client', 'a@exemplo.com');
    const b = await createUser('client', 'b@exemplo.com');
    const created = await (await call('/v1/bookings', { method: 'POST', token: a.token, json: booking })).json();
    expect((await call(`/v1/bookings/${created.id}`, { token: b.token })).status).toBe(404);
    expect((await call(`/v1/bookings/${created.id}`, { method: 'DELETE', token: b.token })).status).toBe(404);
    expect((await call(`/v1/bookings/${created.id}`, { token: a.token })).status).toBe(200);
  });

  it('endereço de coleta fica cifrado (AES-256-GCM) no armazenamento', async () => {
    const { call, createUser, repos } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    const created = await (await call('/v1/bookings', { method: 'POST', token, json: booking })).json();
    const raw = repos._raw.bookings.get(created.id)!;
    expect(raw.pickupAddressEnc).toMatch(/^v1\./);
    expect(raw.pickupAddressEnc).not.toContain('Rua das Flores');
    expect(created.pickupAddress).toBe(booking.pickupAddress);
  });

  it('422 — HTML no campo de observações é recusado', async () => {
    const { call, createUser } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    const res = await call('/v1/bookings', { method: 'POST', token, json: { ...booking, notes: '<img src=x onerror=alert(1)>' } });
    expect(res.status).toBe(422);
  });

  it('204 e depois 409 — cancelamento idempotente semanticamente', async () => {
    const { call, createUser } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    const created = await (await call('/v1/bookings', { method: 'POST', token, json: booking })).json();
    expect((await call(`/v1/bookings/${created.id}`, { method: 'DELETE', token })).status).toBe(204);
    expect((await call(`/v1/bookings/${created.id}`, { method: 'DELETE', token })).status).toBe(409);
  });
});

describe('Hardening da API', () => {
  it('cabeçalhos de segurança presentes', async () => {
    const { call } = setup();
    const res = await call('/v1/health');
    expect(res.headers.get('strict-transport-security')).toContain('max-age=');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('CORS só responde para origem da allowlist', async () => {
    const { call } = setup();
    const ok = await call('/v1/health', { headers: { origin: 'https://ford-intelligence.vercel.app' } });
    const evil = await call('/v1/health', { headers: { origin: 'https://evil.example' } });
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://ford-intelligence.vercel.app');
    expect(evil.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('413 — corpo acima de 32 KB', async () => {
    const { call } = setup();
    const res = await call('/v1/auth/login', {
      method: 'POST',
      json: { email: 'a@exemplo.com', password: 'x'.repeat(40_000) },
    });
    expect(res.status).toBe(413);
  });

  it('400 — JSON malformado recebe erro genérico', async () => {
    const { call } = setup();
    const res = await call('/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email": ',
    });
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
  });

  it('404 — rota inexistente no formato problem+json', async () => {
    const { call } = setup();
    const res = await call('/v1/nao-existe');
    expect(res.status).toBe(404);
    expect((await res.json()).requestId).toBeTruthy();
  });

  it('logs estruturados nunca contêm senha nem token', async () => {
    const { call, createUser, logs } = setup();
    const { token } = await createUser('client', 'c@exemplo.com');
    await call('/v1/auth/login', { method: 'POST', json: { email: 'c@exemplo.com', password: 'Errada123' } });
    await call('/v1/me', { token });
    const all = logs.join('\n');
    expect(all).not.toContain('Errada123');
    expect(all).not.toContain(token);
    expect(all).not.toContain('203.0.113.10'); // IP só aparece como hash
    const line = JSON.parse(logs.find((l) => l.includes('auth.login_failed'))!);
    expect(line).toMatchObject({ level: 'warn', service: 'ford-api', event: 'auth.login_failed' });
    expect(line.ipHash).toMatch(/^hmac:/);
  });

  it('OpenAPI publicado com esquema de segurança Bearer', async () => {
    const { call } = setup();
    const spec = await (await call('/v1/openapi.json')).json();
    expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
    expect(Object.keys(spec.paths)).toContain('/v1/bookings/{id}');
  });
});
