import axios from 'axios';

// Set base URL depending on environment
const baseURL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to headers if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tukomaji_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status other than 2xx
      return Promise.reject({
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // No response from server
      return Promise.reject({
        message: 'No response from server',
        status: null,
      });
    } else {
      // Something else happened
      return Promise.reject({
        message: error.message || 'Unknown error',
        status: null,
      });
    }
  }
);

export default api;
