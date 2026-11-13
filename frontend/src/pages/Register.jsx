import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import BrandLogo from '../components/common/BrandLogo';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'courier') navigate('/courier', { replace: true });
      else navigate('/customer', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, phone, password, confirmPassword } = formData;

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address');
      return;
    }

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register({
        name,
        email,
        phone,
        password,
      });

      if (result.success) {
        navigate('/customer', { replace: true });
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Unable to create account. Please verify network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout cardWidth="max-w-[420px]">
      {/* Brand Header */}
      <div className="text-center mb-5">
        <div className="flex justify-center mb-2">
          <BrandLogo size="lg" showTagline={false} theme="light" />
        </div>
        <h1 className="text-base font-bold text-[#F5F5F5] tracking-tight">
          Create Customer Account
        </h1>
        <p className="text-xs text-[#929292] mt-1">Start dispatching and tracking your shipments with SkyRoute.</p>
      </div>

      {/* Role Note */}
      <p className="text-[11px] text-[#C0C0C0] bg-[#1C1C1C] border border-[#353535] rounded-xl px-3 py-1.5 mb-4 text-center font-medium">
        Customer accounts register here. Courier and Admin credentials are provisioned by SkyRoute dispatch operations.
      </p>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-2.5 rounded-xl bg-[#FDF1F0] border border-[#F8D0CE] flex items-start gap-2 text-xs text-[#E45B54]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-[#202020] mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Sumanth Kumar"
            required
            className="w-full h-10 px-3.5 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-[#202020] mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
            className="w-full h-10 px-3.5 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-bold text-[#202020] mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            required
            className="w-full h-10 px-3.5 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
          />
        </div>

        {/* Passwords Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#202020] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 chars"
                required
                className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-xs sm:text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#A7A7A7] hover:text-[#202020] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-[#202020] mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter"
                required
                className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-[#DEDCD8] text-[#202020] placeholder-[#A7A7A7] text-xs sm:text-sm focus:outline-none focus:border-[#FF7547] focus:ring-1 focus:ring-[#FF7547] transition bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#A7A7A7] hover:text-[#202020] cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button - Coral Orange #FF7547 */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-xl bg-[#FF7547] hover:bg-[#F06438] active:scale-[0.99] text-white font-bold text-sm transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating SkyRoute Account...</span>
            </>
          ) : (
            <span>Create SkyRoute Account</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 pt-4 border-t border-[#DEDCD8] text-center text-xs text-[#777777]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-[#FF7547] hover:text-[#202020] transition ml-1"
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
