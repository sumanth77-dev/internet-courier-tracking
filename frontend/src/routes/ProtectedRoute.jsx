import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component
 * Guards routes requiring authentication and specific role authorization
 * @param {Array<string>} allowedRoles - Optional list of authorized roles
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F8]">
        <div className="w-10 h-10 border-3 border-[#172033] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-[#667085]">Restoring session...</p>
      </div>
    );
  }

  // 1. Not logged in -> Redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role restriction check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate home dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'courier') return <Navigate to="/courier" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
};

// Explicit role-based route wrappers
export const CustomerRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['customer']}>{children}</ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>
);

export const CourierRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['courier']}>{children}</ProtectedRoute>
);

export default ProtectedRoute;


