import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'courier') navigate('/courier', { replace: true });
      else navigate('/customer', { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both email address and password');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (result.success && result.user) {
        // Redirect according to user role
        if (result.user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (result.user.role === 'courier') {
          navigate('/courier', { replace: true });
        } else {
          navigate('/customer', { replace: true });
        }
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-2xl shadow-lg shadow-indigo-200 mb-3">
            📦
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Courier Tracking System
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your tracking portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <span className="text-rose-600 text-lg">⚠️</span>
            <div className="flex-1 text-sm text-rose-700 font-medium">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-medium text-sm shadow-lg shadow-indigo-600/20 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
