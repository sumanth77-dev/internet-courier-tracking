import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import { Package, Eye, EyeOff, AlertCircle } from 'lucide-react';

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
      {/* Small Header */}
      <div className="text-center mb-5">
        <div className="w-10 h-10 mx-auto rounded-lg bg-[#172033] text-[#D97706] flex items-center justify-center mb-2.5">
          <Package className="w-5 h-5" />
        </div>
        <h1 className="text-base font-bold text-[#172033] tracking-tight">
          Create your account
        </h1>
        <p className="text-xs text-[#667085] mt-1">Start tracking your shipments.</p>
      </div>

      {/* Small Unobtrusive Role Note */}
      <p className="text-[11px] text-[#667085] bg-[#F4F6F8] border border-[#D9DEE5] rounded-md px-3 py-1.5 mb-4 text-center">
        Customer accounts can be created here. Courier and Admin accounts are managed by the system.
      </p>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Sumanth Kumar"
            required
            className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
            className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-[#172033] mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
            required
            className="w-full h-10 px-3 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
          />
        </div>

        {/* Passwords Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
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
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-xs sm:text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#667085] hover:text-[#172033]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
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
                className="w-full h-10 pl-3 pr-8 rounded-lg border border-[#D9DEE5] text-[#172033] placeholder-[#667085]/60 text-xs sm:text-sm focus:outline-none focus:border-[#172033] focus:ring-1 focus:ring-[#172033] transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#667085] hover:text-[#172033]"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 mt-1 rounded-lg bg-[#172033] hover:bg-[#0F172A] active:scale-[0.99] text-white font-medium text-sm transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-xs"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-5 pt-4 border-t border-[#D9DEE5] text-center text-xs text-[#667085]">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#D97706] hover:text-[#B45309] transition ml-1"
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
