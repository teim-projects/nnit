// src/utils/axios.js
import axios from 'axios';
import { logoutUser } from './auth';

// Create an axios instance with base URL from environment
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem('access') || 
      localStorage.getItem('access_token') || 
      localStorage.getItem('token') || 
      localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401, clear token and redirect to login
    if (error.response && error.response.status === 401) {
      logoutUser(true);
    }
    return Promise.reject(error);
  }
);

export default api;