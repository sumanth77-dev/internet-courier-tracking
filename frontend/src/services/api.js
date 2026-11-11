import axios from 'axios';

// Normalize API Base URL:
// 1. Read VITE_API_URL, fallback to localhost:5000 in dev
// 2. Strip trailing slashes
// 3. Ensure it ends with '/api' so that all service calls (/auth/..., /shipments/...) route correctly
//    even when Vercel environment variable is set without the '/api' suffix
const rawBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
export const API_ORIGIN = rawBase.replace(/\/api\/?$/, '');
export const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 and request was authenticated, clear stale token
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('authToken')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
