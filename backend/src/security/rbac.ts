/**
 * RBAC — mesma matriz do app mobile (src/utils/rbac.ts), agora aplicada no servidor.
 * No app ela só esconde telas; aqui ela decide.
 */
export const ROLES = ['client', 'analyst', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  client: ['profile:read:own', 'profile:write:own', 'booking:read:own', 'booking:write:own'],
  analyst: ['profile:read:own', 'profile:write:own', 'lead:read', 'dashboard:read'],
  admin: [
    'profile:read:own',
    'profile:write:own',
    'lead:read',
    'dashboard:read',
    'booking:read:any',
    'user:read',
    'user:role:write',
    'audit:read',
  ],
} as const satisfies Record<Role, readonly string[]>;

export type Permission = (typeof PERMISSIONS)[Role][number];

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[role] as readonly string[]).includes(permission);
}
