import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ROLES, type Role } from "@/convex/schema";

interface ProtectedRouteProps {
  /** Component to render when authorized */
  children: ReactNode;
  /** Required role(s) to access this route */
  requiredRole?: Role | Role[];
  /** Where to redirect if not authenticated (default: /auth) */
  redirectTo?: string;
  /** Where to redirect if authenticated but wrong role (default: /dashboard) */
  unauthorizedRedirect?: string;
}

/**
 * Route guard component that checks authentication and role.
 *
 * @example
 * ```tsx
 * // Require any authenticated user
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // Require teacher or admin role
 * <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.ADMIN]}>
 *   <TeacherLayout />
 * </ProtectedRoute>
 *
 * // Require admin only
 * <ProtectedRoute requiredRole={ROLES.ADMIN}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/auth",
  unauthorizedRedirect = "/dashboard",
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate(redirectTo, { replace: true });
      return;
    }

    if (requiredRole && user) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!user.role || !roles.includes(user.role as Role)) {
        navigate(unauthorizedRedirect, { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, redirectTo, unauthorizedRedirect, navigate]);

  if (isLoading) {
    return <LoadingSpinner fullPage message="Tekshirilmoqda..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user.role || !roles.includes(user.role as Role)) {
      return null;
    }
  }

  return <>{children}</>;
}
