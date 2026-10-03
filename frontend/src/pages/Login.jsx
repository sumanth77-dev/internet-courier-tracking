import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Package, Eye, EyeOff, AlertCircle, HelpCircle } from 'lucide-react';

const Login = () => {
  const [selectedPortal, setSelectedPortal] = useState('customer'); // 'customer' | 'courier' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotNotice, setForgotNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, logout, user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated with a valid session, redirect to the matching portal
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'courier') navigate('/courier', { replace: true });
      else navigate('/customer', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const portals = [
    { id: 'customer', label: 'Customer' },
    { id: 'courier', label: 'Courier' },
    { id: 'admin', label: 'Admin' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotNotice(false);

    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success && result.user) {
        const actualRole = result.user.role;

        // Verify that authenticated user belongs to the selected portal
        if (actualRole !== selectedPortal) {
          logout(); // Clear stored session to prevent unauthorized navigation

          const roleName =
            actualRole === 'admin'
              ? 'Admin'
              : actualRole === 'courier'
              ? 'Courier'
              : 'Customer';

          setError(`This account belongs to the ${roleName} portal.`);
          return;
        }

        // Navigate to appropriate role portal
        if (actualRole === 'admin') {
          navigate('/admin', { replace: true });
        } else if (actualRole === 'courier') {
          navigate('/courier', { replace: true });
        } else {
          navigate('/customer', { replace: true });
        }
      } else {
        setError(result.message || 'Invalid email or password');
      }
    } catch (err) {
      setError('Unable to sign in. Please verify network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout cardWidth="max-w-[400px]">
      {/* Small Header */}
      <div className="text-center mb-6">
        <div className="w-10 h-10 mx-auto rounded-lg bg-[#172033] text-[#D97706] flex items-center justify-center mb-2.5">
          <Package className="w-5 h-5" />
        </div>
        <h1 className="text-base font-bold text-[#172033] tracking-tight">
          Internet-Based Live Courier Tracking
        </h1>
        <p className="text-xs text-[#667085] mt-1">Sign in to your account</p>
      </div>

      {/* Portal Selection Tabs */}
      <div className="mb-5">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#667085] mb-1.5">
          Login as
        </label>
        <div className="grid grid-cols-3 gap-2">
          {portals.map((portal) => {
            const isSelected = selectedPortal === portal.id;
            return (
              <button
                key={portal.id}
                type="button"
                onClick={() => {
                  setSelectedPortal(portal.id);
                  setError('');
                }}
                className={`h-9 px-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#172033]/5 border-2 border-[#172033] text-[#172033]'
                    : 'bg-white border border-[#D9DEE5] text-[#667085] hover:bg-[#F4F6F8] hover:text-[#172033]'
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>}
                <span>{portal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Forgot Password Notice */}
      {forgotNotice && (
        <div className="mb-4 p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-[#B45309]">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Password resets are managed by the system administrator.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full h-11 px-3.5 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#172033]">
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotNotice((prev) => !prev)}
              className="text-xs text-[#D97706] hover:text-[#B45309] font-medium"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#667085] hover:text-[#172033]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-[#172033] hover:bg-[#0F172A] active:scale-[0.99] text-white font-medium text-sm transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-5 pt-4 border-t border-[#D9DEE5] text-center text-xs text-[#667085]">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-[#D97706] hover:text-[#B45309] transition ml-1"
        >
          Register
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
