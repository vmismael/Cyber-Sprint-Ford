import { create } from 'zustand';

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'token_expired'
  | 'permission_denied'
  | 'lockout_activated'
  | 'lockout_lifted';

export type AuditEvent = {
  id: string;
  timestamp: string;
  event: AuditEventType;
  userId?: string;
  meta?: Record<string, unknown>;
};

const MAX_EVENTS = 50;

type AuditState = {
  events: AuditEvent[];
  log: (event: AuditEventType, userId?: string, meta?: Record<string, unknown>) => void;
};

export const useAuditStore = create<AuditState>((set, get) => ({
  events: [],
  log: (event, userId, meta) => {
    const entry: AuditEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      event,
      ...(userId !== undefined && { userId }),
      ...(meta !== undefined && { meta }),
    };
    const events = [entry, ...get().events].slice(0, MAX_EVENTS);
    set({ events });
  },
}));
