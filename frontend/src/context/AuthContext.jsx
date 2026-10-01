import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  const [loading, setLoading] = useState(true);

  // Restore authentication session on initial app load
  useEffect(() => {
    const restoreAuth = async () => {
      const storedToken = localStorage.getItem('authToken');

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data && response.data.success && response.data.data.user) {
          setUser(response.data.data.user);
          setToken(storedToken);
        } else {
          throw new Error('Failed to restore user profile');
        }
      } catch (error) {
        console.warn('Session restoration failed or expired:', error.response?.data?.message || error.message);
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.data && response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;

        localStorage.setItem('authToken', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);

        return {
          success: true,
          user: receivedUser,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Login failed',
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        (error.request ? 'Unable to reach backend server. Please verify backend is running.' : 'An unexpected error occurred during login.');

      return {
        success: false,
        message: errorMsg,
      };
    }
  };

  /**
   * Register new customer
   * @param {Object} userData - { name, email, password, phone }
   */
  const register = async ({ name, email, password, phone }) => {
    try {
      const response = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
      });

      if (response.data && response.data.success) {
        const { token: receivedToken, user: receivedUser } = response.data.data;

        if (receivedToken && receivedUser) {
          localStorage.setItem('authToken', receivedToken);
          setToken(receivedToken);
          setUser(receivedUser);
        }

        return {
          success: true,
          user: receivedUser,
        };
      }

      return {
        success: false,
        message: response.data.message || 'Registration failed',
      };
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        (error.request ? 'Unable to reach backend server. Please verify backend is running.' : 'An unexpected error occurred during registration.');

      return {
        success: false,
        message: errorMsg,
      };
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
