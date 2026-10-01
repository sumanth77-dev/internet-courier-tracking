import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CourierDashboard = () => {
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
            <span className="text-2xl">🚚</span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Internet-Based Live Courier Tracking
              </h1>
              <p className="text-xs text-slate-500 font-medium">Courier Delivery Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-amber-50 text-amber-700 capitalize">
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
              <h2 className="text-xl font-bold text-slate-900">Courier Portal</h2>
              <p className="text-sm text-slate-500 mt-1">
                Active courier driver profile: <span className="font-semibold text-slate-700">{user?.name}</span>
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              ● Courier Shift Authenticated
            </span>
          </div>

          {/* Profile Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Courier Name
              </span>
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Phone
              </span>
              <p className="text-sm font-medium text-slate-800">{user?.phone || 'Not provided'}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Role
              </span>
              <p className="text-sm font-medium text-amber-600 font-mono capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Module Status Placeholder */}
          <div className="p-6 rounded-xl bg-amber-50/50 border border-amber-100">
            <h3 className="text-sm font-bold text-amber-900 mb-2">
              Module 5: Foundation & Authentication Active
            </h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              Courier authentication verified.
              Assigned delivery jobs, status transitions, real-time GPS mobile tracking, and delivery proof will be plugged in during subsequent modules.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourierDashboard;
