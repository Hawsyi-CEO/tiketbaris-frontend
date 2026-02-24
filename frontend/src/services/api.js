import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Tambahkan token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle session termination
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if session was terminated from another device
    if (error.response?.status === 401 && error.response?.data?.logout) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Session Anda telah diakhiri dari device lain. Silakan login kembali.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
