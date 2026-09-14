import axios from 'axios';

// Backend API Base URL (configurable via VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token to every outgoing request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('inventory_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear invalid session
      if (localStorage.getItem('inventory_token')) {
        localStorage.removeItem('inventory_token');
        localStorage.removeItem('inventory_user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Authentication API ====================
export const authAPI = {
  register: async (fullName, email, password) => {
    const res = await api.post('/auth/register', {
      full_name: fullName,
      email,
      password,
    });
    return res.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', {
      email,
      password,
    });
    return res.data;
  },

  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// ==================== Inventory API ====================
export const inventoryAPI = {
  // Dashboard real statistics for authenticated user
  getDashboard: async () => {
    const res = await api.get('/dashboard');
    return res.data;
  },

  // Products CRUD from Database
  getProducts: async (search = '', category = '') => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== 'all') params.category = category;

    const res = await api.get('/products', { params });
    return res.data;
  },

  getProductById: async (id) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  addProduct: async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
  },

  updateProduct: async (id, productData) => {
    const res = await api.put(`/products/${id}`, productData);
    return res.data;
  },

  deleteProduct: async (id) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  // Stock In / Out Operations
  addStock: async (product_id, quantity) => {
    const res = await api.post('/stock/add', { product_id, quantity: Number(quantity) });
    return res.data;
  },

  removeStock: async (product_id, quantity) => {
    const res = await api.post('/stock/remove', { product_id, quantity: Number(quantity) });
    return res.data;
  },

  // Audit History Logs
  getHistory: async () => {
    const res = await api.get('/history');
    return res.data;
  },
};

export default api;
