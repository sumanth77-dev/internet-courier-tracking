import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import BrandLogo from '../components/common/BrandLogo';
import { Eye, EyeOff, AlertCircle, HelpCircle, MapPin } from 'lucide-react';

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
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTrackId = searchParams.get('track');

  // If already authenticated with a valid session, redirect to the matching portal or tracking
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (redirectTrackId && (user.role === 'customer' || user.role === 'admin')) {
        navigate(`/customer/shipments/${encodeURIComponent(redirectTrackId)}`, { replace: true });
        return;
      }
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'courier') navigate('/courier', { replace: true });
      else navigate('/customer', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate, redirectTrackId]);

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

        // Navigate to tracking or appropriate role portal
        if (redirectTrackId && (actualRole === 'customer' || actualRole === 'admin')) {
          navigate(`/customer/shipments/${encodeURIComponent(redirectTrackId)}`, { replace: true });
          return;
        }

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
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-2">
          <BrandLogo size="lg" showTagline={false} theme="light" />
        </div>
        <p className="text-xs text-[#929292] font-medium mt-1">Sign in to your SkyRoute portal</p>
      </div>

      {/* Shipment Tracking Query Notice */}
      {redirectTrackId && (
        <div className="mb-4 p-2.5 rounded-xl bg-[#FFF2ED] border border-[#FFD6C9] flex items-start gap-2 text-xs text-[#202020]">
          <MapPin className="w-4 h-4 text-[#FF7547] shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-bold">Shipment #{redirectTrackId}: </span>
            Please sign in to securely access live tracking and delivery details.
          </div>
        </div>
      )}

      {/* Portal Selection Tabs */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1.5">
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
                className={`h-9 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#171717] text-white shadow-xs'
                    : 'bg-white border border-[#DEDCD8] text-[#777777] hover:bg-[#F2F0ED] hover:text-[#202020]'
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#FF7547]"></span>}
                <span>{portal.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-2.5 rounded-xl bg-[#FDF1F0] border border-[#F8D0CE] flex items-start gap-2 text-xs text-[#E45B54]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Forgot Password Notice */}
      {forgotNotice && (
        <div className="mb-4 p-2.5 rounded-xl bg-[#FEF7ED] border border-[#FDE3C8] flex items-start gap-2 text-xs text-[#C48429]">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Password resets are managed by the SkyRoute system administrator.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-[#202020] mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full h-11 px-3.5 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-[#202020]">
              Password
            </label>
            <button
              type="button"
              onClick={() => setForgotNotice((prev) => !prev)}
              className="text-xs text-[#FF7547] hover:text-[#F06438] font-bold cursor-pointer"
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
              className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A7A7A7] hover:text-[#202020] cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Sign In Button - Coral Orange #FF7547 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[#FF7547] hover:bg-[#F06438] active:scale-[0.99] text-white font-bold text-sm transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In to SkyRoute</span>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-5 pt-4 border-t border-[#DEDCD8] text-center text-xs text-[#777777]">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-bold text-[#FF7547] hover:text-[#202020] transition ml-1"
        >
          Register as Customer
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
