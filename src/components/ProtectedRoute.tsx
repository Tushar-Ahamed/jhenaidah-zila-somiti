import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { normalizeUserRole, type UserRole } from '@/types';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (user.status === 'suspended' || user.status === 'deleted') {
    return <Navigate to="/unauthorized" replace />;
  }

  // Role-based access control.
  const normalizedRole = normalizeUserRole(user.role);
  if (roles && !roles.includes(normalizedRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
