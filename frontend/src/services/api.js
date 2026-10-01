import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
