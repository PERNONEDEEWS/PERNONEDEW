import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'customer' | 'cashier';
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-yellow-400 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (!user || !profile) {
    const loginPath = requiredRole === 'admin'
      ? '/login/admin'
      : requiredRole === 'cashier'
        ? '/login/cashier'
        : '/login/customer';
    return <Navigate to={loginPath} replace />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (profile.role === 'cashier') {
      return <Navigate to="/cashier" replace />;
    } else {
      return <Navigate to="/customer" replace />;
    }
  }

  return <Outlet />;
}
