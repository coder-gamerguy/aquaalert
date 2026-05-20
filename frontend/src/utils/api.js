// src/utils/api.js — API client
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Attach JWT token to operator requests
API.interceptors.request.use(config => {
  const token = localStorage.getItem('operator_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('operator_token');
      window.location.href = '/operator/login';
    }
    return Promise.reject(err);
  }
);

export const zonesAPI = {
  list: () => API.get('/zones'),
  get: (id) => API.get(`/zones/${id}`),
  open: (id, flowPct) => API.post(`/zones/${id}/open`, { flow_pct: flowPct }),
  close: (id) => API.post(`/zones/${id}/close`),
};

export const alertsAPI = {
  list: (params) => API.get('/alerts', { params }),
  stats: () => API.get('/alerts/stats'),
};

export const subscribersAPI = {
  register: (data) => API.post('/subscribers', data),
  unsubscribe: (phone, zone_id) => API.delete(`/subscribers/${phone}`, { params: { zone_id } }),
  list: (params) => API.get('/subscribers', { params }),
};

export const scheduleAPI = {
  list: () => API.get('/schedule'),
  update: (id, data) => API.put(`/schedule/${id}`, data),
};

export const authAPI = {
  login: (email, password) => API.post('/auth/login', { email, password }),
};

export const broadcastAPI = {
  send: (message, zone_ids) => API.post('/broadcast', { message, zone_ids }),
};

export default API;
