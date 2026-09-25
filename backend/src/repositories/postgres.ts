import postgres from 'postgres';
import type { AuditEvent, Booking, Lead, Profile, RefreshToken, Repositories, User } from './types';

/**
 * Repositório PostgreSQL (Supabase).
 *
 * Toda consulta usa tagged templates do `postgres`: os valores viajam como
 * parâmetros, nunca concatenados no SQL — isso elimina SQL injection por construção.
 * `prepare: false` é exigido pelo pooler do Supabase em modo transação (porta 6543).
 */
export function createPostgresRepositories(databaseUrl: string): Repositories & { close(): Promise<void> } {
  const sql = postgres(databaseUrl, {
    prepare: false,
    ssl: databaseUrl.includes('localhost') ? false : 'require', // TLS obrigatório fora do ambiente local
    max: 5,
    idle_timeout: 20,
    transform: postgres.camel,
  });

  const one = <T>(rows: readonly unknown[]) => (rows[0] as T | undefined) ?? null;

  return {
    close: () => sql.end(),

    users: {
      async findByEmail(email) {
        return one<User>(await sql`select * from users where email = ${email.toLowerCase()} limit 1`);
      },
      async findById(id) {
        return one<User>(await sql`select * from users where id = ${id} limit 1`);
      },
      async create(d) {
        const rows = await sql`
          insert into users (name, email, password_hash, role)
          values (${d.name}, ${d.email.toLowerCase()}, ${d.passwordHash}, ${d.role})
          returning *`;
        return rows[0] as unknown as User;
      },
      async list(page) {
        const items = await sql`select * from users order by created_at limit ${page.limit} offset ${page.offset}`;
        const [{ total }] = (await sql`select count(*)::int as total from users`) as unknown as [{ total: number }];
        return { items: items as unknown as User[], total };
      },
      async updateRole(id, role) {
        return one<User>(await sql`update users set role = ${role} where id = ${id} returning *`);
      },
      async setLoginFailures(id, attempts, lockedUntil) {
        await sql`update users set failed_login_attempts = ${attempts}, locked_until = ${lockedUntil} where id = ${id}`;
      },
    },

    profiles: {
      async get(userId) {
        return one<Profile>(await sql`select * from profiles where user_id = ${userId}`);
      },
      async upsert(p) {
        const rows = await sql`
          insert into profiles (user_id, vehicle_model, usage_style, monthly_km, plan)
          values (${p.userId}, ${p.vehicleModel}, ${p.usageStyle}, ${p.monthlyKm}, ${p.plan})
          on conflict (user_id) do update set
            vehicle_model = excluded.vehicle_model,
            usage_style = excluded.usage_style,
            monthly_km = excluded.monthly_km,
            plan = excluded.plan,
            updated_at = now()
          returning *`;
        return rows[0] as unknown as Profile;
      },
    },

    bookings: {
      async findById(id) {
        return one<Booking>(await sql`select * from bookings where id = ${id}`);
      },
      async listByUser(userId, page) {
        const items = await sql`
          select * from bookings where user_id = ${userId}
          order by created_at desc limit ${page.limit} offset ${page.offset}`;
        const [{ total }] = (await sql`select count(*)::int as total from bookings where user_id = ${userId}`) as unknown as [{ total: number }];
        return { items: items as unknown as Booking[], total };
      },
      async listAll(page) {
        const items = await sql`select * from bookings order by created_at desc limit ${page.limit} offset ${page.offset}`;
        const [{ total }] = (await sql`select count(*)::int as total from bookings`) as unknown as [{ total: number }];
        return { items: items as unknown as Booking[], total };
      },
      async create(d) {
        const rows = await sql`
          insert into bookings (user_id, protocol, dealer_id, service, mode, date, slot, pickup_address_enc, notes_enc)
          values (${d.userId}, ${'FI-' + Date.now().toString(36).toUpperCase()}, ${d.dealerId}, ${d.service}, ${d.mode},
                  ${d.date}, ${d.slot}, ${d.pickupAddressEnc}, ${d.notesEnc})
          returning *`;
        return rows[0] as unknown as Booking;
      },
      async cancel(id) {
        return one<Booking>(await sql`update bookings set status = 'cancelled' where id = ${id} returning *`);
      },
      async deleteOlderThan(cutoff) {
        const res = await sql`delete from bookings where created_at < ${cutoff}`;
        return res.count;
      },
    },

    refreshTokens: {
      async create(d) {
        const rows = await sql`
          insert into refresh_tokens (user_id, token_hash, family_id, expires_at)
          values (${d.userId}, ${d.tokenHash}, ${d.familyId}, ${d.expiresAt})
          returning *`;
        return rows[0] as unknown as RefreshToken;
      },
      async findByHash(hash) {
        return one<RefreshToken>(await sql`select * from refresh_tokens where token_hash = ${hash}`);
      },
      async revoke(id, replacedBy) {
        await sql`update refresh_tokens set revoked_at = now(), replaced_by = ${replacedBy ?? null}
                  where id = ${id} and revoked_at is null`;
      },
      async revokeFamily(familyId) {
        await sql`update refresh_tokens set revoked_at = now() where family_id = ${familyId} and revoked_at is null`;
      },
      async revokeAllForUser(userId) {
        await sql`update refresh_tokens set revoked_at = now() where user_id = ${userId} and revoked_at is null`;
      },
    },

    leads: {
      async list(page, risk) {
        const where = risk ? sql`where risk_label = ${risk}` : sql``;
        const items = await sql`select * from leads ${where} order by ai_score desc limit ${page.limit} offset ${page.offset}`;
        const [{ total }] = (await sql`select count(*)::int as total from leads ${where}`) as unknown as [{ total: number }];
        return { items: items as unknown as Lead[], total };
      },
      async findById(id) {
        return one<Lead>(await sql`select * from leads where id = ${id}`);
      },
    },

    audit: {
      async insert(e) {
        await sql`
          insert into audit_log (timestamp, level, event, user_id, role, request_id, ip_hash, route, status, meta)
          values (${e.timestamp}, ${e.level}, ${e.event}, ${e.userId}, ${e.role}, ${e.requestId},
                  ${e.ipHash}, ${e.route}, ${e.status}, ${sql.json(e.meta as postgres.JSONValue)})`;
      },
      async list(page, event) {
        const where = event ? sql`where event = ${event}` : sql``;
        const items = await sql`select * from audit_log ${where} order by timestamp desc limit ${page.limit} offset ${page.offset}`;
        const [{ total }] = (await sql`select count(*)::int as total from audit_log ${where}`) as unknown as [{ total: number }];
        return { items: items as unknown as AuditEvent[], total };
      },
    },
  };
}
