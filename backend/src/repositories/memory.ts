import { randomUUID } from 'node:crypto';
import { SEED_LEADS } from './seedLeads.js';
import type { AuditEvent, Booking, Page, Profile, RefreshToken, Repositories, User } from './types.js';

/** Implementação em memória: usada nos testes automatizados e em dev sem banco. */
export function createMemoryRepositories(): Repositories & { _raw: { bookings: Map<string, Booking>; audit: AuditEvent[] } } {
  const users = new Map<string, User>();
  const profiles = new Map<string, Profile>();
  const bookings = new Map<string, Booking>();
  const refresh = new Map<string, RefreshToken>();
  const audit: AuditEvent[] = [];

  const paginate = <T>(arr: T[], page: Page) => ({
    items: arr.slice(page.offset, page.offset + page.limit),
    total: arr.length,
  });

  return {
    _raw: { bookings, audit },

    users: {
      async findByEmail(email) {
        const e = email.toLowerCase();
        return [...users.values()].find((u) => u.email === e) ?? null;
      },
      async findById(id) {
        return users.get(id) ?? null;
      },
      async create(data) {
        const user: User = {
          id: randomUUID(),
          ...data,
          email: data.email.toLowerCase(),
          failedLoginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date(),
        };
        users.set(user.id, user);
        return user;
      },
      async list(page) {
        const all = [...users.values()].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        return paginate(all, page);
      },
      async updateRole(id, role) {
        const u = users.get(id);
        if (!u) return null;
        u.role = role;
        return u;
      },
      async setLoginFailures(id, attempts, lockedUntil) {
        const u = users.get(id);
        if (u) {
          u.failedLoginAttempts = attempts;
          u.lockedUntil = lockedUntil;
        }
      },
    },

    profiles: {
      async get(userId) {
        return profiles.get(userId) ?? null;
      },
      async upsert(p) {
        const saved = { ...p, updatedAt: new Date() };
        profiles.set(p.userId, saved);
        return saved;
      },
    },

    bookings: {
      async findById(id) {
        return bookings.get(id) ?? null;
      },
      async listByUser(userId, page) {
        const all = [...bookings.values()]
          .filter((b) => b.userId === userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return paginate(all, page);
      },
      async listAll(page) {
        const all = [...bookings.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return paginate(all, page);
      },
      async create(data) {
        const b: Booking = {
          ...data,
          id: randomUUID(),
          protocol: `FI-${Date.now().toString(36).toUpperCase()}`,
          status: 'confirmed',
          createdAt: new Date(),
        };
        bookings.set(b.id, b);
        return b;
      },
      async cancel(id) {
        const b = bookings.get(id);
        if (!b) return null;
        b.status = 'cancelled';
        return b;
      },
      async deleteOlderThan(cutoff) {
        let n = 0;
        for (const [id, b] of bookings) if (b.createdAt < cutoff) bookings.delete(id), n++;
        return n;
      },
    },

    refreshTokens: {
      async create(data) {
        const t: RefreshToken = { ...data, id: randomUUID(), revokedAt: null, replacedBy: null, createdAt: new Date() };
        refresh.set(t.id, t);
        return t;
      },
      async findByHash(hash) {
        return [...refresh.values()].find((t) => t.tokenHash === hash) ?? null;
      },
      async revoke(id, replacedBy) {
        const t = refresh.get(id);
        if (t && !t.revokedAt) {
          t.revokedAt = new Date();
          t.replacedBy = replacedBy ?? null;
        }
      },
      async revokeFamily(familyId) {
        for (const t of refresh.values()) if (t.familyId === familyId && !t.revokedAt) t.revokedAt = new Date();
      },
      async revokeAllForUser(userId) {
        for (const t of refresh.values()) if (t.userId === userId && !t.revokedAt) t.revokedAt = new Date();
      },
    },

    leads: {
      async list(page, risk) {
        const all = SEED_LEADS.filter((l) => !risk || l.riskLabel === risk);
        return paginate(all, page);
      },
      async findById(id) {
        return SEED_LEADS.find((l) => l.id === id) ?? null;
      },
    },

    audit: {
      async insert(e) {
        audit.unshift({ ...e, id: randomUUID() });
      },
      async list(page, event) {
        const all = audit.filter((e) => !event || e.event === event);
        return paginate(all, page);
      },
    },
  };
}
