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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-600">Restoring session...</p>
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

export default ProtectedRoute;
