import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Internet-Based Live Courier Tracking
              </h1>
              <p className="text-xs text-slate-500 font-medium">Administrator Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-purple-50 text-purple-700 capitalize">
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Administrator Console</h2>
              <p className="text-sm text-slate-500 mt-1">
                Signed in as <span className="font-semibold text-slate-700">{user?.email}</span>
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              ● Admin Privilege Active
            </span>
          </div>

          {/* Profile overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Admin Name
              </span>
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Email
              </span>
              <p className="text-sm font-medium text-slate-800">{user?.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Role
              </span>
              <p className="text-sm font-medium text-purple-600 font-mono capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Module Status Placeholder */}
          <div className="p-6 rounded-xl bg-purple-50/50 border border-purple-100">
            <h3 className="text-sm font-bold text-purple-900 mb-2">
              Module 5: Foundation & Authentication Active
            </h3>
            <p className="text-sm text-purple-800 leading-relaxed">
              Admin authentication and protected route enforcement verified.
              Shipment assignment, courier list management, and live GPS monitoring console will be integrated in subsequent modules.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
