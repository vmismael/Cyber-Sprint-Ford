import type { AuthUser, UserRole } from '@/services/mocks/authApi';

export type RbacAction =
  | 'view:analyst_dashboard'
  | 'view:leads'
  | 'view:wallet'
  | 'edit:profile'
  | 'manage:users';

const PERMISSIONS: Record<UserRole, RbacAction[]> = {
  admin:   ['view:analyst_dashboard', 'view:leads', 'manage:users', 'edit:profile'],
  analyst: ['view:analyst_dashboard', 'view:leads', 'edit:profile'],
  client:  ['view:wallet', 'edit:profile'],
};

export function hasPermission(user: AuthUser | null, action: RbacAction): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(action) ?? false;
}
