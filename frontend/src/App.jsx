import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute, { CustomerRoute, AdminRoute, CourierRoute } from './routes/ProtectedRoute';

// Public Landing Page
import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import CustomerDashboard from './pages/CustomerDashboard';
import MyShipments from './pages/customer/MyShipments';
import CreateShipment from './pages/customer/CreateShipment';
import ShipmentDetails from './pages/customer/ShipmentDetails';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AllShipments from './pages/admin/AllShipments';
import AdminShipmentDetails from './pages/admin/AdminShipmentDetails';

// Courier Pages
import CourierDashboard from './pages/CourierDashboard';
import AssignedShipments from './pages/courier/AssignedShipments';
import CourierShipmentDetails from './pages/courier/CourierShipmentDetails';
import GpsSimulator from './pages/courier/GpsSimulator';

// Profile Page
import Profile from './pages/Profile';

// Helper component for /dashboard redirection based on authenticated role
const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="w-9 h-9 border-3 border-[#142B45] border-t-transparent rounded-full animate-spin"></div>
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

          {/* Customer Routes (Role: customer) */}
          <Route
            path="/customer"
            element={
              <CustomerRoute>
                <CustomerDashboard />
              </CustomerRoute>
            }
          />
          <Route
            path="/customer/shipments"
            element={
              <CustomerRoute>
                <MyShipments />
              </CustomerRoute>
            }
          />
          <Route
            path="/customer/shipments/create"
            element={
              <CustomerRoute>
                <CreateShipment />
              </CustomerRoute>
            }
          />
          <Route
            path="/customer/shipments/:trackingId"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <ShipmentDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/profile"
            element={
              <CustomerRoute>
                <Profile />
              </CustomerRoute>
            }
          />

          {/* Admin Routes (Role: admin) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/shipments"
            element={
              <AdminRoute>
                <AllShipments />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/shipments/:id"
            element={
              <AdminRoute>
                <AdminShipmentDetails />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <Profile />
              </AdminRoute>
            }
          />

          {/* Courier Routes (Role: courier) */}
          <Route
            path="/courier"
            element={
              <CourierRoute>
                <CourierDashboard />
              </CourierRoute>
            }
          />
          <Route
            path="/courier/shipments"
            element={
              <CourierRoute>
                <AssignedShipments />
              </CourierRoute>
            }
          />
          <Route
            path="/courier/shipments/:id"
            element={
              <CourierRoute>
                <CourierShipmentDetails />
              </CourierRoute>
            }
          />
          <Route
            path="/courier/simulator"
            element={
              <CourierRoute>
                <GpsSimulator />
              </CourierRoute>
            }
          />
          <Route
            path="/courier/profile"
            element={
              <CourierRoute>
                <Profile />
              </CourierRoute>
            }
          />

          {/* Unified Authenticated Profile Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['customer', 'courier', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Public Landing Page & Dashboard Redirection */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

