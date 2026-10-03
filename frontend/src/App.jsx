import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute, { CustomerRoute, AdminRoute, CourierRoute } from './routes/ProtectedRoute';

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

// Helper component for root index redirection
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8]">
        <div className="w-9 h-9 border-3 border-[#172033] border-t-transparent rounded-full animate-spin"></div>
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

          {/* Root and Catch-All Redirections */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

