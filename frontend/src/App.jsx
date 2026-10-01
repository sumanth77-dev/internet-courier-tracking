import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourierDashboard from './pages/CourierDashboard';

// Helper component for root index redirection
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'courier') return <Navigate to="/courier" replace />;
    return <Navigate to="/customer" replace />;
  }

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Customer Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Courier Routes */}
          <Route
            path="/courier"
            element={
              <ProtectedRoute allowedRoles={['courier']}>
                <CourierDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root and Catch-All Redirections */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
