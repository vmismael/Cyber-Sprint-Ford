import type { AuthUser, UserRole } from '@/services/mocks/authApi';

export type RbacAction =
  | 'view:analyst_dashboard'
  | 'view:leads'
  | 'view:wallet'
  | 'edit:profile';

const PERMISSIONS: Record<UserRole, RbacAction[]> = {
  analyst: ['view:analyst_dashboard', 'view:leads', 'edit:profile'],
  client: ['view:wallet', 'edit:profile'],
};

export function hasPermission(user: AuthUser | null, action: RbacAction): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role]?.includes(action) ?? false;
}
