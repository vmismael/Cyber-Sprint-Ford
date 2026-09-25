import type { Role } from '../security/rbac.js';

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
};

export type VehicleModel = 'ranger' | 'maverick' | 'territory' | 'mustang' | 'raptor';
export type UsageStyle = 'urban' | 'rural' | 'mixed' | 'performance';
export type Plan = 'agro' | 'urban' | 'premium';

export type Profile = {
  userId: string;
  vehicleModel: VehicleModel;
  usageStyle: UsageStyle;
  monthlyKm: number;
  plan: Plan;
  updatedAt: Date;
};

export const SERVICE_KINDS = ['revision', 'oil-change', 'tires', 'diagnostics', 'other'] as const;
export type ServiceKind = (typeof SERVICE_KINDS)[number];
export const DELIVERY_MODES = ['in-person', 'pickup-delivery'] as const;
export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export type Booking = {
  id: string;
  userId: string;
  protocol: string;
  dealerId: string;
  service: ServiceKind;
  mode: DeliveryMode;
  date: string;
  slot: string;
  /** Sempre cifrado (AES-256-GCM) quando persistido. */
  pickupAddressEnc: string | null;
  notesEnc: string | null;
  status: 'confirmed' | 'cancelled';
  createdAt: Date;
};

export type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedBy: string | null;
  createdAt: Date;
};

export type Lead = {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  vehicleModel: VehicleModel;
  vehicleYear: number;
  odometerKm: number;
  plan: Plan;
  service: string;
  aiScore: number;
  riskLabel: 'baixo' | 'moderado' | 'alto';
  lastActivity: string;
  status: 'novo' | 'contactado' | 'convertido' | 'perdido';
  estimatedRevenue: number;
};

export type AuditEvent = {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  event: string;
  userId: string | null;
  role: Role | null;
  requestId: string | null;
  ipHash: string | null;
  route: string | null;
  status: number | null;
  meta: Record<string, unknown>;
};

export type Page = { limit: number; offset: number };

export interface Repositories {
  users: {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(data: Pick<User, 'name' | 'email' | 'passwordHash' | 'role'>): Promise<User>;
    list(page: Page): Promise<{ items: User[]; total: number }>;
    updateRole(id: string, role: Role): Promise<User | null>;
    setLoginFailures(id: string, attempts: number, lockedUntil: Date | null): Promise<void>;
  };
  profiles: {
    get(userId: string): Promise<Profile | null>;
    upsert(profile: Omit<Profile, 'updatedAt'>): Promise<Profile>;
  };
  bookings: {
    findById(id: string): Promise<Booking | null>;
    listByUser(userId: string, page: Page): Promise<{ items: Booking[]; total: number }>;
    listAll(page: Page): Promise<{ items: Booking[]; total: number }>;
    create(data: Omit<Booking, 'id' | 'createdAt' | 'status' | 'protocol'>): Promise<Booking>;
    cancel(id: string): Promise<Booking | null>;
    deleteOlderThan(cutoff: Date): Promise<number>;
  };
  refreshTokens: {
    create(data: Pick<RefreshToken, 'userId' | 'tokenHash' | 'familyId' | 'expiresAt'>): Promise<RefreshToken>;
    findByHash(tokenHash: string): Promise<RefreshToken | null>;
    revoke(id: string, replacedBy?: string): Promise<void>;
    revokeFamily(familyId: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
  };
  leads: {
    list(page: Page, risk?: Lead['riskLabel']): Promise<{ items: Lead[]; total: number }>;
    findById(id: string): Promise<Lead | null>;
  };
  audit: {
    insert(event: Omit<AuditEvent, 'id'>): Promise<void>;
    list(page: Page, event?: string): Promise<{ items: AuditEvent[]; total: number }>;
  };
}
