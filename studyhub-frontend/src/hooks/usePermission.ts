import useAuthStore, { type UserRole } from "../stores/useAuthStore";

export function usePermission(requiredRole: UserRole): boolean {
  const user = useAuthStore((s) => s.user);
  return user?.role === requiredRole;
}